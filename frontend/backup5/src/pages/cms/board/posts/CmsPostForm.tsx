//! [파일명] CmsPostForm.tsx
//! [설명] CMS 게시글 등록·수정 겸용 화면 (리치에디터 + 첨부파일 + 공지글 여부)
//! [작성일] [251017 최종형]
//! [연동 API]
//!   - POST /api/cms/boards/{boardId}/posts        : 신규 등록
//!   - PUT  /api/cms/boards/{boardId}/posts/{postId} : 수정
//! [호출 위치]
//!   - CmsApp.tsx → <Route path="boards/:boardId/posts/form" element={<CmsPostForm />} />
//!   - CmsApp.tsx → <Route path="boards/:boardId/posts/:postId/edit" element={<CmsPostForm />} />

import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../../../../api/axiosCms";

// 리치에디터 import
import Editor from "../../../../components/common/Editor/Editor";
import "draft-js/dist/Draft.css";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

// 첨부파일 업로드 import
import FileUploadInput from "../../../../components/FileUploadInput";

interface PostForm {
  postId?: number;
  boardId: number;
  postTitle: string;
  postContent: string;
  postUse: string;
  postFilePath?: string;
  postNoticeYn: string; // 공지글 여부 (Y/N)
  memberName?: string;  // 작성자 이름
  postType: string; // [251019] 게시글 유형 (DB에 있는 게시글 종류 정보도 불러와야 함)
}

export default function CmsPostForm() {
  const navigate = useNavigate();
  const { boardId, postId } = useParams<{ boardId: string; postId?: string }>();
  const isEditMode = !!postId; // 수정 모드 여부

  // 폼 상태 (기본값)
  const [form, setForm] = useState<PostForm>({
    boardId: Number(boardId),
    postTitle: "",
    postContent: "",
    postUse: "Y",
    postFilePath: "",
    postNoticeYn: "N",
    memberName: "",
    postType: "일반", //[251019] 일반 혹은 공지 중 하나 
  });

  // 로그인 관리자명 가져오기 (토큰 기반)
  useEffect(() => {
    const adminName = localStorage.getItem("cmsAdminName") || "관리자";
    setForm((prev) => ({ ...prev, memberName: adminName }));
  }, []);

  // 수정 모드일 경우 기존 데이터 로딩
  useEffect(() => {
    if (isEditMode && boardId && postId) {
      api
        .get(`/api/cms/boards/${boardId}/posts/${postId}`)
        .then((res) => {
          const p = res.data;
          setForm({
            postId: p.postId,
            boardId: p.boardId,
            postTitle: p.postTitle,
            postContent: p.postContent,
            postUse: p.postUse,
            postFilePath: p.postFilePath,
            postNoticeYn: p.postNoticeYn || "N",
            memberName: p.memberName || "관리자",
            postType: p.postType || "일반", // [251019] 게시글 유형 기본값 추가
          });
        })
        .catch((err) => {
          console.error("게시글 불러오기 실패:", err);
          alert("게시글 정보를 불러오지 못했습니다.");
        });
    }
  }, [isEditMode, boardId, postId]);

  // 입력 핸들러
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 리치에디터 본문 변경
  const handleEditorChange = (html: string) => {
    setForm((prev) => ({ ...prev, postContent: html }));
  };

  // 저장
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.append("boardId", String(form.boardId));
    params.append("postTitle", form.postTitle);
    params.append("postContent", form.postContent);
    params.append("postUse", form.postUse);
    params.append("postNoticeYn", form.postNoticeYn);
    if (form.postFilePath) params.append("postFilePath", form.postFilePath);
    params.append("postType", form.postType || "일반"); // ✅ 추가

    const config = {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    };

    try {
      if (isEditMode) {
        await api.put(`/api/cms/boards/${boardId}/posts/${postId}`, params, config);
        alert("게시글이 수정되었습니다.");
      } else {
        await api.post(`/api/cms/boards/${boardId}/posts`, params, config);
        alert("게시글이 등록되었습니다.");
      }
      navigate(`/cms/boards/${boardId}/posts`);
    } catch (err: any) {
      console.error("저장 실패:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "게시글 저장 중 오류가 발생했습니다.";
      alert(msg);
    }
  };

  // 취소
  const handleCancel = () => navigate(`/cms/boards/${boardId}/posts`);

  // 첨부파일 삭제
  const handleFileDelete = () => {
    if (window.confirm("첨부파일을 삭제하시겠습니까?")) {
      setForm((prev) => ({ ...prev, postFilePath: "" }));
    }
  };

  return (
    <div className="p-8 bg-white rounded shadow-md max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 border-b pb-2">
        {isEditMode ? "게시글 수정" : "게시글 등록"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 제목 */}
        <div>
          <label className="block font-semibold mb-1">제목</label>
          <input
            type="text"
            name="postTitle"
            value={form.postTitle}
            onChange={handleChange}
            className="border rounded w-full p-2"
            required
          />
        </div>

        {/* 작성자 */}
        <div>
          <label className="block font-semibold mb-1">작성자</label>
          <input
            type="text"
            value={form.memberName}
            readOnly
            className="border rounded w-full p-2 bg-gray-100 text-gray-600"
          />
        </div>

        {/* 내용 */}
        <div>
          <label className="block font-semibold mb-1">내용</label>
          <Editor
            onChange={handleEditorChange}
            defaultValue={form.postContent}
          />
        </div>

        {/* 첨부파일 */}
        <div>
          <label className="block font-semibold mb-1">첨부파일</label>
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
            <div className="flex items-center gap-3">
              <a
                href={`http://localhost:8181${form.postFilePath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {form.postFilePath.split("/").pop()}
              </a>
              <button
                type="button"
                onClick={handleFileDelete}
                className="text-red-500 text-sm underline"
              >
                X
              </button>
            </div>
          )}
        </div>

        {/* 공지글 여부 */}
        <div>
          <label className="block font-semibold mb-1">공지글</label>
          <div className="flex gap-4">
            <label>
              <input
                type="radio"
                name="postNoticeYn"
                value="N"
                checked={form.postNoticeYn === "N"}
                onChange={handleChange}
              />
              <span className="ml-1">일반</span>
            </label>
            <label>
              <input
                type="radio"
                name="postNoticeYn"
                value="Y"
                checked={form.postNoticeYn === "Y"}
                onChange={handleChange}
              />
              <span className="ml-1">공지</span>
            </label>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            목록
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            저장
          </button>
        </div>
      </form>
    </div>
  );
}
