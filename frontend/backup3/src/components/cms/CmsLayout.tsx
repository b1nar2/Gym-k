//! [1] 상위 참조: CmsApp.tsx의 [2] 항목에서 import 됨으로 참조

import React, { useEffect } from "react"; // [2] React 불러오기: 컴포넌트를 정의하기 위해 필요 //! [251007] useEffect 추가 (로그인검증용)
import { Outlet, useNavigate } from "react-router-dom"; // [3] Outlet: 하위 페이지가 여기에 표시됨 //! [251007] useNavigate 추가
import "../../css/cms/cmsDashboard.css"; //? [251009 추가] Codersbite 대시보드 CSS (CMS 공통 레이아웃용)

// [4] Header와 Sidebar 컴포넌트 import
// - 둘 다 CMS 공통 UI 요소이며, 별도의 파일로 분리되어 관리됨
// - 현재 이 파일(CmsLayout)은 이 둘을 배치하고 화면 구조를 결정
import CmsHeader from "./CmsHeader"; // [4-1] 상단바 (관리자명, 로그아웃 버튼 등)
import CmsSidebar from "./CmsSidebar"; // [4-2] 좌측 메뉴바 (회원관리, 시설관리 등)

// [5] CmsLayout 컴포넌트 시작 -> CMSApp.tsx의 [8] 항목에서 element={<CmsLayout />} 형태로 불러옴
export default function CmsLayout() {
  const navigate = useNavigate(); //! [251007 추가] 로그인 상태 검증용 네비게이터 훅

  // [251007 추가] CMS 전용 토큰 검증 로직 — 로그인 안 되어 있으면 로그인 화면으로 이동
  useEffect(() => {
    const cmsToken = localStorage.getItem("cmsToken"); // CMS 전용 토큰
    const commonToken = localStorage.getItem("token"); // 일반 사용자 토큰 (백업용)
    const token = cmsToken || commonToken; // 둘 중 하나라도 존재하면 인증 통과

    if (!token) {
      alert("관리자 로그인이 필요합니다.");
      navigate("/cms/login"); // 로그인 페이지로 리다이렉트
    }
  }, [navigate]);

  return (
    //? ----------------------[251009] 레이아웃 수정 ----------------------
    // ⚙️ Codersbite 기반 레이아웃 구조 적용 (grid)
    <div className="cms-root">  {/*//? CMS 레이아웃에서만 적용, 만약 안하면 사용자 레이아웃에서도 적용됨 */}
    <div className="container">
      {/* [6] 좌측 Sidebar */}
      <div id="sidebar">
        <CmsSidebar />
      </div>

      {/* [7] 상단 헤더 */}
      <nav className="navbar">
        <CmsHeader />
      </nav>

      {/* [8] 메인 컨텐츠 영역 */}
      <main className="main">
        <div className="main__container">
          <Outlet />
        </div>
      </main>
    </div>
    </div>
    //? ----------------------[251009] 레이아웃 수정 ----------------------
  );
}