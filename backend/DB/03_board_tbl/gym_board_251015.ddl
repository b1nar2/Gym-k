-- [김종범]
-- =========================================================
-- 🔧 공통: 스키마 고정 (DDL에 스키마 접두어 없음)
-- =========================================================
ALTER SESSION SET CURRENT_SCHEMA = gym;

--------------------------------------------------------------------------------
-- 0) 재실행 안전 드롭
-- [김종범]
-- 이 스크립트를 여러 번 실행해도 오류가 나지 않도록, 생성할 모든 객체(테이블, 시퀀스, 트리거)를 미리 삭제합니다.
--------------------------------------------------------------------------------
BEGIN EXECUTE IMMEDIATE 'DROP TRIGGER trg_board_admin_only';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -4080 THEN RAISE; END IF; END; -- ORA-04080: 트리거가 존재하지 않으면 무시
/
BEGIN EXECUTE IMMEDIATE 'DROP TRIGGER trg_board_id';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -4080 THEN RAISE; END IF; END; -- ORA-04080: 트리거가 존재하지 않으면 무시
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE board_tbl CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END; -- ORA-00942: 테이블이 존재하지 않으면 무시
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE seq_board_id';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -2289 THEN RAISE; END IF; END; -- ORA-02289: 시퀀스가 존재하지 않으면 무시
/

--------------------------------------------------------------------------------
-- 1) board_tbl 테이블 생성
-- [김종범]
-- 게시판의 마스터 정보를 저장하는 테이블입니다.
--------------------------------------------------------------------------------
CREATE TABLE board_tbl (
    board_id       NUMBER         NOT NULL, -- 게시판 고유번호 (PK)
    board_title    VARCHAR2(50)   NOT NULL, -- 게시판 이름
    board_content  VARCHAR2(100)  NOT NULL, -- 게시판 상단 내용
    board_use      CHAR(1)        DEFAULT 'Y' NOT NULL, -- 사용 여부 ('Y'/'N')
    board_reg_date DATE           DEFAULT SYSDATE NOT NULL, -- 생성일자
    board_mod_date DATE,                     -- 수정일자
    member_id      VARCHAR2(20),             -- 담당자 회원 ID (FK)
    board_num      CHAR(2)                   -- 게시판 순서 번호 (2자리 숫자)
);

-- PK / CHECK 제약조건
ALTER TABLE board_tbl ADD CONSTRAINT board_tbl_pk    PRIMARY KEY (board_id);
ALTER TABLE board_tbl ADD CONSTRAINT board_use_CH    CHECK (board_use IN ('Y','N'));
ALTER TABLE board_tbl ADD CONSTRAINT board_num_CK    CHECK (board_num IS NULL OR REGEXP_LIKE(board_num, '^[0-9]{2}$'));
ALTER TABLE board_tbl ADD CONSTRAINT board_num_UK  UNIQUE (board_num);

--------------------------------------------------------------------------------
-- 2) 시퀀스 생성
-- [김종범]
-- board_id 값을 자동으로 증가시키기 위한 시퀀스입니다. 이 값은 자바(MyBatis)에서 직접 호출하여 사용합니다.
--------------------------------------------------------------------------------
CREATE SEQUENCE seq_board_id
    START WITH 1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE;
/

--------------------------------------------------------------------------------
-- 3) FK 설정
-- [김종범]
-- member_id가 회원 테이블(member_tbl)의 member_id를 참조하도록 외래 키를 설정합니다.
--------------------------------------------------------------------------------
ALTER TABLE board_tbl
  ADD CONSTRAINT fk_board_member
  FOREIGN KEY (member_id)
  REFERENCES member_tbl(member_id);

--------------------------------------------------------------------------------
-- 4) 트리거 
--------------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_board_admin_only
BEFORE INSERT OR UPDATE ON board_tbl
FOR EACH ROW
DECLARE
    v_role VARCHAR2(50);
BEGIN
    -- 신규 입력/수정 시 member_id가 관리자/책임자인지 확인
    SELECT member_role
      INTO v_role
      FROM member_tbl
     WHERE member_id = :NEW.member_id;

    IF v_role NOT IN ('admin', '책임자', '관리자', 'ROLE_ADMIN') THEN
        RAISE_APPLICATION_ERROR(-20001, '게시판 등록/수정은 관리자/책임자만 가능합니다.');
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20002, '유효하지 않은 회원ID입니다.');
END;
/

-- 1) 현재 스키마 고정(운영 스키마: gym) ------------------------------------
ALTER SESSION SET CURRENT_SCHEMA = gym;

-- 2) 게시판 권한 검증 트리거 교체(최고관리자 제거, 책임자 추가) ------------
CREATE OR REPLACE TRIGGER trg_board_admin_only
BEFORE INSERT OR UPDATE ON board_tbl
FOR EACH ROW
DECLARE
    v_role VARCHAR2(50);                               -- ⓐ 회원의 역할 라벨 저장 변수
BEGIN
    -- ⓑ 신규 입력/수정 시 담당자(:NEW.member_id)의 역할을 조회
    SELECT member_role
      INTO v_role
      FROM member_tbl
     WHERE member_id = :NEW.member_id;

    -- ⓒ 허용 라벨: 'admin', '관리자', '책임자'만 통과 (※ '최고관리자' 제거)
    IF v_role NOT IN ('admin', '관리자', '책임자') THEN
        RAISE_APPLICATION_ERROR(-20001, '게시판 등록/수정은 관리자/책임자만 가능합니다.');
    END IF;

EXCEPTION
    WHEN NO_DATA_FOUND THEN                               -- ⓓ 잘못된 member_id 방지
        RAISE_APPLICATION_ERROR(-20002, '유효하지 않은 회원ID입니다.');
END;
/


--------------------------------------------------------------------------------
-- 5) 더미 데이터
-- [김종범]
-- 초기 테스트를 위한 샘플 데이터를 삽입합니다. board_id는 자바 코드에서 시퀀스를 통해 자동 생성되므로 여기서는 넣지 않습니다.
--------------------------------------------------------------------------------
-- DELETE FROM board_tbl WHERE board_title IN ('공지사항', '칭찬합니다');
COMMIT;

-- (성공) admin 계정(hong10)
INSERT INTO board_tbl (
  board_id, board_title, board_content, board_use, board_reg_date, member_id
) VALUES (
  seq_board_id.NEXTVAL, '공지사항', '시스템 공지 상단 안내', 'Y', SYSDATE, 'hong10'
);

-- (성공) admin 계정(hong9)
INSERT INTO board_tbl (
  board_id, board_title, board_content, board_use, board_reg_date, member_id
) VALUES (
  seq_board_id.NEXTVAL, '칭찬합니다', '응.구라야.', 'Y', SYSDATE, 'hong9'
);

COMMIT;



-- =========================================================
-- [250922] board_tbl.board_num 중복 방지 UNIQUE 제약
-- =========================================================
ALTER SESSION SET CURRENT_SCHEMA = gym;                                -- 현재 세션 스키마를 gym으로 고정

BEGIN   -- 예외 처리 블록 시작
  EXECUTE IMMEDIATE '   -- 동적 DDL 실행 시작
    ALTER TABLE board_tbl   -- 대상 테이블: board_tbl
    ADD CONSTRAINT board_tbl_num_un UNIQUE (board_num)  -- UNIQUE 제약 추가(콘텐츠와 동일 컨셉)
  ';
EXCEPTION   -- 예외 처리
WHEN OTHERS THEN -- 모든 예외 포착
-- ORA-02261: 동일한 고유키/PK가 이미 존재 → 재실행 시 무시(기존 유니크가 있는 환경)
IF SQLCODE != -2261 THEN RAISE; END IF;                             -- 그 외 오류만 전파
END;
/



-- =========================================================
-- [251015] board_num_UK; 없애기...board_num_un과 중복되서 충돌남...
-- =========================================================
ALTER TABLE board_tbl DROP CONSTRAINT board_num_UK;

DELETE FROM board_tbl
WHERE board_num IN (
  SELECT board_num FROM board_tbl
  GROUP BY board_num
  HAVING COUNT(*) > 1
)
AND ROWID NOT IN (
  SELECT MIN(ROWID)
  FROM board_tbl
  GROUP BY board_num
);
COMMIT;

ALTER TABLE board_tbl
ADD CONSTRAINT board_num_UK UNIQUE (board_num);


--------------------------------------------------------------------------------
-- 6) 확인 조회
--------------------------------------------------------------------------------

-- 시퀀스가 현재 접속 스키마에 존재하는지 최종 확인
SELECT sequence_name FROM user_sequences WHERE sequence_name='SEQ_BOARD_ID';

SELECT
    board_id           AS "게시판ID",
    board_title        AS "게시판명",
    board_content      AS "상단내용",
    CASE board_use WHEN 'Y' THEN '사용' ELSE '미사용' END AS "사용여부",
    board_num          AS "번호(2자리)",
    TO_CHAR(board_reg_date,'YYYY-MM-DD HH24:MI') AS "생성일",
    TO_CHAR(board_mod_date,'YYYY-MM-DD HH24:MI') AS "수정일",
    member_id          AS "작성자ID(FK)"
FROM board_tbl
ORDER BY board_id;

--------------------------------------------------------------------------------
-- 7) 💀 초기화 및 삭제 구문 💀
--------------------------------------------------------------------------------
-- (데이터만 초기화)
-- DELETE FROM board_tbl;
-- COMMIT;

-- (DDL 블록까지 완전 삭제)
/*
BEGIN EXECUTE IMMEDIATE 'DROP TRIGGER trg_board_admin_only'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TRIGGER trg_board_id'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE board_tbl CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE seq_board_id'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
*/

SELECT board_id, board_title, board_num, board_use, member_id,
       TO_CHAR(board_mod_date,'YYYY-MM-DD HH24:MI') mod_at
FROM   board_tbl
WHERE  board_id = :boardId;  -- 예: 1
