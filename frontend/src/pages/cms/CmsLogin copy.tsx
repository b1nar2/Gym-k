//! [파일명] CmsLogin.tsx
//! [설명] CMS(관리자) 로그인 화면 — 백엔드 수정 없이 /sign-api/sign-in API를 그대로 사용하여 로그인 처리
//! [주의] axiosCms 사용 금지, 일반 axios 인스턴스(api.ts)만 사용
//! [작성일] [251007] — 백엔드 비수정 대응용 완전 복원판

import React, { useState } from "react"; // [1] React 라이브러리 및 useState 훅 불러오기
import { useNavigate } from "react-router-dom"; // [2] useNavigate: 로그인 성공 후 페이지 이동용
import api from "../../api/axios"; // [3] 기본 axios 인스턴스 — /sign-api/** 요청 전용
import "../../css/all/form.css"; // form.css 전역 스타일 적용 (CMS 폼용)

// [4] CMS 로그인 컴포넌트 시작
export default function CmsLogin() {
  // [4-1] 입력 필드 상태값: 관리자 ID / 비밀번호
  const [adminId, setAdminId] = useState("");
  const [adminPw, setAdminPw] = useState("");

  // [4-2] 페이지 이동을 위한 훅
  const navigate = useNavigate();

  // [5] 로그인 버튼 클릭 시 실행되는 함수
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // [5-1] 폼 기본 제출 동작 방지 (새로고침 방지)

    // [5-2] 필수 입력 확인
    if (!adminId || !adminPw) {
      alert("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      // [5-3] 로그인 요청 (백엔드 SignController는 @RequestParam 기반이므로 params로 전달해야 함)
      // ⚠️ body(JSON)가 아닌 params를 써야 정상 수신됨
      const res = await api.post("/sign-api/sign-in", null, {
        params: { userId: adminId, password: adminPw },
      });

      // [5-4] 응답 데이터 구조 확인 로그 (개발 중 확인용)
      console.log("✅ CMS 로그인 응답:", res.data);

      // [5-5] 응답에서 토큰과 사용자 정보 추출
      const token = res.data.token; // JWT 토큰
      const user = res.data.user || {}; // 사용자 정보 객체
      const adminType = user.adminType ?? user.admin_type ?? ""; // 관리자 등급명 (책임자/관리자/강사)

      // [5-6] 관리자 권한 확인 — user.memberRole은 adminType으로 대체
      if (!["책임자", "최고관리자", "관리자"].includes(adminType)) {
        alert("관리자 전용 계정만 로그인 가능합니다.");
        return;
      }

      // [5-7] 토큰 및 관리자정보를 localStorage에 저장 (axiosCms와 공유되도록 key 통일)
      localStorage.setItem("cmsToken", token); // JWT 토큰 저장
      localStorage.setItem("adminName", user.memberName ?? user.member_name ?? ""); // 관리자 이름 저장
      localStorage.setItem("adminRole", adminType); // 관리자 등급 저장

      // [5-8] 로그인 성공 후 메시지 및 페이지 이동
      alert("로그인 성공! CMS 대시보드로 이동합니다.");
      navigate("/cms/home"); // CMS 홈으로 이동
    } catch (err: any) {
      // [5-9] 오류 발생 시 로그 및 경고창 출력
      console.error("❌ CMS 로그인 실패:", err);
      const msg =
        err.response?.data?.message ||
        "로그인 중 오류가 발생했습니다.";
      alert(msg);
    }
  };

  // [6] JSX(화면 구성)
  return (
    <div className="flex items-center justify-center h-screen bg-gray-200">
      {/* [6-1] 로그인 박스 전체: form.css의 .form-container 사용 */}
      <div className="form-container">
        {/* [6-2] 제목 */}
        <h2 className="form-title text-center">
          관리자 로그인
        </h2>

        {/* [6-3] 로그인 폼 */}
        <form onSubmit={handleLogin}>
          {/* [6-4] 관리자 ID 입력란 */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">
              관리자 ID
            </label>
            <input
              type="text"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)} // 입력값 상태 업데이트
              className="form-input"
              placeholder="아이디를 입력하세요"
            />
          </div>

          {/* [6-5] 비밀번호 입력란 */}
          <div style={{ marginBottom: 24 }}>
            <label className="form-label">
              비밀번호
            </label>
            <input
              type="password"
              value={adminPw}
              onChange={(e) => setAdminPw(e.target.value)} // 입력값 상태 업데이트
              className="form-input"
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          {/* [6-6] 로그인 버튼 */}
          <button
            type="submit" // form onSubmit 연결됨
            className="button-primary"
            style={{ width: "100%" }}
          >
            로그인
          </button>
        </form>
      </div>
    </div>
  );
}
