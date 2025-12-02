import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../api/axiosCms"; // CMS 전용 Axios 인스턴스 불러오기

const BoardEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { boardId } = useParams<{ boardId: string }>(); // URL에서 :boardId 추출

  //! [251015] 게시판 번호 (수동 입력: 2자리 숫자)
  const [boardNum, setBoardNum] = useState("");
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
        setBoardNum(d.boardNum ?? ""); //! [251015] 기존 게시판 번호 세팅
        setImage(d.boardImage ?? "Image.jpg");
        setCommentable(d.boardCommentable === "Y");
        setUsable(d.boardUse === "Y");
      })
      .catch(() => {
        alert("수정 정보를 불러올 수 없습니다.");
        navigate("/cms/boards");
      });
  }, [boardId, navigate]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0].name);
    }
  };
  //! ---------------------------------- [251015] 수정 ----------------------------------
  //! [251015] 수정 요청 처리 로직
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 본문을 입력하세요.");
      return;
    }

    try {
      // 💡 application/x-www-form-urlencoded로 백엔드 규격에 맞춰 전송
      const formData = new URLSearchParams();
      formData.append("boardTitle", title);
      formData.append("boardContent", content);
      formData.append("boardNum", boardNum);
      formData.append("boardUse", usable ? "Y" : "N");

      const res = await api.put(`/api/cms/boards/${boardId}`, formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      // [251015-FIX] 백엔드에서 success 필드가 undefined일 수 있으므로 false인 경우만 실패로 처리
      //기존 코드(if (res.data?.success === true))는 success가 없을 때 navigate가 실행되지 않음
      // success가 false가 아닌 경우엔 모두 성공으로 간주해 목록으로 이동시킴
      if (res.data?.success === false) {
        alert(res.data?.message || "수정 실패 (중복 또는 서버 오류)");
        return;
      }

      // 성공 시 메시지 없이 목록으로 이동
      navigate("/cms/boards", { replace: true });
    } catch (err: any) {
      alert("수정 실패: " + (err?.response?.data?.message || "네트워크 오류"));
    }
  };
  //! ---------------------------------- [251015] 수정 ----------------------------------
  
  const handleDelete = async () => {
    if (!window.confirm("게시판을 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/api/cms/boards/${boardId}`);
      alert("게시판이 삭제되었습니다.");
      navigate("/cms/boards");
    } catch (err: any) {
      alert("삭제 실패: " + (err?.response?.data?.message || "네트워크 오류"));
    }
  };

  const handleBack = () => {
    navigate("/cms/boards");
  };

  return (
    <div style={{ width: "100%", maxWidth: 700, margin: "30px auto", color: "#222" }}>
      <h2 style={{ marginBottom: 28 }}>게시판 수정</h2>

      {/* //! [251015] 게시판 번호 입력 영역 */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
          게시판 번호 (2자리 숫자)
        </label>
        <input
          type="text"
          value={boardNum}
          onChange={(e) => setBoardNum(e.target.value.replace(/[^0-9]/g, ""))} // [251015] 숫자만 허용
          maxLength={2}
          placeholder="예: 01, 02"
          style={{
            width: "100%",
            padding: 8,
            border: "1px solid #bbb",
            borderRadius: 6,
          }}
        />
        <p style={{ fontSize: 13, color: "#777", marginTop: 4 }}>
          ※ 중복 불가. 등록 전 기존 게시판 번호 확인하세요.
        </p>
      </div>

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
          style={{
            padding: "8px 32px",
            background: "#fff",
            color: "#222",
            fontWeight: 600,
            border: "1.5px solid #bbb",
            borderRadius: "7px",
            cursor: "pointer",
          }}
        >
          목록
        </button>
        <button
          type="button"
          onClick={handleDelete}
          style={{
            padding: "8px 32px",
            background: "#dc3c37",
            color: "#fff",
            fontWeight: 600,
            border: "none",
            borderRadius: "7px",
            marginLeft: 4,
            cursor: "pointer",
          }}
        >
          삭제
        </button>
        <button
          type="button"
          onClick={handleSave}
          style={{
            padding: "8px 32px",
            background: "#777",
            color: "#fff",
            fontWeight: 600,
            border: "none",
            borderRadius: "7px",
            marginLeft: 4,
            cursor: "pointer",
          }}
        >
          저장
        </button>
      </div>
    </div>
  );
};

export default BoardEditPage;
