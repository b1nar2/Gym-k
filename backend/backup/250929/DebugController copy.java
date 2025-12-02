<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.gym.mapper.annotation.PostMapper">

  <!-- 결과 매핑: PostResponse DTO에 DB 컬럼을 매핑 -->
  <resultMap id="PostResultMap" type="com.gym.domain.post.PostResponse">
    <id property="postId" column="post_id"/>
    <result property="boardId" column="board_id"/>
    <result property="postTitle" column="post_title"/>
    <result property="postContent" column="post_content"/>
    <result property="memberId" column="member_id"/>
    <result property="memberName" column="member_name"/>
    <result property="postRegDate" column="post_reg_date"/>
    <result property="postViewCount" column="post_view_count"/>
    <result property="postNotice" column="post_notice"/>
    <result property="postSecret" column="post_secret"/>
    <result property="postType" column="post_type"/>
  </resultMap>

  <!-- 게시글 등록: PK 자동증가는 DB 트리거에 위임 -->
  <!-- [변경] VALUES 방식 → INSERT ... SELECT ... FROM dual WHERE ... 로 교체 -->
  <insert id="insertPost" parameterType="com.gym.domain.post.PostCreateRequest"
          useGeneratedKeys="false" keyProperty="postId">
    INSERT INTO post_tbl (
      post_id,            <!-- PK 컬럼 -->
      board_id, 
      post_title, 
      post_content, 
      member_id,
      post_reg_date,  
      post_mod_date, 
      post_view_count,
      post_notice,
      post_secret,
      post_type
    )
    SELECT
      post_seq.NEXTVAL,   <!-- [변경] 시퀀스 NEXTVAL: 조건 충족 시에만 실행됨 -->
      #{boardId}, #{postTitle}, #{postContent}, #{memberId},
      SYSDATE, NULL, 0,
      <choose>
        <when test="postNotice != null and postNotice"> 'Y' </when>
        <otherwise> 'N' </otherwise>
      </choose>,
      <choose>
        <when test="postSecret != null and postSecret"> 'Y' </when>
        <otherwise> 'N' </otherwise>
      </choose>,
      #{postType}
    FROM dual
    WHERE EXISTS (SELECT 1 FROM board_tbl b WHERE b.board_id = #{boardId})   <!-- [변경] FK 유효성 체크 -->
      AND EXISTS (SELECT 1 FROM member_tbl m WHERE m.member_id = #{memberId}); <!-- [변경] FK 유효성 체크 -->
  </insert>

  <select id="getPostSeqCurrval" resultType="long">
    SELECT post_seq.CURRVAL FROM dual   <!-- 🔶 [PK값 회수] CURRVAL -->
  </select>

  <!-- 게시글 수정: 수정일은 DB SYSDATE, boolean 필드는 'Y'/'N'으로 저장 -->
  <update id="updatePost" parameterType="com.gym.domain.post.PostResponse">
    UPDATE post_tbl SET
      post_title    = #{postTitle},
      post_content  = #{postContent},
      post_mod_date = SYSDATE,                      <!-- 수정시간 자동 입력 -->
      post_notice   =
        <choose>
          <when test="postNotice != null and postNotice"> 'Y' </when>
          <otherwise> 'N' </otherwise>
        </choose>,
      post_secret   =
        <choose>
          <when test="postSecret != null and postSecret"> 'Y' </when>
          <otherwise> 'N' </otherwise>
        </choose>,
      post_type     = #{postType}
    WHERE post_id = #{postId}
  </update>

  <!-- 게시판별 게시글 목록 조회 (페이징, 검색, 공지 필터 포함) -->
  <select id="selectPostsByBoard" resultMap="PostResultMap" parameterType="map">
    SELECT
      p.post_id, p.board_id, p.post_title, p.post_content, p.member_id,
      m.member_name,
      p.post_reg_date, p.post_view_count, p.post_notice, p.post_secret, p.post_type
    FROM post_tbl p
    LEFT JOIN member_tbl m ON p.member_id = m.member_id
    WHERE p.board_id = #{boardId}
      <if test="keyword != null and keyword.trim() != ''">
        AND (p.post_title LIKE '%' || #{keyword} || '%'
             OR p.post_content LIKE '%' || #{keyword} || '%')
      </if>
      <if test="notice != null">
        AND p.post_notice = (CASE WHEN #{notice} THEN 'Y' ELSE 'N' END)
      </if>
    ORDER BY p.post_reg_date DESC
    OFFSET #{offset} ROWS FETCH NEXT #{limit} ROWS ONLY
  </select>

  <!-- 게시글 단건 조회 -->
  <select id="selectPostById" resultMap="PostResultMap" parameterType="long">
    SELECT
      p.post_id, p.board_id, p.post_title, p.post_content, p.member_id,
      m.member_name,
      p.post_reg_date, p.post_view_count, p.post_notice, p.post_secret, p.post_type
    FROM post_tbl p
    LEFT JOIN member_tbl m ON p.member_id = m.member_id
    WHERE p.post_id = #{postId}
  </select>

  <!-- 게시글 삭제 -->
  <delete id="deletePostById" parameterType="long">
    DELETE FROM post_tbl WHERE post_id = #{postId}
  </delete>

  <!-- 게시판별 게시글 총 개수 조회 (검색 및 공지 필터 포함) -->
  <select id="countPostsByBoard" resultType="int" parameterType="map">
    SELECT COUNT(*)
    FROM post_tbl p
    WHERE p.board_id = #{boardId}
      <if test="keyword != null and keyword.trim() != ''">
        AND (p.post_title LIKE '%' || #{keyword} || '%'
             OR p.post_content LIKE '%' || #{keyword} || '%')
      </if>
      <if test="notice != null">
        AND p.post_notice = (CASE WHEN #{notice} THEN 'Y' ELSE 'N' END)
      </if>
  </select>

</mapper>
