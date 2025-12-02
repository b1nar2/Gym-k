-- ALTER SESSION SET CURRENT_SCHEMA = gym;

-- 연결 자체 확인
SELECT 1 FROM DUAL;

--------------------------------------------------------------------------------
-- 1) member_tbl  ← 대부분 테이블의 부모
--    ✨ 메인결제수단 컬럼(member_manipay) 포함 버전
--------------------------------------------------------------------------------
CREATE TABLE member_tbl (
    member_id        VARCHAR2(20)    NOT NULL,                        -- 회원 ID (PK)
    member_pw        VARCHAR2(20)    NOT NULL,                        -- 비밀번호
    member_name      VARCHAR2(100)   NOT NULL,                        -- 이름
    member_gender    CHAR(1)         NOT NULL,                        -- 성별 ('m','f')
    member_email     VARCHAR2(50)    NOT NULL,                        -- 이메일
    member_mobile    VARCHAR2(13)    NOT NULL,                        -- 휴대폰 번호
    member_phone     VARCHAR2(13),                              -- 일반 전화번호
    zip              CHAR(5),                                   -- 우편번호
    road_address     NVARCHAR2(50),                             -- 도로명 주소
    jibun_address    NVARCHAR2(50),                             -- 지번 주소
    detail_address   NVARCHAR2(50),                             -- 상세 주소
    member_birthday  DATE,                                      -- 생년월일
    member_manipay   VARCHAR2(20)   DEFAULT 'account' NOT NULL, -- 주요 결제수단('account','card')
    member_joindate  DATE           DEFAULT SYSDATE NOT NULL,         -- 가입일 (기본값 SYSDATE)
    member_role      VARCHAR2(10)   DEFAULT 'user'    NOT NULL,       -- 권한 ('user','admin')
    admin_type       VARCHAR2(20)   DEFAULT '관리자'                   -- 관리자 역할 세분화(책임자/관리자/강사)
);

-------------------------------------------------------------------------------
-- [추가] 2025-09-15  암호화 기능 
-- 목적: BCrypt 해시(60바이트) 저장을 위해 길이 확장, 그 외 컬럼/제약/트리거는 미변경
ALTER TABLE member_tbl
MODIFY (member_pw VARCHAR2(60 BYTE));  -- 컬럼명 그대로 유지, 길이만 60로

-- 1) PW 컬럼 길이 적용 확인(= 60)
SELECT column_name, data_type, data_length
FROM   user_tab_columns
WHERE  table_name='MEMBER_TBL' AND column_name='MEMBER_PW';

-- 2) 더미 계정 PW가 평문이면 아직 인코딩 전(가입/수정시 BCrypt encode() 필요)
SELECT member_id, member_pw, LENGTH(member_pw) AS len
FROM   member_tbl
WHERE  member_id LIKE 'hong%';

--------------------------------------------------------------------------------
-- 2) 컬럼/테이블 주석
--------------------------------------------------------------------------------
COMMENT ON TABLE  member_tbl                      IS '회원정보';
COMMENT ON COLUMN member_tbl.member_id            IS '회원 ID (PK)';
COMMENT ON COLUMN member_tbl.member_pw            IS '비밀번호';
COMMENT ON COLUMN member_tbl.member_name          IS '이름';
COMMENT ON COLUMN member_tbl.member_gender        IS '성별 (m/f)';
COMMENT ON COLUMN member_tbl.member_email         IS '이메일';
COMMENT ON COLUMN member_tbl.member_mobile        IS '휴대폰 번호';
COMMENT ON COLUMN member_tbl.member_phone         IS '일반 전화번호';
COMMENT ON COLUMN member_tbl.zip                  IS '우편번호';
COMMENT ON COLUMN member_tbl.road_address         IS '도로명 주소';
COMMENT ON COLUMN member_tbl.jibun_address        IS '지번 주소';
COMMENT ON COLUMN member_tbl.detail_address       IS '상세 주소';
COMMENT ON COLUMN member_tbl.member_birthday      IS '생년월일';
COMMENT ON COLUMN member_tbl.member_manipay       IS '주요 결제수단 (account=계좌 / card=카드)';
COMMENT ON COLUMN member_tbl.member_joindate      IS '가입일 (기본값 SYSDATE)';
COMMENT ON COLUMN member_tbl.member_role          IS '권한 (user/admin), 기본값 user';
COMMENT ON COLUMN member_tbl.admin_type           IS '관리자 역할(책임자/관리자/강사), 기본값 관리자';

--------------------------------------------------------------------------------
-- 3) 제약조건
--------------------------------------------------------------------------------
ALTER TABLE member_tbl ADD CONSTRAINT member_tbl_pk     PRIMARY KEY (member_id);
ALTER TABLE member_tbl ADD CONSTRAINT member_gender_ch  CHECK (member_gender IN ('m','f'));
ALTER TABLE member_tbl ADD CONSTRAINT member_role_ch    CHECK (member_role   IN ('user','admin'));
ALTER TABLE member_tbl ADD CONSTRAINT admin_type_ch
  CHECK ( member_role <> 'admin' OR admin_type IN ('책임자','관리자','강사') );
ALTER TABLE member_tbl ADD CONSTRAINT member_manipay_ch CHECK (member_manipay IN ('account','card'));
ALTER TABLE member_tbl ADD CONSTRAINT member_email_un  UNIQUE (member_email);
ALTER TABLE member_tbl ADD CONSTRAINT member_mobile_un UNIQUE (member_mobile);

--------------------------------------------------------------------------------
-- 4) 트리거: 주요 결제수단 무결성 검증
--------------------------------------------------------------------------------
BEGIN
  EXECUTE IMMEDIATE 'DROP TRIGGER trg_member_manipay_chk';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -4080 THEN RAISE; END IF;
END;
/
CREATE OR REPLACE TRIGGER trg_member_manipay_chk
BEFORE UPDATE OF member_manipay ON member_tbl
FOR EACH ROW
DECLARE
    v_cnt NUMBER;
BEGIN
    IF :NEW.member_manipay = 'account' THEN
        SELECT COUNT(*) INTO v_cnt
          FROM account_tbl
         WHERE member_id    = :NEW.member_id
           AND account_main = 'Y';
        IF v_cnt = 0 THEN
            RAISE_APPLICATION_ERROR(-20061,
              '주요 결제수단이 계좌로 설정되었으나 대표계좌가 없습니다. 먼저 대표계좌를 지정하세요.');
        END IF;
    ELSIF :NEW.member_manipay = 'card' THEN
        SELECT COUNT(*) INTO v_cnt
          FROM card_tbl
         WHERE member_id = :NEW.member_id
           AND card_main = 'Y';
        IF v_cnt = 0 THEN
            RAISE_APPLICATION_ERROR(-20062,
              '주요 결제수단이 카드로 설정되었으나 대표카드가 없습니다. 먼저 대표카드를 지정하세요.');
        END IF;
    END IF;
END;
/
ALTER TRIGGER trg_member_manipay_chk ENABLE;

--------------------------------------------------------------------------------
-- 4-2) 트리거(2) 250927 추가사항
--------------------------------------------------------------------------------
BEGIN EXECUTE IMMEDIATE 'DROP TRIGGER TRG_MEMBER_CASCADE_DELETE'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
CREATE OR REPLACE PACKAGE trg_control AS g_skip_account_trigger BOOLEAN := FALSE; END trg_control;
/
CREATE OR REPLACE TRIGGER trg_account_block_delete_main
BEFORE DELETE ON account_tbl
FOR EACH ROW
BEGIN
IF trg_control.g_skip_account_trigger THEN RETURN; END IF;
IF :OLD.account_main = 'Y' THEN RAISE_APPLICATION_ERROR(-20041,'대표계좌는 단독 삭제 불가'); END IF;
END;
/
ALTER TABLE account_tbl  DROP CONSTRAINT fk_account_member;
ALTER TABLE account_tbl  ADD  CONSTRAINT fk_account_member  FOREIGN KEY (member_id) REFERENCES member_tbl(member_id) ON DELETE CASCADE;
ALTER TABLE card_tbl     DROP CONSTRAINT fk_card_member;
ALTER TABLE card_tbl     ADD  CONSTRAINT fk_card_member   FOREIGN KEY (member_id) REFERENCES member_tbl(member_id) ON DELETE CASCADE;
ALTER TABLE payment_tbl  DROP CONSTRAINT fk_payment_account;
ALTER TABLE payment_tbl  ADD  CONSTRAINT fk_payment_account FOREIGN KEY (account_id) REFERENCES account_tbl(account_id) ON DELETE CASCADE;
ALTER TABLE payment_tbl  DROP CONSTRAINT fk_payment_card;
ALTER TABLE payment_tbl  ADD  CONSTRAINT fk_payment_card    FOREIGN KEY (card_id)    REFERENCES card_tbl(card_id)    ON DELETE CASCADE;
ALTER TABLE payment_tbl  DROP CONSTRAINT fk_payment_member;
CREATE OR REPLACE TRIGGER trg_member_cascade_flag
FOR DELETE ON member_tbl
COMPOUND TRIGGER
  BEFORE STATEMENT IS
  BEGIN
    trg_control.g_skip_account_trigger := TRUE;
  END BEFORE STATEMENT;
  AFTER STATEMENT IS
  BEGIN
    trg_control.g_skip_account_trigger := FALSE;
  END AFTER STATEMENT;
END;
/

--------------------------------------------------------------------------------
-- 5) [신규 트리거] 회원 주소·연락처 입력값 자동 NULL 보정
--------------------------------------------------------------------------------
BEGIN
  EXECUTE IMMEDIATE 'DROP TRIGGER trg_member_null_cleanup';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -4080 THEN RAISE; END IF;
END;
/
CREATE OR REPLACE TRIGGER trg_member_null_cleanup
BEFORE INSERT OR UPDATE ON member_tbl
FOR EACH ROW
BEGIN
  IF :NEW.zip IS NOT NULL THEN
    IF TRIM(:NEW.zip) IS NULL OR LOWER(TRIM(:NEW.zip)) = 'string' THEN
      :NEW.zip := NULL;
    END IF;
  END IF;
  IF :NEW.member_phone IS NOT NULL THEN
    IF TRIM(:NEW.member_phone) IS NULL OR LOWER(TRIM(:NEW.member_phone)) = 'string' THEN
      :NEW.member_phone := NULL;
    END IF;
  END IF;
  IF :NEW.road_address IS NOT NULL THEN
    IF TRIM(:NEW.road_address) IS NULL OR LOWER(TRIM(:NEW.road_address)) = 'string' THEN
      :NEW.road_address := NULL;
    END IF;
  END IF;
  IF :NEW.jibun_address IS NOT NULL THEN
    IF TRIM(:NEW.jibun_address) IS NULL OR LOWER(TRIM(:NEW.jibun_address)) = 'string' THEN
      :NEW.jibun_address := NULL;
    END IF;
  END IF;
  IF :NEW.detail_address IS NOT NULL THEN
    IF TRIM(:NEW.detail_address) IS NULL OR LOWER(TRIM(:NEW.detail_address)) = 'string' THEN
      :NEW.detail_address := NULL;
    END IF;
  END IF;
END;
/
SELECT trigger_name, status, triggering_event, trigger_type
  FROM user_triggers
 WHERE trigger_name = 'TRG_MEMBER_NULL_CLEANUP';

--------------------------------------------------------------------------------
-- 6) 권한/관리자 유형 부여 + 더미데이터
--------------------------------------------------------------------------------
BEGIN
  FOR i IN 1..10 LOOP
    DELETE FROM member_tbl WHERE member_id = 'hong' || TO_CHAR(i);
    INSERT INTO member_tbl (...);
  END LOOP;
  COMMIT;
END;
/
UPDATE member_tbl SET member_role='user', admin_type=NULL WHERE member_id IN ('hong1','hong2','hong3','hong4','hong5','hong6','hong7');
UPDATE member_tbl SET member_role='admin', admin_type='책임자' WHERE member_id='hong8';
UPDATE member_tbl SET member_role='admin', admin_type='강사' WHERE member_id='hong9';
UPDATE member_tbl SET member_role='admin', admin_type='관리자' WHERE member_id='hong10';
COMMIT;

--------------------------------------------------------------------------------
-- 7) admin_type NULL 보정 트리거 (INSERT용)
--------------------------------------------------------------------------------
BEGIN
  EXECUTE IMMEDIATE 'DROP TRIGGER trg_member_admin_type_on_ins';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE != -4080 THEN RAISE; END IF;
END;
/
CREATE OR REPLACE TRIGGER trg_member_admin_type_on_ins
BEFORE INSERT ON member_tbl
FOR EACH ROW
BEGIN
  IF :NEW.member_role <> 'admin' THEN
    :NEW.admin_type := NULL;
  END IF;
END;
/

--------------------------------------------------------------------------------
-- 8) 확인 쿼리
--------------------------------------------------------------------------------
SELECT
    member_id           AS "회원ID",
    member_name         AS "회원명",
    CASE member_gender WHEN 'm' THEN '남' WHEN 'f' THEN '여' END "성별",
    member_phone        AS "연락처",
    member_mobile       AS "휴대폰",
    member_email        AS "이메일",
    TO_CHAR(member_birthday, 'YYYY-MM-DD') AS "생년월일",
    member_manipay      AS "주요결제수단",
    TO_CHAR(member_joindate, 'YYYY-MM-DD") AS "가입일",
    member_role         AS "권한",
    admin_type          AS "관리자유형",
    member_pw
FROM member_tbl;
-- ORDER BY member_id;

--------------------------------------------------------------------------------
-- 9-1) 💀 데이터 초기화 (안전 모드) 💀
--      - 더미(hong1~hong10) 회원만 정리 / 구조·제약 유지
--------------------------------------------------------------------------------
DELETE FROM member_tbl WHERE member_id LIKE 'hong%';
COMMIT;

--------------------------------------------------------------------------------
-- 9-2) 💀 DDL 블록까지 안전 삭제 💀
--      - 실제 구조 제거 (테스트 종료 시 사용)
--------------------------------------------------------------------------------
BEGIN EXECUTE IMMEDIATE 'DROP TRIGGER trg_member_manipay_chk'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE member_tbl CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
