/* ======================================================================
   결제 및 결제로그 테이블 통합 DDL
   (payment_tbl + paylog_tbl + sequence + trigger)
   ====================================================================== */

--------------------------------------------------------------------------------
-- 0) 재실행 안전 DROP (있으면 삭제, 없으면 무시)
--------------------------------------------------------------------------------
BEGIN EXECUTE IMMEDIATE 'DROP TABLE paylog_tbl CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE payment_tbl CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE paylog_seq';  EXCEPTION WHEN OTHERS THEN IF SQLCODE != -2289 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP SEQUENCE payment_seq'; EXCEPTION WHEN OTHERS THEN IF SQLCODE != -2289 THEN RAISE; END IF; END;
/

--------------------------------------------------------------------------------
-- 1) 결제 테이블
--------------------------------------------------------------------------------
CREATE TABLE payment_tbl (
    payment_id      NUMBER        NOT NULL,
    member_id       VARCHAR2(20)  NOT NULL,
    account_id      NUMBER,
    card_id         NUMBER,
    resv_id         NUMBER        NOT NULL,
    payment_money   NUMBER        NOT NULL,
    payment_method  VARCHAR2(20)  DEFAULT '계좌' NOT NULL,
    payment_status  VARCHAR2(20)  DEFAULT '예약' NOT NULL,
    payment_date    DATE          DEFAULT SYSDATE NOT NULL,
    card_installment NUMBER(2)    DEFAULT 0 NOT NULL
);

COMMENT ON TABLE  payment_tbl IS '결제정보';
COMMENT ON COLUMN payment_tbl.card_installment IS '카드 결제 시 할부 개월수 (0=일시불, 2~12개월)';

ALTER TABLE payment_tbl ADD CONSTRAINT payment_tbl_pk PRIMARY KEY (payment_id);
ALTER TABLE payment_tbl ADD CONSTRAINT payment_method_ch CHECK (payment_method IN ('카드','계좌'));
ALTER TABLE payment_tbl ADD CONSTRAINT payment_status_ch CHECK (payment_status IN ('완료','예약','취소'));
ALTER TABLE payment_tbl ADD CONSTRAINT chk_payment_card_installment
CHECK ((payment_method = '카드' AND card_installment IN (0,2,3,4,5,6,12))
    OR (payment_method = '계좌' AND card_installment = 0));
ALTER TABLE payment_tbl ADD CONSTRAINT payment_method_fk_rule CHECK (
       (payment_method = '계좌' AND account_id IS NOT NULL AND card_id IS NULL)
    OR (payment_method = '카드' AND card_id   IS NOT NULL AND account_id IS NULL)
);

-- FK
ALTER TABLE payment_tbl ADD CONSTRAINT fk_payment_member
    FOREIGN KEY (member_id) REFERENCES member_tbl(member_id);
ALTER TABLE payment_tbl ADD CONSTRAINT fk_payment_account
    FOREIGN KEY (account_id) REFERENCES account_tbl(account_id) ON DELETE SET NULL;
ALTER TABLE payment_tbl ADD CONSTRAINT fk_payment_card
    FOREIGN KEY (card_id) REFERENCES card_tbl(card_id) ON DELETE SET NULL;
ALTER TABLE payment_tbl ADD CONSTRAINT fk_payment_reservation
    FOREIGN KEY (resv_id) REFERENCES reservation_tbl(resv_id);

-- 인덱스
CREATE INDEX idx_payment_member ON payment_tbl(member_id);
CREATE INDEX idx_payment_resv   ON payment_tbl(resv_id);
CREATE INDEX idx_payment_date   ON payment_tbl(payment_date);

--------------------------------------------------------------------------------
-- 2) 결제로그 테이블
--------------------------------------------------------------------------------
CREATE TABLE paylog_tbl (
    paylog_id               NUMBER        NOT NULL,
    payment_id              NUMBER        NOT NULL,
    paylog_type             VARCHAR2(20)  NOT NULL,
    paylog_before_status    VARCHAR2(20),
    paylog_after_status     VARCHAR2(20),
    paylog_money            NUMBER,
    paylog_method           VARCHAR2(20),
    card_installment        NUMBER(2),
    paylog_manager          VARCHAR2(20),
    paylog_memo             VARCHAR2(200),
    paylog_date             DATE DEFAULT SYSDATE NOT NULL
);

COMMENT ON TABLE paylog_tbl IS '결제로그';
COMMENT ON COLUMN paylog_tbl.card_installment IS '결제 시 카드 할부 개월수 (0=일시불, 2~12개월)';

ALTER TABLE paylog_tbl ADD CONSTRAINT paylog_tbl_pk PRIMARY KEY (paylog_id);
ALTER TABLE paylog_tbl ADD CONSTRAINT fk_paylog_payment FOREIGN KEY (payment_id)
    REFERENCES payment_tbl(payment_id) ON DELETE CASCADE;
ALTER TABLE paylog_tbl ADD CONSTRAINT paylog_type_ch CHECK (paylog_type IN ('결제','취소','대기'));

CREATE INDEX idx_paylog_payment ON paylog_tbl(payment_id);
CREATE INDEX idx_paylog_date    ON paylog_tbl(paylog_date);

--------------------------------------------------------------------------------
-- 3) 시퀀스
--------------------------------------------------------------------------------
CREATE SEQUENCE payment_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE paylog_seq   START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

--------------------------------------------------------------------------------
-- 4) 트리거
--------------------------------------------------------------------------------
-- 기존꺼 비활성화
ALTER TRIGGER trg_payment_done_to_reservation DISABLE;

-- (1) 결제 PK 자동 세팅
CREATE OR REPLACE TRIGGER trg_payment_pk_seq
BEFORE INSERT ON payment_tbl
FOR EACH ROW
BEGIN
  IF :NEW.payment_id IS NULL THEN
    :NEW.payment_id := payment_seq.NEXTVAL;
  END IF;
END;
/

-- (2) 결제 → 결제로그 자동 기록
CREATE OR REPLACE TRIGGER trg_payment_to_paylog
AFTER INSERT OR UPDATE ON payment_tbl
FOR EACH ROW
DECLARE
  v_type VARCHAR2(20);
BEGIN
  IF :NEW.payment_status = '완료' THEN
    v_type := '결제';
  ELSIF :NEW.payment_status = '취소' THEN
    v_type := '취소';
  ELSE
    v_type := '대기';
  END IF;

  IF INSERTING THEN
    INSERT INTO paylog_tbl(
      paylog_id, payment_id, paylog_type,
      paylog_before_status, paylog_after_status,
      paylog_money, paylog_method, card_installment, paylog_date
    ) VALUES (
      paylog_seq.NEXTVAL, :NEW.payment_id, v_type,
      NULL, :NEW.payment_status,
      :NEW.payment_money, :NEW.payment_method, :NEW.card_installment, SYSDATE
    );
  ELSIF UPDATING THEN
    IF NVL(:NEW.payment_status,'§') <> NVL(:OLD.payment_status,'§')
       OR NVL(:NEW.payment_money,-1) <> NVL(:OLD.payment_money,-1)
       OR NVL(:NEW.payment_method,'§') <> NVL(:OLD.payment_method,'§')
       OR NVL(:NEW.card_installment,-1) <> NVL(:OLD.card_installment,-1)
    THEN
      INSERT INTO paylog_tbl(
        paylog_id, payment_id, paylog_type,
        paylog_before_status, paylog_after_status,
        paylog_money, paylog_method, card_installment, paylog_date
      ) VALUES (
        paylog_seq.NEXTVAL, :OLD.payment_id, v_type,
        :OLD.payment_status, :NEW.payment_status,
        :NEW.payment_money, :NEW.payment_method, :NEW.card_installment, SYSDATE
      );
    END IF;
  END IF;
END;
/

-- (3) 결제 상태 → 예약 상태 동기화
CREATE OR REPLACE TRIGGER trg_payment_done_to_reservation
AFTER UPDATE OF payment_status ON payment_tbl
FOR EACH ROW
WHEN ( NEW.payment_status IN ('완료','취소')
       AND NVL(OLD.payment_status,'§') <> NEW.payment_status )
BEGIN
  IF :NEW.payment_status = '완료' THEN
    UPDATE reservation_tbl
       SET resv_status = '완료'
     WHERE resv_id = :NEW.resv_id
       AND resv_status NOT IN ('완료','취소');
  ELSIF :NEW.payment_status = '취소' THEN
    UPDATE reservation_tbl
       SET resv_status = '취소'
     WHERE resv_id = :NEW.resv_id
       AND resv_status <> '취소';
  END IF;
END;
/

--------------------------------------------------------------------------------
-- 5) 💀(선택) 테스트 데이터 초기화 블록 (원할 때만 수동 실행)
--------------------------------------------------------------------------------
/*
TRUNCATE TABLE paylog_tbl;
TRUNCATE TABLE payment_tbl;
DROP SEQUENCE paylog_seq;
DROP SEQUENCE payment_seq;
CREATE SEQUENCE payment_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
CREATE SEQUENCE paylog_seq START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;
*/

--------------------------------------------------------------------------------
-- 6) 점검 쿼리
--------------------------------------------------------------------------------
SELECT * FROM user_triggers WHERE table_name IN ('PAYMENT_TBL','PAYLOG_TBL');
SELECT * FROM user_sequences WHERE sequence_name IN ('PAYMENT_SEQ','PAYLOG_SEQ');
SELECT COUNT(*) AS PAYMENT_ROWS FROM payment_tbl;
SELECT COUNT(*) AS PAYLOG_ROWS FROM paylog_tbl;
