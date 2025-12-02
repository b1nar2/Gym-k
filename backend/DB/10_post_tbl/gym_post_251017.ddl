/******************************************************************
-- 0) 재실행 안전 드롭
--    ※ 댓글/첨부 테이블은 드롭 대상에 포함하지 않음
******************************************************************/
BEGIN EXECUTE IMMEDIATE 'DROP TRIGGER trg_post_before_insert'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE post_tbl CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE board_post_counter'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE post_seq'; EXCEPTION WHEN OTHERS THEN NULL; END;
/

/******************************************************************
-- 1) post_tbl 테이블 생성 + [250924] 게시판별 게시글 번호(board_post_no) 추가
--    기존 컬럼/정의는 그대로 유지
******************************************************************/
CREATE TABLE post_tbl (
    post_id         NUMBER          NOT NULL,                 -- 게시글 고유번호 (PK)
    board_id        NUMBER          NOT NULL,                 -- 게시판 ID (FK → board_tbl.board_id)
    post_title      VARCHAR2(200)   NOT NULL,                 -- 게시글 제목
    post_content    CLOB            NOT NULL,                 -- 게시글 내용 (HTML 가능)
    member_id       VARCHAR2(20)    NOT NULL,                 -- 작성자 ID (FK → member_tbl.member_id)
    post_reg_date   DATE DEFAULT SYSDATE NOT NULL,            -- 등록일 (기본값 SYSDATE)
    post_mod_date   DATE,                                     -- 수정일 (수정시 갱신)
    post_view_count NUMBER DEFAULT 0,                         -- 조회수 (기본값 0)
    post_notice     CHAR(1) DEFAULT 'N' NOT NULL,             -- 공지글 여부 ('Y'/'N') 기본값 'N'
    post_secret     CHAR(1) DEFAULT 'N' NOT NULL,             -- 비밀글 여부 ('Y'/'N') 기본값 'N'
    post_type       VARCHAR2(20) DEFAULT '일반' NOT NULL,     -- 게시글 유형 ('공지','일반')
    board_post_no   NUMBER          NOT NULL                  -- [250924] 게시판별 일련번호(1부터 증가, (board_id,board_post_no) 유니크)
);

-- 게시판별 카운터 테이블 (없으면 만들어 보관)
CREATE TABLE board_post_counter (
    board_id  NUMBER       NOT NULL,  -- 게시판 ID
    last_no   NUMBER       NOT NULL,  -- 마지막 발급 번호
    CONSTRAINT board_post_counter_pk PRIMARY KEY (board_id)
);

-- 카운터 초기값(선택): 필요시 특정 게시판에 0 세팅
-- MERGE INTO board_post_counter c USING (SELECT 1 AS board_id FROM dual) d
-- ON (c.board_id = d.board_id)
-- WHEN NOT MATCHED THEN INSERT (board_id,last_no) VALUES (d.board_id,0);

/******************************************************************
-- 2) 컬럼/테이블 주석
******************************************************************/
COMMENT ON TABLE post_tbl IS '게시글 테이블';
COMMENT ON COLUMN post_tbl.post_id         IS '게시글 고유번호 (PK)';
COMMENT ON COLUMN post_tbl.board_id        IS '게시판 ID (FK → board_tbl.board_id)';
COMMENT ON COLUMN post_tbl.post_title      IS '게시글 제목';
COMMENT ON COLUMN post_tbl.post_content    IS '게시글 내용 (HTML 가능)';
COMMENT ON COLUMN post_tbl.member_id       IS '작성자 ID (FK → member_tbl.member_id)';
COMMENT ON COLUMN post_tbl.post_reg_date   IS '등록일 (기본값 SYSDATE)';
COMMENT ON COLUMN post_tbl.post_mod_date   IS '수정일 (수정시 갱신)';
COMMENT ON COLUMN post_tbl.post_view_count IS '조회수 (기본값 0)';
COMMENT ON COLUMN post_tbl.post_notice     IS '공지글 여부 (Y/N)';
COMMENT ON COLUMN post_tbl.post_secret     IS '비밀글 여부 (Y/N)';
COMMENT ON COLUMN post_tbl.post_type       IS '게시글 유형 (공지/일반)';
COMMENT ON COLUMN post_tbl.board_post_no   IS '[250924] 게시판별 일련번호 (board_id별 1부터 증가, 유니크)';

COMMENT ON TABLE board_post_counter        IS '게시판별 게시글 일련번호 카운터 테이블';
COMMENT ON COLUMN board_post_counter.board_id IS '게시판 ID';
COMMENT ON COLUMN board_post_counter.last_no  IS '마지막 발급 번호';

/******************************************************************
-- 3) 제약조건
******************************************************************/
ALTER TABLE post_tbl ADD CONSTRAINT post_tbl_pk PRIMARY KEY (post_id);
ALTER TABLE post_tbl ADD CONSTRAINT post_tbl_uk_board_no UNIQUE (board_id, board_post_no);

-- FK (기존 참조 테이블명을 그대로 사용)
ALTER TABLE post_tbl ADD CONSTRAINT post_tbl_fk_board
    FOREIGN KEY (board_id) REFERENCES board_tbl (board_id);

ALTER TABLE post_tbl ADD CONSTRAINT post_tbl_fk_member
    FOREIGN KEY (member_id) REFERENCES member_tbl (member_id);

-- CHECK 제약
ALTER TABLE post_tbl ADD CONSTRAINT post_tbl_ck_notice CHECK (post_notice IN ('Y','N'));
ALTER TABLE post_tbl ADD CONSTRAINT post_tbl_ck_secret CHECK (post_secret IN ('Y','N'));
ALTER TABLE post_tbl ADD CONSTRAINT post_tbl_ck_type   CHECK (post_type IN ('공지','일반'));

/******************************************************************
-- 4) 시퀀스 (전역 PK용)
******************************************************************/
CREATE SEQUENCE post_seq
    START WITH 1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE;

/******************************************************************
-- 5) 트리거
--    - 전역 PK(post_seq) 자동 채번
--    - board_post_counter로 게시판별 일련번호 관리
--    - 입력이 누락된 Y/N 값은 기본값 적용(선택적 보정)
******************************************************************/
CREATE OR REPLACE TRIGGER trg_post_before_insert
BEFORE INSERT ON post_tbl
FOR EACH ROW
DECLARE
    v_last NUMBER;
BEGIN
    -- PK 자동 채번
    IF :NEW.post_id IS NULL THEN
        :NEW.post_id := post_seq.NEXTVAL;
    END IF;

    -- 게시판별 카운터 잠금 조회, 없으면 생성
    BEGIN
        SELECT last_no INTO v_last
        FROM board_post_counter
        WHERE board_id = :NEW.board_id
        FOR UPDATE;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            INSERT INTO board_post_counter (board_id, last_no) VALUES (:NEW.board_id, 0);
            v_last := 0;
    END;

    -- 다음 번호 계산 및 반영
    v_last := v_last + 1;
    UPDATE board_post_counter SET last_no = v_last WHERE board_id = :NEW.board_id;

    -- 레코드에 게시판별 번호 주입
    :NEW.board_post_no := v_last;

    -- 선택적 보정: NULL로 들어오면 기본값 적용
    IF :NEW.post_notice IS NULL THEN :NEW.post_notice := 'N'; END IF;
    IF :NEW.post_secret IS NULL THEN :NEW.post_secret := 'N'; END IF;
    IF :NEW.post_type   IS NULL THEN :NEW.post_type   := '일반'; END IF;
END;
/
SHOW ERRORS TRIGGER trg_post_before_insert;

-- 1) 같은 이름의 객체를 전부 안전 드롭(종류 불문)
BEGIN EXECUTE IMMEDIATE 'DROP VIEW board_post_seq_tbl'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE board_post_seq_tbl'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SYNONYM board_post_seq_tbl'; EXCEPTION WHEN OTHERS THEN NULL; END;
/

-- 2) 호환 뷰 생성(앱 수정 없이 동작)
CREATE VIEW board_post_seq_tbl AS
SELECT board_id, last_no AS last_post_id
FROM board_post_counter;

--------------------------------------------------------------------------------

-- 🔧 [251017] 게시글 첨부파일 경로 컬럼 추가
-- 목적: 게시글 등록 시 단일 첨부파일(썸네일 등)의 상대경로 저장용
-- 적용대상: post_tbl
-- 실행전제: 기존 컬럼/데이터 보존, DROP 없음

BEGIN
  EXECUTE IMMEDIATE '
    ALTER TABLE post_tbl 
    ADD (post_file_path VARCHAR2(300))
  ';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -1430 THEN  -- ORA-01430: 이미 존재하는 컬럼
      RAISE;
    END IF;
END;
/

-- 🔍 주석 추가
COMMENT ON COLUMN post_tbl.post_file_path IS '첨부파일 경로(단일 업로드용, 썸네일/첨부파일 등)';

-- ✅ 확인 쿼리
SELECT 
    column_name, data_type, data_length, nullable
FROM user_tab_columns
WHERE table_name = 'POST_TBL'
  AND column_name = 'POST_FILE_PATH';

-- ✅ 데이터 확인 (기존 게시글 + 컬럼 표시)
SELECT post_id, post_title, post_file_path
FROM post_tbl
ORDER BY post_id;


/*-------------------------------------------------------------------------------
확인 조회(+첨부파일 포함)
-------------------------------------------------------------------------------*/
WITH f_agg AS (
  SELECT
      CAST(f.file_target_id AS NUMBER) AS post_id,                 -- post_id로 캐스팅
      COUNT(*) AS attach_cnt,                                      -- 첨부 개수
      LISTAGG(f.file_name || ' (' || f.file_id || ')', ', ')
        WITHIN GROUP (ORDER BY f.file_id) AS attach_list           -- 첨부 목록
  FROM file_tbl f
  WHERE f.file_target_type = 'post'
  GROUP BY CAST(f.file_target_id AS NUMBER)
),
c_agg AS (
  SELECT
      c.post_id,                                                   -- ✔ comments_tbl.post_id
      COUNT(*) AS comment_cnt,                                     -- 댓글 개수
      LISTAGG(
        c.member_id || ':' || SUBSTR(c.content, 1, 50)             -- ✔ VARCHAR2 → SUBSTR
        || ' (' || c.comments_id || ')',
        ' | '
      ) WITHIN GROUP (ORDER BY c.comments_id) AS comment_list      -- ✔ PK 컬럼: comments_id
  FROM comments_tbl c                                              -- ✔ 실제 테이블명: comments_tbl
  GROUP BY c.post_id
)
SELECT
    p.board_id        AS "게시판ID (FK)",
    p.post_id         AS "게시글ID (PK)",
    p.board_post_no   AS "게시글번호",
    p.post_title      AS "제목",
    p.member_id       AS "작성자ID (FK)",
    CASE p.post_notice WHEN 'Y' THEN '공지' ELSE '일반' END AS "공지여부",
    p.post_secret     AS "비밀글(Y/N)",
    p.post_type       AS "게시글유형",
    p.post_content    AS "게시글내용",
    p.post_view_count AS "조회수",
    TO_CHAR(p.post_reg_date,'YYYY-MM-DD HH24:MI')           AS "등록일",
    NVL(TO_CHAR(p.post_mod_date,'YYYY-MM-DD HH24:MI'), '-') AS "수정일",
    NVL(a.attach_cnt, 0)                                     AS "첨부개수",
    NVL(a.attach_list, '-')                                  AS "첨부파일목록(파일명(파일ID))",
    NVL(ca.comment_cnt, 0)                                   AS "댓글개수",                    -- ★ 추가
    NVL(ca.comment_list, '-')                                AS "댓글목록(작성자:내용(댓글ID))" -- ★ 추가
    ,p.post_file_path AS "첨부파일 경로"
FROM post_tbl p
LEFT JOIN f_agg a  ON a.post_id = p.post_id
LEFT JOIN c_agg ca ON ca.post_id = p.post_id
ORDER BY p.board_id, p.board_post_no;


/******************************************************************
-- 7-1) 💀 데이터 초기화 (안전 모드) 💀
--      ※ DDL은 보존, 데이터만 삭제
--      ※ 댓글/첨부는 "선택" 삭제. 원치 않으면 주석 유지
******************************************************************/
-- 첨부(선택)
-- DELETE FROM post_file_tbl;
-- DELETE FROM post_attach_tbl;

-- 댓글(선택)
-- DELETE FROM post_comment_tbl;

-- 게시글
-- DELETE FROM post_tbl;

-- 카운터(게시판별 번호 초기화)
-- DELETE FROM board_post_counter;

-- 시퀀스 재시작(필요 시)
-- DROP SEQUENCE post_seq;
-- CREATE SEQUENCE post_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

-- COMMIT;

 /******************************************************************
-- 7-2) 💀 ddl 블록까지 안전 삭제 💀
--      ※ 댓글/첨부 객체는 대상 아님
******************************************************************/
-- DROP TRIGGER trg_post_before_insert;
-- DROP TABLE post_tbl CASCADE CONSTRAINTS;
-- DROP TABLE board_post_counter;
-- DROP SEQUENCE post_seq;
