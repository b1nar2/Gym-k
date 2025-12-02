// [파일] src/pages/cms/board/BoardFormPage.tsx; // 파일 경로 안내
// [용도] CMS 게시판 등록·수정 겸용 화면(Form); // 게시판 생성/수정 입력 폼
// [연동 API] POST /api/cms/boards, PUT /api/cms/boards/{boardId}; // 등록/수정 API
// [주의] 실패 시 화면 유지(입력값 유지), 성공 시에만 목록 이동; // 핵심 정책
// [251016-2] 💾첨부파일 기능 추가


//~ 💾------------------------------------ [파일업로드] import ---------------------------------------
import FileUploadInput from "../../../components/FileUploadInput"; // [251016] 💾 공용 파일업로드 컴포넌트
//~ 💾------------------------------------ [파일업로드] import ---------------------------------------

import React, { useState, useEffect } from "react"; // React 기본 훅 사용
import { useNavigate, useParams } from "react-router-dom"; // ✅ useParams로 수정모드 URL 파라미터 처리
import api from "../../../api/axiosCms"; // CMS 전용 Axios 인스턴스 불러오기

const BoardFormPage: React.FC = () => { // 함수형 컴포넌트 선언
  const navigate = useNavigate(); // 라우팅 이동을 위한 훅
  const { boardId } = useParams<{ boardId: string }>(); // ✅ URL에서 :boardId 추출
  const isEditMode = !!boardId; // ✅ 수정 모드 여부 판단

  //! [251015] 게시판 번호 (수동 입력: 2자리 숫자)
  const [boardNum, setBoardNum] = useState(""); // 게시판 번호 상태
  const [title, setTitle] = useState(""); // 게시판 제목 상태
  const [content, setContent] = useState(""); // 게시판 상단 설명 상태
  const [image, setImage] = useState("Image.jpg"); // 이미지 파일명 상태(업로드 별도)
  const [commentable, setCommentable] = useState(true); // 댓글 허용 여부
  const [usable, setUsable] = useState(true); // 사용 여부
  const [boardFilePath, setBoardFilePath] = useState(""); //~ [251016] 💾 첨부파일 경로 상태

  //? -------------------------- [251016] 수정모드일 경우 데이터 불러오기 --------------------------
  useEffect(() => {
    if (!boardId) return; // 등록 모드면 불필요

    api
      .get(`/api/cms/boards/${boardId}`)
      .then((res) => {
        const d = res.data?.data;
        if (!d) {
          alert("⚠️ 게시판 정보를 불러올 수 없습니다.");
          return;
        }

        //! [251016] BoardEditPage 구조 기반으로 필드 매핑
        setTitle(d.boardTitle ?? "");
        setContent(d.boardContent ?? "");
        setBoardNum(d.boardNum ?? ""); // [251016] 기존 게시판 번호 세팅
        setImage(d.boardImage ?? "Image.jpg");
        setCommentable(d.boardCommentable === "Y");
        setUsable(d.boardUse === "Y");
        // ~💾 [251016-2] 첨부파일 경로 세팅 (수정모드 파일 유지 안되던 원인)
        setBoardFilePath(d.boardFilePath ?? "");
      })
      .catch((err) => {
        console.error("게시판 정보 불러오기 실패:", err);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "게시판 정보를 불러오지 못했습니다.";
        alert(`⚠️ ${msg}`);
      });
  }, [boardId]);
  //? -------------------------- [251016] 수정모드일 경우 데이터 불러오기 --------------------------

  // 이미지 파일 선택 시 파일명만 상태에 저장
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => { // 파일 선택 핸들러
    if (e.target.files && e.target.files.length > 0) { // 파일 존재 확인
      setImage(e.target.files[0].name); // 선택 파일명을 상태에 저장
      // 실제 서버 업로드는 별도 구현 필요; // 현재는 파일명만 보관
    }
  };

  //! ---------------------------------- [251015] 편집 ----------------------------------
  // 저장(등록/수정) 버튼 클릭 핸들러
  const handleSave = async () => { // 저장 버튼 클릭 시 실행
    if (!boardNum.trim()) { // 게시판 번호 필수 검증
      alert("게시판 번호를 입력하세요. (예: 01, 02)"); // 경고 출력
      return; // 부족 시 처리 중단
    }

    if (!title.trim() || !content.trim()) { // 제목/본문 필수 검증
      alert("제목과 본문을 입력하세요."); // 경고 출력
      return; // 부족 시 처리 중단
    }

    try { // 통신 시도
      // 2️⃣ 전송용 데이터 객체 생성 (application/x-www-form-urlencoded)
      const params = new URLSearchParams(); // URL 인코딩 전송 객체
      params.append("boardNum", boardNum); // 게시판 번호
      params.append("boardTitle", title); // 제목
      params.append("boardContent", content); // 본문
      params.append("boardUse", usable ? "Y" : "N"); // 사용여부(Y/N)
      if (boardFilePath) params.append("boardFilePath", boardFilePath); //~ [251016] 💾 첨부파일 경로 전송

      // 3️⃣ 요청 헤더 설정
      const config = {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded", // URL 인코딩 방식 지정
        },
      };

      //? -------------------------- [251016] 등록/수정 모드 분기 --------------------------
      let res;
      if (isEditMode) {
        res = await api.put(`/api/cms/boards/${boardId}`, params, config); // 수정 요청
      } else {
        res = await api.post("/api/cms/boards", params, config); // 등록 요청
      }

      //* -------------------------- [251016]메시지 출력 --------------------------

      /*
      &메시지 전달 구조 플로우
      ![ServiceImpl.java]
      !    ↓ 1. throw new RuntimeException("메시지");
      !         └── (예: "게시판번호가 중복됩니다.")
      ?[Controller.java]
      ?    ↓ 2. ex.getMessage() → msg 변수에 저장
      ?    ↓ 3. ApiResponse.fail(-1, msg) 생성
      ?           └── ApiResponse 내부 필드: message = msg
      ?    ↓ 4. ResponseEntity<ApiResponse<...>> 반환
      ^[React (BoardFormPage.tsx)]
      ^    ↓ 5. res.data.message 로 접근
      ^    ↓ 6. alert(res.data.message)
      */

      // ✅ SUCCESS / FAIL 등의 내부 응답 메시지를 사용자 친화적으로 변환하는 구간
      const serverMsg =
        res.data?.message ||        // 컨트롤러에서 fail(…, "메시지")로 준 문자열(검증 실패/서비스 예외 전달)
        res.data?.resultMessage ||  // ApiResponse 구조 호환
        res.data?.status ||         // status : SUCCESS/FAIL 중 하나
        "";

      if (res.data?.success === false) {
        alert(serverMsg || (isEditMode ? "수정 실패 (중복 또는 서버 오류)" : "등록 실패 (중복 또는 서버 오류)"));
        return;
      }

      // SUCCESS 알림 → 등록/수정 구분 문구 출력
      const finalMsg =
        serverMsg?.toUpperCase() === "SUCCESS"
          ? isEditMode
            ? "게시판이 수정되었습니다."
            : "게시판이 등록되었습니다."
          : serverMsg ||
          (isEditMode
            ? "게시판이 수정되었습니다."
            : "게시판이 등록되었습니다.");

      alert(finalMsg); // 최종 알림
      // * -------------------------- [251016] 메시지 출력 --------------------------

      // 성공 시 목록으로 이동
      navigate("/cms/boards", { replace: true }); // 목록 이동(히스토리 대체)
      return; // 함수 종료
      //? -------------------------- [251016] 등록/수정 모드 분기 --------------------------
    } catch (err: any) { // 예외 처리
      console.error("저장 실패:", err); // 디버깅 로그
      const msg =
        err?.response?.data?.message || // 서버 상세 메시지
        err?.response?.data || // 서버 응답 원문
        err?.message || // 네트워크 오류 메시지
        "저장 중 오류가 발생했습니다."; // 기본 문구
      alert(`⚠️ ${msg}`); // 오류 알림
    }
  };
  //! ---------------------------------- [251015] 편집 ----------------------------------

  // 목록 버튼 클릭 시 게시판 목록 페이지로 이동
  const handleBack = () => { // 목록 버튼 처리
    navigate("/cms/boards"); // 목록으로 이동
  };

  // UI
  return ( // 화면 렌더링 시작
    <div style={{ maxWidth: 700, margin: "30px auto", color: "#222" }}> {/* 컨테이너 */}
      <h2 style={{ marginBottom: 28 }}>{isEditMode ? "게시판 수정" : "게시판 등록"}</h2> {/* 제목 */}

      {/* //! [251015] 게시판 번호 입력 영역 */}
      <div style={{ marginBottom: 12 }}> {/* 번호 입력 블록 */}
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}> {/* 라벨 */}
          게시판 번호 (2자리 숫자)
        </label>
        <input
          type="text" // 텍스트 입력
          value={boardNum} // 상태 바인딩
          onChange={(e) => setBoardNum(e.target.value.replace(/[^0-9]/g, ""))} // 숫자만 허용
          maxLength={2} // 두 자리 제한
          placeholder="예: 01, 02" // 안내 문구
          style={{
            width: "100%", // 전체 너비
            padding: 8, // 패딩
            border: "1px solid #bbb", // 테두리
            borderRadius: 6, // 둥근 모서리
          }}
        />
        <p style={{ fontSize: 13, color: "#777", marginTop: 4 }}> {/* 안내 텍스트 */}
          ※ 중복 불가. 등록 전 기존 게시판 번호 확인하세요.
        </p>
      </div>

      {/* 제목 입력란 */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="게시판 제목을 입력하세요."
        style={{
          width: "100%",
          padding: 8,
          marginBottom: 12,
          border: "1px solid #bbb",
          borderRadius: 6,
        }}
      />

      {/* 본문 입력란 */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        style={{
          width: "100%",
          padding: 8,
          border: "1px solid #bbb",
          borderRadius: 6,
          marginBottom: 12,
        }}
        placeholder="게시판 상단 정보를 입력하세요."
      />

      {/* 이미지 파일 선택 */}
      {/*       
      <input type="file" onChange={handleImageChange} />
      <input
        type="text"
        value={image}
        readOnly
        style={{
          width: "100%",
          padding: 6,
          border: "1px solid #bbb",
          borderRadius: 6,
          margin: "12px 0",
          backgroundColor: "#f7f7f7",
        }}
      /> */}
      {/* //~ 💾----------------------------- [첨부파일] 첨부파일 업로드 적용 영역 --------------------------------*/}
      <div className="mt-6 mb-6">
  <label className="block font-semibold mb-1">첨부파일 업로드</label>

  {/* 기존 파일 존재 시 표시 */}
  {boardFilePath ? (
    <div className="mb-3 text-sm text-gray-700">
      <p>
        현재 첨부파일:
        <a
          // href={`http://localhost:8181${boardFilePath}`}
          href={`http://localhost:8181${boardFilePath.startsWith("/") ? boardFilePath : "/" + boardFilePath}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline ml-1"
        >
          {boardFilePath.split("/").pop()}
        </a>
      </p>
      <p className="text-xs text-gray-500">(새 파일 업로드 시 기존 파일이 교체됩니다.)</p>
    </div>
  ) : (
    <p className="text-sm text-gray-500 mb-2">첨부파일이 없습니다.</p>
  )}

  {/* 신규 업로드 컴포넌트 */}
  <FileUploadInput
    targetType="board"
    targetId={Number(boardId) || 0}
    apiInstance={api}
    onUploadSuccess={(path: string) => {
      console.log("✅ 업로드 완료:", path);
      setBoardFilePath(path); // 새 파일 업로드 시 즉시 상태 갱신
    }}
  />
</div>
      {/* //~ 💾----------------------------- [첨부파일] 첨부파일 업로드 적용 영역 --------------------------------*/}


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
        <button onClick={handleBack} style={{ padding: "8px 20px" }}>
          목록
        </button>
        <button onClick={handleSave} style={{ padding: "8px 20px" }}>
          {isEditMode ? "수정" : "저장"}
        </button>
      </div>
    </div>
  ); // 렌더링 종료
};

export default BoardFormPage; // 컴포넌트 내보내기
