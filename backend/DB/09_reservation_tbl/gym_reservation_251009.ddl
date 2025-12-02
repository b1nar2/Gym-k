-- =====================================================================
-- (선택) 스키마 지정
-- =====================================================================
-- ALTER SESSION SET CURRENT_SCHEMA = gym;


--------------------------------------------------------------------------------
-- 드롭 (재실행 안전)
--------------------------------------------------------------------------------
BEGIN EXECUTE IMMEDIATE 'DROP TRIGGER trg_reservation_id';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -4080 THEN RAISE; END IF; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE reservation_tbl CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF; END;
/

-- =====================================================================
-- 1) reservation_tbl 없으면 생성 (PK 포함)
--    ※ 이미 있으면 스킵
-- =====================================================================
DECLARE
  v_cnt NUMBER;
BEGIN
  SELECT COUNT(*)
    INTO v_cnt
    FROM user_tables
   WHERE table_name = 'RESERVATION_TBL';

  IF v_cnt = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE TABLE reservation_tbl (
          resv_id           NUMBER        NOT NULL,
          member_id         VARCHAR2(20)  NOT NULL,
          facility_id       NUMBER        NOT NULL,
          resv_content      VARCHAR2(200),
          want_date         DATE,               -- 통일: DATE
          resv_date         DATE DEFAULT TRUNC(SYSDATE) NOT NULL,  -- 통일: DATE
          resv_log_time     TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
          resv_person_count NUMBER(5),
          resv_status       VARCHAR2(20),
          facility_money    NUMBER(12),
          resv_start_time   TIMESTAMP,
          resv_end_time     TIMESTAMP,
          resv_money        NUMBER(12)
      )
    ]';

    -- PK 제약 (없을 때만)
    EXECUTE IMMEDIATE q'[
      ALTER TABLE reservation_tbl
        ADD CONSTRAINT reservation_pk PRIMARY KEY (resv_id)
    ]';
  END IF;
END;
/
-- ※ member_tbl FK를 붙일 거면 이 줄 해제:
-- ALTER TABLE reservation_tbl ADD CONSTRAINT fk_resv_member
--   FOREIGN KEY (member_id) REFERENCES member_tbl(member_id);

-- 상태 컬럼 제약조건 추가 (취소/대기/완료만 허용)

-- 1) 기존 null 상태를 전부 '대기'로 교정
UPDATE reservation_tbl
   SET resv_status = '대기'
 WHERE resv_status IS NULL;
COMMIT;

-- 2) 상태값 허용 집합 강제 (취소/대기/완료만)
--    이미 있으면 DROP 후 다시 ADD
BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE reservation_tbl DROP CONSTRAINT chk_resv_status';
EXCEPTION WHEN OTHERS THEN
  IF SQLCODE != -2443 THEN RAISE; END IF; -- ORA-02443: 제약 없음 → 무시
END;
/
ALTER TABLE reservation_tbl
  ADD CONSTRAINT chk_resv_status
  CHECK (resv_status IN ('취소', '대기', '완료'));

-- 3) 컬럼 기본값과 NOT NULL 설정 (이후부터 자동으로 '대기')
ALTER TABLE reservation_tbl
  MODIFY (resv_status VARCHAR2(20) DEFAULT '대기' NOT NULL);

-- =====================================================================
-- 2) 컬럼 타입 통일 (재실행 안전)
--    - want_date, resv_date 를 DATE 로 고정
--    - resv_start_time/resv_end_time 는 TIMESTAMP 유지
-- =====================================================================
BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE reservation_tbl MODIFY (want_date DATE)';
EXCEPTION WHEN OTHERS THEN
  IF SQLCODE NOT IN (-1442, -1451, -22859) THEN RAISE; END IF;
END;
/
BEGIN
  EXECUTE IMMEDIATE 'ALTER TABLE reservation_tbl MODIFY (resv_date DATE)';
EXCEPTION WHEN OTHERS THEN
  IF SQLCODE NOT IN (-1442, -1451, -22859) THEN RAISE; END IF;
END;
/

-- =====================================================================
-- 3) “시간 겹침 차단” 트리거
--    [중복 제거] INSERT용 row-level 트리거 블록은 삭제하고,
--    아래 COMPOUND TRIGGER만 사용합니다.
-- =====================================================================

-- 기존 겹침 트리거가 있다면 제거 (재실행 안전)
BEGIN
  EXECUTE IMMEDIATE 'DROP TRIGGER trg_reservation_block_overlap';
EXCEPTION WHEN OTHERS THEN
  IF SQLCODE != -4080 THEN RAISE; END IF;  -- ORA-04080: 존재하지 않음 → 무시
END;
/

-- 예약 PK 시퀀스 재정렬(없으면 DROP 에러 무시)
DECLARE
  v_max NUMBER;
BEGIN
  SELECT NVL(MAX(resv_id), 0) INTO v_max FROM reservation_tbl;

  BEGIN
    EXECUTE IMMEDIATE 'DROP SEQUENCE seq_reservation_id';
  EXCEPTION
    WHEN OTHERS THEN
      -- ORA-02289: sequence does not exist 는 무시
      IF SQLCODE != -2289 THEN RAISE; END IF;
  END;

  EXECUTE IMMEDIATE
    'CREATE SEQUENCE seq_reservation_id '||
    ' START WITH ' || TO_CHAR(v_max + 1) ||
    ' INCREMENT BY 1 NOCACHE NOCYCLE';
END;
/

CREATE OR REPLACE TRIGGER trg_resv_no_overlap
  FOR INSERT OR UPDATE OF facility_id, resv_start_time, resv_end_time, resv_status
  ON reservation_tbl
COMPOUND TRIGGER

  TYPE t_row IS RECORD(
    resv_id        reservation_tbl.resv_id%TYPE,
    facility_id    reservation_tbl.facility_id%TYPE,
    start_time     reservation_tbl.resv_start_time%TYPE,
    end_time       reservation_tbl.resv_end_time%TYPE
  );
  TYPE t_tab IS TABLE OF t_row INDEX BY PLS_INTEGER;

  g_rows t_tab;
  g_idx  PLS_INTEGER := 0;

  BEFORE STATEMENT IS
  BEGIN
    g_rows.DELETE; g_idx := 0;
  END BEFORE STATEMENT;

  AFTER EACH ROW IS
  BEGIN
    -- '완료' 로 들어가는 경우에만 검사 대상으로 누적
    IF :NEW.resv_status = '완료' THEN
      g_idx := g_idx + 1;
      g_rows(g_idx).resv_id     := :NEW.resv_id;
      g_rows(g_idx).facility_id := :NEW.facility_id;
      g_rows(g_idx).start_time  := :NEW.resv_start_time;
      g_rows(g_idx).end_time    := :NEW.resv_end_time;
    END IF;
  END AFTER EACH ROW;

  AFTER STATEMENT IS
    v_dummy NUMBER;
  BEGIN
    FOR i IN 1 .. g_rows.COUNT LOOP
      BEGIN
        SELECT 1 INTO v_dummy
          FROM reservation_tbl r
         WHERE r.facility_id = g_rows(i).facility_id
           AND r.resv_status = '완료'
           AND r.resv_id    <> g_rows(i).resv_id
           AND r.resv_start_time < g_rows(i).end_time
           AND r.resv_end_time   > g_rows(i).start_time
           AND ROWNUM = 1;             -- 12c 미만 호환 (필요시 FETCH FIRST 1 ROWS ONLY 대체)

        -- 하나라도 있으면 시간대 중복
        RAISE_APPLICATION_ERROR(-20001, '해당 시간대에 이미 완료된 예약이 있습니다.');
      EXCEPTION
        WHEN NO_DATA_FOUND THEN NULL;  -- 중복 없음
      END;
    END LOOP;
  END AFTER STATEMENT;

END;
/

-- =====================================================================
-- 4) 보조 인덱스 : 중복 시간대 있는지 확인
-- =====================================================================
DECLARE
  v_cnt NUMBER;
BEGIN
  SELECT COUNT(*)
    INTO v_cnt
    FROM user_indexes
   WHERE index_name = 'IDX_RESV_FAC_STATUS_TIME';

  IF v_cnt = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE INDEX IDX_RESV_FAC_STATUS_TIME
        ON reservation_tbl (facility_id, resv_status, resv_start_time, resv_end_time)
    ]';
  END IF;
END;
/



------------------------------------------------------------
-- 250919 취소신청(resv_cancel) 컬럼 추가
------------------------------------------------------------
-- 1) 컬럼 추가 
BEGIN
EXECUTE IMMEDIATE q'[ALTER TABLE reservation_tbl
ADD ( resv_cancel CHAR(1) DEFAULT 'N' NOT NULL )]';
EXCEPTION
WHEN OTHERS THEN
-- ORA-01430: column being added already exists
IF SQLCODE != -1430 THEN RAISE; END IF;
END;
/
-- resv_cancel: 취소신청 여부 플래그(Y/N)
-- DEFAULT 'N': 등록 시 기본값 N, 신청자가 취소신청을 하면 Y로 변경
-- NOT NULL: 항상 값 보유

-- 2) 체크 제약 추가 
BEGIN
EXECUTE IMMEDIATE q'[ALTER TABLE reservation_tbl
ADD CONSTRAINT resv_resv_cancel_chk CHECK (resv_cancel IN ('Y','N'))]';
EXCEPTION
WHEN OTHERS THEN
-- ORA-02275: such a referential constraint already exists in the table (이름 중복 등)
-- ORA-02261/02264 등 기존 동일 제약 존재 시 무시
IF SQLCODE NOT IN (-2275, -2261, -2264) THEN RAISE; END IF;
END;
/
-- 값 범위를 오로지 Y/N으로 고정

-- 3) 컬럼 주석
BEGIN
EXECUTE IMMEDIATE q'[
COMMENT ON COLUMN reservation_tbl.resv_cancel IS '취소신청 여부(Y/N) - 기본 N, 사용자 신청 시 Y'
]';
END;
/
-- - 운영/문서화용 메타데이터

-- 취소신청 사유
BEGIN
EXECUTE IMMEDIATE q'[ALTER TABLE reservation_tbl
ADD ( resv_cancel_reason VARCHAR2(200) NULL )]';
EXCEPTION
WHEN OTHERS THEN
-- ORA-01430: column being added already exists
IF SQLCODE != -1430 THEN RAISE; END IF;
END;
/
BEGIN
EXECUTE IMMEDIATE q'[
COMMENT ON COLUMN reservation_tbl.resv_cancel_reason
IS '취소신청 사유(선택 입력, 최대 200자)']';
END;
/
-- =====================================================================
-- 5) 조회 
-- =====================================================================

SELECT
resv_id AS 신청ID,
reservation_tbl.member_id AS 회원ID, 
m.member_name AS 회원명,
reservation_tbl.facility_id AS 시설ID, 
f.facility_id AS 시설ID,
f.facility_name AS 시설명,
resv_status AS 상태, 
TO_CHAR(resv_date,'YYYY-MM-DD HH24:MI:SS') AS 요청일,
TO_CHAR(resv_start_time,'YYYY-MM-DD HH24:MI:SS') AS 희망시작시간,
TO_CHAR(resv_end_time,'YYYY-MM-DD HH24:MI:SS')   AS 희망종료시간
, resv_cancel AS 취소여부
, resv_cancel_reason AS 취소사유
, resv_money AS 결제금액
FROM reservation_tbl
JOIN member_tbl m ON m.member_id = reservation_tbl.member_id   -- 회원명 JOIN(DDL 무변경)
JOIN facility_tbl f ON f.facility_id = reservation_tbl.facility_id   -- 시설명 JOIN(DDL 무변경)
ORDER BY resv_id;

--DESC FETCH FIRST 5 ROWS ONLY;

-- 조회되는 신청건들 중에서 그린아카데미 풋살장으로 되어 있는거 일괄적으로 삭제
UPDATE reservation_tbl
SET resv_status = '취소', -- 상태를 '취소'로 변경
    resv_cancel = 'Y',   -- 취소 신청 여부 플래그도 'Y'로 변경
    resv_cancel_reason = '시설 정보 삭제에 따른 관리자 일괄 취소' -- 취소 사유 기입
WHERE facility_id = 1 -- 💡 여기에 '그린아카데미 풋살장'의 실제 facility_id를 입력
AND resv_status IN ('대기', '완료'); -- 이미 취소된 건은 제외하고, 유효한 예약만 처리
COMMIT; 

DELETE FROM reservation_tbl
WHERE facility_id = 1; 
COMMIT;