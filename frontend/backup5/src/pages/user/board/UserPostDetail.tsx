// [파일명] UserPostDetail.tsx
// [설명] 사용자 게시글 상세 + 댓글 + 첨부파일 + 동일 게시판 목록 유지 (JWT 인증 기반 + 페이지 기능 추가)
// [작성일] [251020-UserPostDetail-페이지기능완성본]
// [데이터 연동 흐름]
// 1. React useEffect → axios.get("/api/boards/{boardId}/posts/{postId}") 호출 → 게시글 상세
// 2. React useEffect → axios.get("/api/posts/{postId}/comments") 호출 → 댓글 목록
// 3. 댓글 등록 → axios.post("/api/boards/{boardId}/posts/{postId}/comments")
// 4. 댓글 삭제 → axios.delete("/api/boards/{boardId}/posts/{postId}/comments/{commentId}")
// 5. 동일 게시판 목록 유지 + 페이지 기능 → axios.get("/api/boards/{boardId}/posts?page={n}")

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../api/axios";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface PostDetail {
  postId: number;
  boardId: number;
  boardPostNo?: number;
  postTitle: string;
  postContent: string;
  memberId: string;
  memberName: string;
  postFilePath?: string;
  postRegDate: string;
  postViewCount: number;
}

interface CommentItem {
  commentId: number;
  memberId: string;
  memberName: string;
  commentContent: string;
  commentRegDate: string;
  commentUpdateDate?: string;
}

export default function UserPostDetail() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { boardId, postId } = useParams<{ boardId: string; postId: string }>();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [relatedPosts, setRelatedPosts] = useState<PostDetail[]>([]);

  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const loginId = localStorage.getItem("memberId");

  // *[251022] 전체 게시글 개수 상태 추가 (API 기반 정확한 페이지네이션 적용 위한 상태)
  const [page, setPage] = useState(1);
  const size = 10;
  const pageRange = 5;

  // 게시글 상세 조회
  const fetchPost = async () => {
    try {
      const res = await api.get(`/api/boards/${boardId}/posts/${postId}`);
      setPost(res.data);
    } catch (e) {
      console.error("게시글 불러오기 실패:", e);
    }
  };

  // 댓글 목록 조회
  const fetchComments = async () => {
    if (!postId) return;
    try {
      const res = await api.get(`/api/boards/${boardId}/posts/${postId}/comments`);
      const raw = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      const mapped = raw.map((r: any) => ({
        commentId: r.commentId ?? r.commentsId ?? r.id,
        memberId: r.memberId ?? r.member_id ?? "",
        memberName: r.memberName ?? r.member_name ?? "",
        commentContent:
          r.commentContent ??
          r.comment_content ??
          r.content ??
          r.text ??
          r.body ??
          "",
        commentRegDate: r.commentRegDate ?? r.createdAt ?? r.created_at ?? "",
        commentUpdateDate: r.commentUpdateDate ?? r.updatedAt ?? r.updated_at ?? "",
      }));
      setComments(mapped);
    } catch (err) {
      console.error("⚠️ 댓글 목록 불러오기 실패:", err);
    }
  };

  // 댓글 등록
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return alert("댓글 내용을 입력하세요.");
    try {
      const params = new URLSearchParams();
      params.append("commentContent", newComment);
      await api.post(`/api/boards/${boardId}/posts/${postId}/comments`, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      setNewComment("");
      fetchComments();
    } catch (err) {
      console.error("⚠️ 댓글 등록 실패:", err);
      alert("로그인이 필요하거나 오류가 발생했습니다.");
    }
  };

  // 댓글 삭제
  const deleteComment = async (commentId: number) => {
    if (!window.confirm("정말로 이 댓글을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/api/boards/${boardId}/posts/${postId}/comments/${commentId}`);
      fetchComments();
    } catch (err) {
      console.error("⚠️ 댓글 삭제 실패:", err);
      alert("댓글 삭제 중 오류가 발생했습니다.");
    }
  };

  // 댓글 수정
  const handleUpdate = async (commentId: number) => {
    if (!editContent.trim()) return alert("수정할 내용을 입력하세요.");
    try {
      const params = new URLSearchParams();
      params.append("Content", editContent);
      await api.put(`/api/boards/${boardId}/posts/${postId}/comments/${commentId}`, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      alert("댓글이 수정되었습니다.");
      setEditingCommentId(null);
      setEditContent("");
      fetchComments();
    } catch (err) {
      console.error("⚠️ 댓글 수정 실패:", err);
      alert("댓글 수정 중 오류가 발생했습니다.");
    }
  };

  // *[251022] 전체 게시글 개수를 API 응답에서 받아오는 페이지네이션용 함수 추가함
  const [totalPosts, setTotalPosts] = useState(0);
  const fetchRelatedPosts = async (pageNum = 1) => {
  try {
    const res = await api.get(`/api/boards/${boardId}/posts`, {
      params: { page: pageNum - 1, size }, // 0-based 인덱스이므로 -1 보정
    });
    console.log("페이지네이션 API 응답 전체:", res.data);
    const data = res.data;
    if (Array.isArray(data)) {
      setRelatedPosts(data);            // 배열 형태 그대로 할당
      setTotalPosts(data.length);       // 총 게시글 개수를 배열 길이로 임시 설정
    } else {
      setRelatedPosts(data.content || []);
      setTotalPosts(data.totalElements || 0);
    }
  } catch (e) {
    console.error("목록 불러오기 실패:", e);
  }
};

  // *[251022] 페이지 변경 함수에 totalPages 체크 및 API 재호출 포함시킴
  const totalPages = Math.ceil(totalPosts / size);
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchRelatedPosts(newPage);
  };

  // ------------------ 페이지 번호 배열 생성 --------------------------
  const startPage = Math.floor((page - 1) / pageRange) * pageRange + 1;
  const endPage = Math.min(startPage + pageRange - 1, totalPages);
  const pageNumbers: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }
  // ---------------------------------------------------------------

  // 첨부파일 다운로드 처리 함수
  const handleFileDownload = (filePath: string) => {
    try {
      const cleanPath = filePath.replace(/^(\/)?posts\//, "");
      const normalized = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
      const downloadUrl = `http://localhost:8181${normalized}`;
      window.open(downloadUrl, "_blank");
    } catch (err) {
      console.error("⚠️ [ERROR] 첨부파일 다운로드 실패:", err);
    }
  };

  // 게시글 삭제 처리
  const handleDelete = async () => {
    if (!window.confirm("게시글을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/api/boards/${boardId}/posts/${postId}`);
      alert("삭제되었습니다.");
      navigate(`/board/${boardId}`);
    } catch (e) {
      console.error("삭제 실패:", e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    fetchPost();
    fetchComments();
    fetchRelatedPosts(page); // 추가함: 초기 리스트 로드 시 현재 페이지 전달
  }, [boardId, postId]);

  if (!post)
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          게시글 불러오는 중...
        </Typography>
      </Box>
    );

  const isOwner = loginId && post.memberId === loginId;

  return (
    <Box sx={{ p: 3, maxWidth: 900, margin: "0 auto" }}>
      {/* 게시글 본문 영역 */}
      <Typography variant="h5" fontWeight="bold" mb={1} color="text.primary" sx={{ letterSpacing: -1 }}>
        {post.postTitle}
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={2}>
        작성자: {post.memberName} | 조회수: {post.postViewCount} |{" "}
        {new Date(post.postRegDate).toISOString().slice(0, 10)}
      </Typography>

      <Paper
        elevation={2}
        sx={{
          whiteSpace: "pre-wrap",
          lineHeight: 1.7,
          p: 2,
          borderRadius: 1,
          mb: 3,
          border: "1px solid #aeadadff",
          boxShadow: "none",
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: post.postContent }} style={{ minHeight: 80 }} />
      </Paper>

      {post.postFilePath && (
        <Box sx={{ mb: 3 }}>
          <Typography component="span" fontWeight="bold" mr={1}>
            첨부파일:{" "}
          </Typography>
          <Button
            variant="text"
            color="primary"
            onClick={() => handleFileDownload(post.postFilePath!)}
            sx={{ fontWeight: 600, textDecoration: "underline", px: 0.5, minWidth: 0 }}
          >
            {post.postFilePath.split("/").pop()}
          </Button>
        </Box>
      )}

      {isOwner && (
        <Box sx={{ textAlign: "right", mb: 1 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate(`/board/${boardId}/posts/${postId}/edit`)}
            sx={{ mr: 1, borderRadius: theme.shape.borderRadius }}
          >
            수정
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete} sx={{ borderRadius: theme.shape.borderRadius }}>
            삭제
          </Button>
        </Box>
      )}

      <Box sx={{ marginTop: 4 }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={1}>
          댓글 ({comments.length})
        </Typography>
        <Box component="form" onSubmit={handleCommentSubmit} sx={{ mb: 2, bgcolor: "background.paper", p: 2, borderRadius: 2 }}>
          <TextField
            multiline
            minRows={3}
            fullWidth
            variant="outlined"
            placeholder="댓글을 입력하세요..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            sx={{ mb: 1, "& .MuiInputBase-input": { fontSize: 15 } }}
          />
          <Box sx={{ textAlign: "right" }}>
            <Button type="submit" variant="contained" sx={{ borderRadius: theme.shape.borderRadius, px: 2, py: 0.7 }}>
              등록
            </Button>
          </Box>
        </Box>

        {comments.length === 0 ? (
          <Typography color="text.secondary" fontSize={15} sx={{ mt: 2 }}>
            댓글이 없습니다.
          </Typography>
        ) : (
          <Paper elevation={0} sx={{ borderRadius: 2, bgcolor: "background.paper" }}>
            <Divider sx={{ mb: 1 }} />
            <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
              {comments.map((c) => {
                const isCommentOwner = loginId && c.memberId === loginId;
                const isEditing = editingCommentId === c.commentId;
                return (
                  <Box
                    key={c.commentId}
                    component="li"
                    sx={{ borderBottom: "1px solid #ececec", py: 1.3, px: 1, position: "relative" }}
                  >
                    <Typography fontWeight="bold" color="text.primary" fontSize={14}>
                      {c.memberName || c.memberId || "익명"}
                    </Typography>
                    <Typography fontSize={12} color="grey.500" mb={isEditing ? 0.5 : 0}>
                      {c.commentRegDate ? new Date(c.commentRegDate).toISOString().slice(0, 10) : ""}
                      {c.commentUpdateDate
                        ? ` (수정: ${new Date(c.commentUpdateDate).toISOString().slice(0, 10)})`
                        : ""}
                    </Typography>
                    {isEditing ? (
                      <>
                        <TextField
                          multiline
                          minRows={2}
                          fullWidth
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          size="small"
                          sx={{ mt: 1, mb: 1.5 }}
                        />
                        <Box sx={{ textAlign: "right" }}>
                          <Button onClick={() => handleUpdate(c.commentId)} variant="contained" color="primary" sx={{ mr: 1 }}>
                            저장
                          </Button>
                          <Button
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditContent("");
                            }}
                            variant="contained"
                            color="inherit"
                          >
                            취소
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <Typography sx={{ mt: 1 }}>{c.commentContent}</Typography>
                    )}
                    {isCommentOwner && !isEditing && (
                      <Box sx={{ position: "absolute", right: 0, top: 12, display: "flex", gap: 1 }}>
                        <Button
                          onClick={() => {
                            setEditingCommentId(c.commentId);
                            setEditContent(c.commentContent);
                          }}
                          variant="contained"
                          sx={{ bgcolor: "#ffa000", color: "#fff", px: 1.5, minWidth: 0, fontSize: 13 }}
                        >
                          수정
                        </Button>
                        <Button
                          onClick={() => deleteComment(c.commentId)}
                          variant="contained"
                          color="error"
                          sx={{ px: 1.5, minWidth: 0, fontSize: 13 }}
                        >
                          삭제
                        </Button>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Paper>
        )}
      </Box>

      {/* 동일 게시판 내 목록 영역 (게시글 표 형식) */}
      <Box sx={{ marginTop: 6 }}>
        <Typography variant="subtitle1" fontWeight="bold" mb={2}>
          게시판 목록
        </Typography>

        <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: "grey.50" }}>
              <TableRow>
                <TableCell sx={{ py: 1 }}>번호</TableCell>
                <TableCell sx={{ py: 1 }}>제목</TableCell>
                <TableCell sx={{ py: 1 }}>작성자</TableCell>
                <TableCell sx={{ py: 1 }}>조회수</TableCell>
                <TableCell sx={{ py: 1 }}>등록일</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {relatedPosts.map((p) => (
                <TableRow
                  key={p.postId}
                  hover
                  onClick={() => navigate(`/board/${boardId}/posts/${p.postId}`)}
                  sx={{ cursor: "pointer", "&:hover td": { color: theme.palette.primary.main } }}
                >
                  <TableCell>{p.boardPostNo ?? p.postId}</TableCell>
                  <TableCell sx={{ textAlign: "left" }}>{p.postTitle}</TableCell>
                  <TableCell>{p.memberName}</TableCell>
                  <TableCell>{p.postViewCount}</TableCell>
                  <TableCell>{new Date(p.postRegDate).toISOString().slice(0, 10)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 페이지 이동 버튼 (CMS 스타일) */}
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Button
            onClick={() => handlePageChange(1)} // 첫 페이지로 이동
            disabled={page === 1}
            sx={{
              mx: 0.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "grey.400",
              backgroundColor: "transparent",
              px: 1.5,
              py: 0.5,
              cursor: page === 1 ? "not-allowed" : "pointer",
            }}
          >
            {"<<"}
          </Button>
          <Button
            onClick={() => handlePageChange(page - 1)} // 이전 페이지 이동
            disabled={page === 1}
            sx={{
              mx: 0.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "grey.400",
              backgroundColor: "transparent",
              px: 1.5,
              py: 0.5,
              cursor: page === 1 ? "not-allowed" : "pointer",
            }}
          >
            {"<"}
          </Button>

          {/* 5개 단위 페이지 표시 */}
          {pageNumbers.map((num) => (
            <Button
              key={num}
              onClick={() => handlePageChange(num)} // 선택 페이지 이동
              sx={{
                mx: 0.5,
                backgroundColor: num === page ? theme.palette.primary.main : "transparent",
                color: num === page ? "#fff" : "inherit",
                border: "1px solid",
                borderColor: "grey.400",
                borderRadius: 2,
                fontWeight: num === page ? "bold" : "normal",
                px: 1.5,
                py: 0.5,
                cursor: "pointer",
              }}
            >
              {num}
            </Button>
          ))}

          <Button
            onClick={() => handlePageChange(page + 1)} // 다음 페이지 이동
            disabled={page === totalPages}
            sx={{
              mx: 0.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "grey.400",
              backgroundColor: "transparent",
              px: 1.5,
              py: 0.5,
              cursor: page === totalPages ? "not-allowed" : "pointer",
            }}
          >
            {">"}
          </Button>
          <Button
            onClick={() => handlePageChange(totalPages)} // 마지막 페이지 이동
            disabled={page === totalPages}
            sx={{
              mx: 0.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "grey.400",
              backgroundColor: "transparent",
              px: 1.5,
              py: 0.5,
              cursor: page === totalPages ? "not-allowed" : "pointer",
            }}
          >
            {">>"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
