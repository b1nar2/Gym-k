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
    p.post_id         AS "게시글ID (PK)",
    p.board_id        AS "게시판ID (FK)",
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