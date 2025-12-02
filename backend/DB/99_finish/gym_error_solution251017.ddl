--------------------------------------------------------------------------------
/* 💡 결제↔예약 상호 동기화 트리거 (양방향 교착 방지용 통합 버전)
java.sql.SQLSyntaxErrorException: ORA-04091: GYM.RESERVATION_TBL 테이블이 변경되어 트리거/함수가 볼 수 없습니다.
ORA-06512: "GYM.TRG_PAYMENT_DONE_TO_RESERVATION",  3행
ORA-04088: 트리거 'GYM.TRG_PAYMENT_DONE_TO_RESERVATION'의 수행시 오류
ORA-06512: "GYM.TRG_RESERVATION_TO_PAYMENT",  6행
ORA-04088: 트리거 'GYM.TRG_RESERVATION_TO_PAYMENT'의 수행시 오류
해당 에러 해결법
*/
--------------------------------------------------------------------------------

-- 기존 트리거 제거 (재실행 안전)
BEGIN EXECUTE IMMEDIATE 'DROP TRIGGER trg_payment_done_to_reservation';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -4080 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TRIGGER trg_reservation_to_payment';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -4080 THEN RAISE; END IF; END;
/

--------------------------------------------------------------------------------
-- 통합 트리거 생성
--------------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_payment_reserv_sync
FOR UPDATE OF resv_status ON reservation_tbl
COMPOUND TRIGGER

  -- 변경된 예약 목록을 일시 저장
  TYPE t_resv_list IS TABLE OF reservation_tbl.resv_id%TYPE INDEX BY PLS_INTEGER;
  g_resv_ids t_resv_list;

  AFTER EACH ROW IS
  BEGIN
    g_resv_ids(g_resv_ids.COUNT + 1) := :NEW.resv_id;
  END AFTER EACH ROW;

  AFTER STATEMENT IS
  BEGIN
    -- 예약 완료 → 결제 완료
    UPDATE payment_tbl p
       SET p.payment_status = '완료'
     WHERE p.resv_id IN (SELECT COLUMN_VALUE FROM TABLE(g_resv_ids))
       AND EXISTS (
             SELECT 1 FROM reservation_tbl r
              WHERE r.resv_id = p.resv_id
                AND r.resv_status = '완료')
       AND p.payment_status != '완료';

    -- 예약 취소 → 결제 취소
    UPDATE payment_tbl p
       SET p.payment_status = '취소'
     WHERE p.resv_id IN (SELECT COLUMN_VALUE FROM TABLE(g_resv_ids))
       AND EXISTS (
             SELECT 1 FROM reservation_tbl r
              WHERE r.resv_id = p.resv_id
                AND r.resv_status = '취소')
       AND p.payment_status != '취소';
  END AFTER STATEMENT;

END;
/
ALTER TRIGGER trg_payment_reserv_sync ENABLE;

--------------------------------------------------------------------------------
/*
이 상태에서 예약신청했음에도 아래의 에러가 뜬다면....
ORA-04098: 'GYM.TRG_PAYMENT_RESERV_SYNC' 트리거가 부적합하며 재검증을 실패
이걸 방지하기 위해 해당 트리거와 오류메시지를 확인해야 함
*/
-- (1) 트리거 상태 확인
SELECT trigger_name, status
  FROM user_triggers
 WHERE trigger_name = 'TRG_PAYMENT_RESERV_SYNC';

-- (2) 오류 메시지 구체 확인
SHOW ERRORS TRIGGER trg_payment_reserv_sync;

-- PLS-00642: local collection types not allowed in SQL statements
-- ORA-00904: "RESV_ID": invalid identifier
-- 해당 에러 2개 중 하나가 발생하면 아래의 (2-1) 트리거 실행

-- ORA-22905: 내포되지 않은 테이블 항목으로부터 행을 가져올 수 없습니다
-- PLS-00382: 식이 잘못된 유형입니다
-- 해당 에러 2개 혹은 하나라도 발생하면 아래의 (2-2) 트리거 실행


-- (2-1)💡 수정완료 버전: 결제 ↔ 예약 상태 동기화 트리거 (ORA-04098 방지형)
BEGIN
  EXECUTE IMMEDIATE 'DROP TRIGGER trg_payment_reserv_sync';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -4080 THEN RAISE; END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_payment_reserv_sync
FOR UPDATE OF resv_status ON reservation_tbl
COMPOUND TRIGGER

  TYPE t_resv_row IS RECORD(
    resv_id reservation_tbl.resv_id%TYPE
  );
  TYPE t_resv_tab IS TABLE OF t_resv_row INDEX BY PLS_INTEGER;
  g_resvs t_resv_tab;
  g_idx PLS_INTEGER := 0;

  AFTER EACH ROW IS
  BEGIN
    g_idx := g_idx + 1;
    g_resvs(g_idx).resv_id := :NEW.resv_id;
  END AFTER EACH ROW;

  AFTER STATEMENT IS
  BEGIN
    FOR i IN 1 .. g_resvs.COUNT LOOP
      BEGIN
        -- 예약 완료 → 결제 완료
        UPDATE payment_tbl p
           SET p.payment_status = '완료'
         WHERE p.resv_id = g_resvs(i).resv_id
           AND EXISTS (
                 SELECT 1 FROM reservation_tbl r
                  WHERE r.resv_id = g_resvs(i).resv_id
                    AND r.resv_status = '완료'
               )
           AND NVL(p.payment_status, 'X') != '완료';

        -- 예약 취소 → 결제 취소
        UPDATE payment_tbl p
           SET p.payment_status = '취소'
         WHERE p.resv_id = g_resvs(i).resv_id
           AND EXISTS (
                 SELECT 1 FROM reservation_tbl r
                  WHERE r.resv_id = g_resvs(i).resv_id
                    AND r.resv_status = '취소'
               )
           AND NVL(p.payment_status, 'X') != '취소';

      EXCEPTION WHEN OTHERS THEN NULL; -- 안전 모드
      END;
    END LOOP;
  END AFTER STATEMENT;

END;
/
ALTER TRIGGER trg_payment_reserv_sync ENABLE;


-- (2-2)💡 예약 ↔ 결제 상태 동기화 트리거 (ORA-22905 / ORA-04091 완전 제거 버전)
BEGIN
  EXECUTE IMMEDIATE 'DROP TRIGGER trg_payment_reserv_sync';
EXCEPTION WHEN OTHERS THEN
  IF SQLCODE != -4080 THEN RAISE; END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_payment_reserv_sync
FOR UPDATE OF resv_status ON reservation_tbl
COMPOUND TRIGGER

  TYPE t_row IS RECORD(resv_id reservation_tbl.resv_id%TYPE);
  TYPE t_tab IS TABLE OF t_row INDEX BY PLS_INTEGER;
  g_rows t_tab;
  g_idx  PLS_INTEGER := 0;

  AFTER EACH ROW IS
  BEGIN
    g_idx := g_idx + 1;
    g_rows(g_idx).resv_id := :NEW.resv_id;
  END AFTER EACH ROW;

  AFTER STATEMENT IS
  BEGIN
    FOR i IN 1 .. g_rows.COUNT LOOP
      BEGIN
        -- [1] 예약 완료 → 결제 완료
        UPDATE payment_tbl p
           SET p.payment_status = '완료'
         WHERE p.resv_id = g_rows(i).resv_id
           AND EXISTS (
                 SELECT 1 FROM reservation_tbl r
                  WHERE r.resv_id = g_rows(i).resv_id
                    AND r.resv_status = '완료')
           AND NVL(p.payment_status, 'X') <> '완료';

        -- [2] 예약 취소 → 결제 취소
        UPDATE payment_tbl p
           SET p.payment_status = '취소'
         WHERE p.resv_id = g_rows(i).resv_id
           AND EXISTS (
                 SELECT 1 FROM reservation_tbl r
                  WHERE r.resv_id = g_rows(i).resv_id
                    AND r.resv_status = '취소')
           AND NVL(p.payment_status, 'X') <> '취소';

      EXCEPTION WHEN OTHERS THEN
        NULL; -- 한 건 실패해도 전체 트랜잭션 유지
      END;
    END LOOP;
  END AFTER STATEMENT;

END;
/
ALTER TRIGGER trg_payment_reserv_sync ENABLE;

-------------------------------------------------------------------------------
-- 결제수단이 '카드'이면 cardId만 지정해야 합니다.] 해결 방법
-------------------------------------------------------------------------------
-- 체크 여부 
ALTER TABLE payment_tbl
  ADD CONSTRAINT payment_method_fk_rule CHECK (
       (payment_method = '계좌' AND account_id IS NOT NULL AND card_id IS NULL)
    OR (payment_method = '카드' AND card_id   IS NOT NULL AND account_id IS NULL)
  );
  
-- 명령어 확인하기-----------------------------------------------------------------
-- 1. 결제 테이블 구조 점검
SELECT constraint_name, constraint_type, search_condition
FROM user_constraints
WHERE table_name = 'PAYMENT_TBL';

-- 2. 카드 FK 정상 연결 여부 확인
SELECT a.constraint_name, a.table_name, a.column_name, c_pk.table_name AS ref_table, c_pk.column_name AS ref_col
FROM user_cons_columns a
JOIN user_constraints c ON a.constraint_name = c.constraint_name
JOIN user_cons_columns c_pk ON c.r_constraint_name = c_pk.constraint_name
WHERE c.constraint_type = 'R' AND a.table_name = 'PAYMENT_TBL';
-- 명령어 확인하기-----------------------------------------------------------------

-- PAYMENT_METHOD_FK_RULE 제약이 다르거나 누락되어 있으면 해당 쿼리 실행 
ALTER TABLE payment_tbl DROP CONSTRAINT payment_method_fk_rule;

ALTER TABLE payment_tbl
  ADD CONSTRAINT payment_method_fk_rule CHECK (
       (payment_method = '계좌' AND account_id IS NOT NULL AND card_id IS NULL)
    OR (payment_method = '카드' AND card_id   IS NOT NULL AND account_id IS NULL)
  );
-- FK(FK_PAYMENT_CARD)가 깨졌을 경우 실행.
ALTER TABLE payment_tbl DROP CONSTRAINT fk_payment_card;
ALTER TABLE payment_tbl
  ADD CONSTRAINT fk_payment_card
  FOREIGN KEY (card_id) REFERENCES card_tbl(card_id) ON DELETE SET NULL;


