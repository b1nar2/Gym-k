// [파일명] UserPostForm.tsx
// [설명] 사용자 게시글 등록 및 수정 화면 (리치에디터 + 첨부파일 + 로그인 사용자 자동 표시)
// [작성일] [251020-사용자게시글폼최종완성]
// [데이터 연동 흐름]
// 1. 신규등록: POST /api/boards/{boardId}/posts
// 2. 수정모드: PUT  /api/boards/{boardId}/posts/{postId}

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../api/axios";
// 리치에디터 import
import Editor from "../../../components/common/Editor/Editor";
import "draft-js/dist/Draft.css";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
// 첨부파일 업로드 import
import FileUploadInput from "../../../components/FileUploadInput";

// MUI import
import {
  Box,
  Button,
  Typography,
  TextField,
  Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface PostForm {
  postId?: number;
  boardId: number;
  postTitle: string;
  postContent: string;
  postFilePath?: string;
  memberName?: string;
  postType: string;
}

export default function UserPostForm() {
  const theme = useTheme(); // [251021] 테마 사용
  const navigate = useNavigate();
  const { boardId, postId } = useParams<{ boardId: string; postId?: string }>();
  const isEditMode = !!postId;

  // 폼 상태
  const [form, setForm] = useState<PostForm>({
    boardId: Number(boardId),
    postTitle: "",
    postContent: "",
    postFilePath: "",
    memberName: "",
    postType: "일반",
  });

  const [loading, setLoading] = useState(false);
  const [boardNumForNav, setBoardNumForNav] = useState<string | null>(null); // ✅ [FIX] 목록으로 돌아가기 위한 boardNum 상태

  // 로그인 사용자명 가져오기(localStorage)
  useEffect(() => {
    const storedName = localStorage.getItem("memberName") || "사용자";
    setForm((prev) => ({ ...prev, memberName: storedName }));
  }, []);

  // ✅ [FIX] 수정 모드 데이터 로드와 boardNum 조회를 하나의 useEffect로 통합
  useEffect(() => {
    // 1. 게시판의 boardNum을 조회 (목록으로 돌아갈 때 사용)
    if (boardId) {
      api.get(`/api/boards/${boardId}`)
        .then(res => {
          setBoardNumForNav(res.data.data.boardNum);
        })
        .catch(err => console.error("게시판 정보(boardNum) 조회 실패:", err));
    }


    // 2. 수정 모드일 경우, 게시글 데이터 불러오기
    if (isEditMode && boardId && postId) {
      api
        .get(`/api/boards/${boardId}/posts/${postId}`)
        .then((res) => {
          const p = res.data;
          setForm({
            postId: p.postId,
            boardId: p.boardId,
            postTitle: p.postTitle,
            postContent: p.postContent,
            postFilePath: p.postFilePath || "",
            memberName:
              p.memberName || localStorage.getItem("memberName") || "사용자",
            postType: p.postType || "일반",
          });
        })
        .catch((err) => {
          console.error("게시글 불러오기 실패:", err);
          alert("게시글 정보를 불러오지 못했습니다.");
        });
    }
  }, [isEditMode, boardId, postId]);

  // 입력 변경 핸들러
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
  };


  // 리치에디터 내용 변경
  const handleEditorChange = (html: string) => {
    setForm((prev) => ({ ...prev, postContent: html }));
  };

  // 저장
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardId) return;

    const params = new URLSearchParams();
    params.append("boardId", String(form.boardId));
    params.append("postTitle", form.postTitle);
    params.append("postContent", form.postContent);
    if (form.postFilePath) params.append("postFilePath", form.postFilePath);
    params.append("postType", "일반"); // 사용자 화면은 항상 일반 고정

    const config = {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    };

    // ^ [251025] 게시글 등록 후 해당 게시글 페이지로 이동할 수 있도록 변경
    setLoading(true);
    try {
      if (isEditMode) {
        await api.put(`/api/boards/${boardId}/posts/${postId}`, params, config);
        alert("게시글이 수정되었습니다.");
      } else {
        await api.post(`/api/boards/${boardId}/posts`, params, config);
        alert("게시글이 등록되었습니다.");
      }
      // 💥 [OLD] 문제의 코드: 실제 PK인 boardId로 이동하여 목록 페이지에서 오류 발생
      // navigate(`/board/${boardId}`);
      // ✅ [FIX] 저장해둔 boardNum을 사용하여 올바른 목록 페이지로 이동
      navigate(`/board/${boardNumForNav}`);
    } catch (err: any) {
      console.error("게시글 저장 실패:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "게시글 저장 중 오류가 발생했습니다.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // 취소 → 목록으로 이동
  // 💥 [OLD] 문제의 코드: 실제 PK인 boardId로 이동하여 목록 페이지에서 오류 발생
  // const handleCancel = () => navigate(`/board/${boardId}`);
  // ✅ [FIX] 저장해둔 boardNum을 사용하여 올바른 목록 페이지로 이동
  const handleCancel = () => navigate(`/board/${boardNumForNav}`);

  // 첨부파일 삭제
  const handleFileDelete = () => {
    if (window.confirm("첨부파일을 삭제하시겠습니까?")) {
      setForm((prev) => ({ ...prev, postFilePath: "" }));
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        maxWidth: 800,
        p: 4,
        mx: "auto",
        borderRadius: 1,
        border: "1px solid #c7c6c6a4",
        boxShadow: "none",
      }}
    >
      <Typography variant="h5" mb={4} fontWeight="bold" borderBottom={1} pb={1}>
        {isEditMode ? "게시글 수정" : "게시글 등록"}
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {/* 제목 */}
        <TextField
          label="제목"
          name="postTitle"
          value={form.postTitle}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          required
        />

        {/* 작성자 */}
        {/* 주석 처리된 작성자 입력란은 제거 혹은 필요시 주석 유지 */}

        {/* 내용 */}
        <Box>
          <Editor onChange={handleEditorChange} defaultValue={form.postContent} />
        </Box>

        {/* 첨부파일 */}
        <Box>
          <Typography variant="subtitle1" mb={1} fontWeight="bold">
            첨부파일
          </Typography>
          {!form.postFilePath ? (
            <FileUploadInput
              targetType="post"
              targetId={Number(postId) || 0}
              apiInstance={api}
              onUploadSuccess={(path: string) => {
                const fullPath =
                  path.startsWith("/images/") || path.startsWith("http")
                    ? path
                    : `/images/${path}`;
                setForm((prev) => ({ ...prev, postFilePath: fullPath }));
              }}
            />
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <a
                href={`http://localhost:8181${form.postFilePath}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: theme.palette.primary.main, textDecoration: "underline" }}
              >
                {form.postFilePath.split("/").pop()}
              </a>
              <Button variant="text" color="error" onClick={handleFileDelete} sx={{ minWidth: "auto" }}>
                X
              </Button>
            </Box>
          )}
        </Box>

        {/* 버튼 */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            sx={{ px: 4, py: 1.5, borderRadius: theme.shape.borderRadius }}
          >
            목록
          </Button>
          <Button
            type="submit"
            disabled={loading}
            variant="contained"
            sx={{ px: 4, py: 1.5, borderRadius: theme.shape.borderRadius }}
          >
            {loading ? "저장 중..." : "저장"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
