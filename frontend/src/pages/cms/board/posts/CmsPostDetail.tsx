// [파일명] CmsPostDetail.tsx
// [설명] CMS 게시판별 게시글 상세 조회 (본문 + 첨부파일 다운로드 + 댓글 목록)
// [작성일] [251019-댓글및첨부다운로드완성]
// [데이터 연동 흐름]
// 1. React useEffect → axiosCms.get("/api/cms/boards/{boardId}/posts/{postId}") 호출
// 2. Controller: CmsPostController.getPostDetail()
// 3. Service: PostService.getPostDetail()
// 4. Mapper: postMapper.selectPostDetail()
// 5. Oracle: SELECT post_file_path, post_content 포함
// 6. React useEffect → axiosCms.get("/api/cms/boards/{boardId}/posts/{postId}/comments")
// 7. Controller: CmsCommentController.listComments()
// 8. Service: CommentService.getCommentsByPost()
// 9. Mapper: commentMapper.selectCommentsByPost()
// 10. Oracle: SELECT * FROM comment_tbl WHERE post_id = ? ORDER BY comment_reg_date DESC
// 11. 응답(post + comments) → React 상태(post, comments)에 저장 후 화면 렌더링

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../../../css/all/form.css";
// import api from "../../../../api/axiosCms"; // 
import api from "../../../../api/axiosCms"; // CMS 토큰 → 게시글용 
import apiComent from "../../../../api/axios";   // [251020] -댓글- 사용자 토큰 → 댓글 정보 불러오기

type PostDetail = {
  postId: number;
  boardId: number;
  postTitle: string;
  postContent: string;
  memberId?: string;
  memberName?: string;
  postRegDate?: string;
  postViewCount?: number;
  postFilePath?: string;
};

type Comment = {
  commentsId: number;
  postId: number;
  memberId: string;
  memberName?: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
};

const CmsPostDetail: React.FC = () => {
  const navigate = useNavigate();
  const { boardId, postId } = useParams<{ boardId: string; postId: string }>();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]); // [251020] -댓글- 목록 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // [1] 게시글 상세 조회
  const fetchPostDetail = async () => {
    if (!boardId || !postId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/cms/boards/${boardId}/posts/${postId}`);
      console.log("[DEBUG] 게시글 상세 응답 =", res.data);
      setPost(res.data);
    } catch (err) {
      console.error("⚠️ 게시글 상세 조회 실패:", err);
      setError("게시글을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  //? ----------------------------------------------- 댓글 기능 -----------------------------------------------
  // [2] [251020] -댓글- 목록 조회
  const fetchComments = async () => {
    if (!postId) return;
    try {
      //const res = await apiComent.get(`/api/posts/${postId}/comments`); // ✅ 사용자용 axios 사용
      const res = await apiComent.get(`/api/boards/${boardId}/posts/${postId}/comments`);
      console.log("[DEBUG] 댓글 목록 응답 =", res.data);
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.data)
          ? res.data.data
          : [];
      setComments(list);
    } catch (err) {
      console.error("댓글 목록 불러오기 실패:", err);
    }
  };

  // [251020-2] 댓글 삭제 기능 추가 (특정 댓글 삭제)
  const deleteComment = async (commentsId: number) => {
    if (!window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) return;
    try {
      // CMS 관리자 전용 삭제 API 호출
      //const res = await api.delete(`/api/posts/${postId}/comments/${commentsId}`);
      const res = await api.delete(`/api/boards/${boardId}/posts/${postId}/comments/${commentsId}`);
      console.log("[DEBUG] 댓글 삭제 응답 =", res.data);
      
      fetchComments(); // 삭제 후 목록 갱신
      
    } catch (err) {
      console.error("⚠️ 댓글 삭제 실패:", err);
      alert("댓글 삭제 중 오류가 발생했습니다.");
    }
  };
  //? ----------------------------------------------- 댓글 기능 -----------------------------------------------


  // [3] 첨부파일 다운로드 (백엔드 FileDownloadController 경로 연동)
  const handleDownload = (filePath: string) => {
    try {
      console.log("📂 [DEBUG] 원본 filePath =", filePath);

      // ✅ 1) 앞에 불필요한 "posts/" 제거
      const cleanPath = filePath.replace(/^(\/)?posts\//, "");
      // ✅ 2) 앞에 / 없으면 붙이기
      const normalized = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
      // ✅ 3) 백엔드 절대경로 조합
      const downloadUrl = `http://localhost:8181${normalized}`;
      console.log("📎 [DEBUG] 최종 다운로드 URL =", downloadUrl);
      // ✅ 4) 새 탭으로 실행
      window.open(downloadUrl, "_blank");
    } catch (err) {
      console.error("⚠️ [ERROR] 첨부파일 다운로드 실패:", err);
    }
  };

  // [4] 초기 로드 (게시글 + 댓글 동시 조회)
  useEffect(() => {
    fetchPostDetail();
    fetchComments();
  }, [boardId, postId]);

  // [5] 로딩/에러/빈화면 처리
  if (loading)
    return <p style={{ textAlign: "center", padding: 20 }}>불러오는 중...</p>;
  if (error)
    return (
      <p style={{ textAlign: "center", color: "red", padding: 20 }}>{error}</p>
    );
  if (!post)
    return <p style={{ textAlign: "center", padding: 20 }}>게시글이 없습니다.</p>;

  // [6] 본문 렌더링
  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>
        {post.postTitle}
      </h2>
      <div
        style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}
      >
        <div style={{ color: "#555" }}>작성자: {post.memberName || post.memberId}</div>
        <div style={{ color: "#777" }}>
          등록일: {post.postRegDate?.slice(0, 10) || "-"} / 조회수:{" "}
          {post.postViewCount ?? 0}
        </div>
      </div>

      {/* 첨부파일 다운로드 */}
      {post.postFilePath && (
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => handleDownload(post.postFilePath!)}
            style={{
              background: "none",
              color: "#4caf50",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            첨부파일 다운로드
          </button>
        </div>
      )}

      {/* 게시글 본문 */}
      <div
        style={{
          borderTop: "1px solid #ddd",
          borderBottom: "1px solid #ddd",
          padding: "20px 0",
          color: "#333",
          minHeight: 200,
        }}
        dangerouslySetInnerHTML={{ __html: post.postContent || "" }}
      ></div>

      {/* ------------------ [251020] -댓글- 목록 ------------------- */}
      {/* 댓글 목록 */}
      <div style={{ marginTop: 40 }}>
        <h3
          style={{
            fontSize: 18,
            fontWeight: "bold",
            borderBottom: "2px solid #ddd",
            paddingBottom: 8,
          }}
        >
          댓글 ({comments.length})
        </h3>

        {comments && comments.length > 0 ? (
          <ul>
            {comments.map((c) => (
              <li
                key={c.commentsId}
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "10px 0",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontWeight: "bold" }}>{c.memberName || c.memberId}</div>
                  <div style={{ color: "#333", margin: "4px 0" }}>{c.content}</div>
                  <div style={{ color: "#999", fontSize: 12 }}>
                    {c.createdAt?.slice(0, 16)}
                  </div>
                </div>

                {/* [251020-2] 댓글 삭제 버튼 추가 */}
                <button
                  onClick={() => deleteComment(c.commentsId)}
                  style={{
                    background: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: 3,
                    padding: "4px 10px",
                    cursor: "pointer",
                    height: 30,
                    alignSelf: "center",
                  }}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "#666", marginTop: 10 }}>등록된 댓글이 없습니다.</p>
        )}
      </div>
      {/* ------------------ [251020] -댓글- 목록 ------------------- */}

      {/* 버튼 영역 */}
      <div style={{ marginTop: 30, textAlign: "right" }}>
        <button className="button-primary" onClick={() => navigate(`/cms/boards/${boardId}/posts/${postId}/edit`)}>수정</button>
        <button className="button-secondary" onClick={() => navigate(`/cms/boards/${boardId}/posts`)} style={{ marginLeft: 10 }}>목록으로</button>
      </div>
    </div>
  );
};

export default CmsPostDetail;
