import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const BoardFormPage: React.FC = () => {
  const navigate = useNavigate();

  // 게시판 제목 상태값
  const [title, setTitle] = useState("");
  // 게시판 상단 내용 상태값
  const [content, setContent] = useState("");
  // 이미지 파일명 상태 (실제 업로드 별도 구현 필요)
  const [image, setImage] = useState("Image.jpg");
  // 댓글 허용 여부 상태
  const [commentable, setCommentable] = useState(true);
  // 사용 가능 여부 상태
  const [usable, setUsable] = useState(true);

  // 이미지 파일 선택 시 파일명만 상태에 저장
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0].name);
      // 실제 서버 업로드는 별도 구현 필요
    }
  };

  // 저장(등록) 버튼 클릭 핸들러
  const handleSave = async () => {
    // 제목과 내용은 필수 입력
    if (!title.trim() || !content.trim()) {
      alert("제목과 본문을 입력하세요.");
      return;
    }
    try {
      // 백엔드 JSON API 경로, JSON 바디, 헤더 명시해서 호출
      await api.post(
        "/api/cms/boards/json",
        {
          boardTitle: title,                   // 제목
          boardContent: content,               // 내용
          boardUse: usable ? "Y" : "N",       // 사용 여부 (Y/N)
          boardNum: "01"                      // 게시판 번호 (필수, 실제 UI 필요)
          // image, commentable 등은 필요하면 추가
        },
        {
          headers: { "Content-Type": "application/json" } // JSON 요청임을 명시
        }
      );
      alert("게시판이 등록되었습니다.");
      // 등록 후 게시판 목록 페이지로 이동
      navigate("/CMS/boards");
    } catch (err: any) {
      alert("저장 실패: " + (err?.response?.data?.message || "네트워크 오류"));
    }
  };

  // 목록 버튼 클릭 시 게시판 목록 페이지로 이동
  const handleBack = () => {
    navigate("/CMS/boards");
  };

  return (
    <div style={{ maxWidth: 700, margin: "30px auto", color: "#222" }}>
      <h2 style={{ marginBottom: 28 }}>게시판 등록</h2>
      
      {/* 제목 입력란 */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="게시판 제목을 입력하세요."
        style={{ width: "100%", padding: 8, marginBottom: 12, border: "1px solid #bbb", borderRadius: 6 }}
      />
      
      {/* 본문 입력란 */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        style={{ width: "100%", padding: 8, border: "1px solid #bbb", borderRadius: 6, marginBottom: 12 }}
        placeholder="게시판 상단 정보를 입력하세요."
      />
      
      {/* 이미지 파일 선택 */}
      <input type="file" onChange={handleImageChange} />
      {/* 선택한 이미지 파일명 표시 */}
      <input
        type="text"
        value={image}
        readOnly
        style={{ width: "100%", padding: 6, border: "1px solid #bbb", borderRadius: 6, margin: "12px 0", backgroundColor: "#f7f7f7" }}
      />
      
      {/* 댓글 허용 라디오 */}
      <div style={{ marginBottom: 12 }}>
        <label>
          <input type="radio" checked={commentable} onChange={() => setCommentable(true)} />
          댓글 허용
        </label>
        <label style={{ marginLeft: 20 }}>
          <input type="radio" checked={!commentable} onChange={() => setCommentable(false)} />
          댓글 불가
        </label>
      </div>
      
      {/* 사용 가능 라디오 */}
      <div style={{ marginBottom: 24 }}>
        <label>
          <input type="radio" checked={usable} onChange={() => setUsable(true)} />
          사용 가능
        </label>
        <label style={{ marginLeft: 20 }}>
          <input type="radio" checked={!usable} onChange={() => setUsable(false)} />
          사용 불가
        </label>
      </div>
      
      {/* 버튼 영역 */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {/* 목록으로 이동 */}
        <button onClick={handleBack} style={{ padding: "8px 20px" }}>
          목록
        </button>
        
        {/* 저장 버튼 */}
        <button onClick={handleSave} style={{ padding: "8px 20px" }}>
          저장
        </button>
      </div>
    </div>
  );
};

export default BoardFormPage;
