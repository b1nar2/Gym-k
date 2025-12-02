import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios"

const BoardEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { boardId } = useParams<{ boardId: string }>(); // URL에서 :boardId 추출

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("Image.jpg");
  const [commentable, setCommentable] = useState(true);
  const [usable, setUsable] = useState(true);

  // 처음 로드시 기존 데이터 가져오기
  useEffect(() => {
    if (!boardId) return;
    api.get(`/api/cms/boards/${boardId}`)
      .then((res) => {
        const d = res.data.data;
        setTitle(d.boardTitle ?? "");
        setContent(d.boardContent ?? "");
        setImage(d.boardImage ?? "Image.jpg");
        setCommentable(d.boardCommentable === "Y");
        setUsable(d.boardUse === "Y");
      })
      .catch(() => {
        alert("수정 정보를 불러올 수 없습니다.");
        navigate("/CMS/boards");
      });
  }, [boardId, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0].name);
    }
  };

  // 주요 수정: handleSave 함수 - JSON 바디와 Content-Type 헤더 지정
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 본문을 입력하세요.");
      return;
    }
    try {
      await api.put(
        `/api/cms/boards/json/${boardId}`, // 수정 요청 URL
        {
          boardTitle: title,             // 요청 바디(본문 포함)
          boardContent: content,
          boardUse: usable ? "Y" : "N", // 사용 가능 여부
          boardNum: "01"                 // 2자리 게시판 번호. 반드시 프론트엔드에서 입력 또는 관리 필요
        },
        {
          headers: { "Content-Type": "application/json" } // JSON 전송임을 명시
        }
      );
      alert("게시판 정보가 수정되었습니다.");
      navigate("/CMS/boards");
    } catch (err: any) {
      alert("수정 실패: " + (err?.response?.data?.message || "네트워크 오류"));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("게시판을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/api/cms/boards/${boardId}`);
      alert("게시판이 삭제되었습니다.");
      navigate("/CMS/boards");
    } catch (err: any) {
      alert("삭제 실패: " + (err?.response?.data?.message || "네트워크 오류"));
    }
  };

  const handleBack = () => {
    navigate("/CMS/boards");
  };

  return (
    <div style={{ width: "100%", maxWidth: 700, margin: "30px auto", color: "#222" }}>
      <h2 style={{ marginBottom: 28 }}>게시판 수정</h2>

      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <label style={{ width: 60, marginRight: 8 }}>제 목 :</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ flex: 1, padding: "6px 12px", border: "1px solid #bbb", borderRadius: 6 }}
          placeholder="게시판 제목을 입력하세요."
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          style={{ width: "100%", padding: "8px", border: "1px solid #bbb", borderRadius: 6, background: "#fff" }}
          placeholder="게시판 상단 정보를 입력하세요."
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <label style={{ width: 90 }}>상단 이미지</label>
        <input type="file" onChange={handleImageChange} />
        <input
          type="text"
          value={image}
          readOnly
          style={{ flex: 1, padding: "6px", border: "1px solid #bbb", borderRadius: 6, background: "#f7f7f7" }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <span style={{ marginRight: 20 }}>댓글허용</span>
        <label>
          <input type="radio" checked={commentable} onChange={() => setCommentable(true)} /> 가능
        </label>
        <label style={{ marginLeft: 16 }}>
          <input type="radio" checked={!commentable} onChange={() => setCommentable(false)} /> 불가능
        </label>
      </div>

      <div style={{ marginBottom: 24 }}>
        <span style={{ marginRight: 20 }}>사용가능</span>
        <label>
          <input type="radio" checked={usable} onChange={() => setUsable(true)} /> 가능
        </label>
        <label style={{ marginLeft: 16 }}>
          <input type="radio" checked={!usable} onChange={() => setUsable(false)} /> 불가능
        </label>
      </div>

      <div style={{ display: "flex", gap: 14, justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={handleBack}
          style={{ padding: "8px 32px", background: "#fff", color: "#222", fontWeight: 600, border: "1.5px solid #bbb", borderRadius: "7px", cursor: "pointer" }}
        >
          목록
        </button>
        <button
          type="button"
          onClick={handleDelete}
          style={{ padding: "8px 32px", background: "#dc3c37", color: "#fff", fontWeight: 600, border: "none", borderRadius: "7px", marginLeft: 4, cursor: "pointer" }}
        >
          삭제
        </button>
        <button
          type="button"
          onClick={handleSave}
          style={{ padding: "8px 32px", background: "#777", color: "#fff", fontWeight: 600, border: "none", borderRadius: "7px", marginLeft: 4, cursor: "pointer" }}
        >
          저장
        </button>
      </div>
    </div>
  );
};

export default BoardEditPage;
