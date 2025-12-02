// [1] React 및 Router 관련 기능 불러오기
// - React: 화면을 구성하는 라이브러리
// - BrowserRouter: 웹주소(URL)를 감시하며 페이지 전환 관리
// - Routes, Route: URL 경로별로 어떤 화면을 보여줄지 정의
// - Navigate: 특정 경로로 이동시킬 때 사용 (예: 로그인 안했을 때 /cms/login으로 이동)
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// [2] CMS 화면에서 공통으로 사용할 Layout 컴포넌트 불러오기
// - CmsLayout: 상단(Header) + 좌측(Sidebar) + 본문(Outlet)으로 구성된 관리자 전용 화면틀
import CmsLayout from "./components/cms/CmsLayout";

// [3] CMS 페이지 컴포넌트 불러오기
// - CmsLogin: 관리자 로그인 화면 (Layout 없이 단독 표시)
// - CmsHome: CMS 대시보드(메인) 화면
import CmsLogin from "./pages/cms/CmsLogin";
import CmsHome from "./pages/cms/CmsHome";
//import "./css/cms/cmsDashboard.css"; //! [251009] 대시보드 CSS 추가

/* 기존 주석 유지
import CmsUserList from "./pages/cms/user/CmsUserList";    // 회원 목록
import CmsUserEdit from "./pages/cms/user/CmsUserEdit";    // 회원 수정
import CmsUserCreate from "./pages/cms/user/CmsUserCreate";// 회원 등록
*/

// ✅ [251007 추가 시작] 회원관리 화면 연결을 위한 import 추가
import CmsUserList from "./pages/cms/user/CmsUserList"; // [251007-1] 회원목록 컴포넌트
import CmsUserForm from "./pages/cms/user/CmsUserForm"; // [251007-2] 회원등록/수정 컴포넌트

// ✅ [251007 추가] 시설관리 화면 import
import CmsFacilityList from "./pages/cms/facility/CmsFacilityList";
import CmsFacilityCreate from "./pages/cms/facility/CmsFacilityForm";

// ✅ [251008 추가] 예약신청 화면 import
import CmsReservation from "./pages/cms/reservation/CmsReservation"; // 신청현황 관리 페이지 import

// ✅ [251011 추가] 콘텐츠관리 화면 import
import CmsContentList from "./pages/cms/contents/CmsContentList"; // 콘텐츠 관리 페이지 import
import CmsContentDetail from "./pages/cms/contents/CmsContentDetail"; // 콘텐츠 상세 import
import CmsContentForm from "./pages/cms/contents/CmsContentForm";   // 콘텐츠 등록/수정 import

// [4] CmsApp 컴포넌트 시작
// - 이 파일은 관리자 화면의 “출입구” 역할을 하는 컴포넌트입니다.
// - CMS 관련 모든 URL(`/cms/...`)은 이곳을 통해 렌더링됩니다.
export default function CmsApp() {
  return (
    // [5] BrowserRouter로 CMS 전용 라우터 환경 설정
    // - CMS 내에서 주소 이동이 생겨도 새로고침 없이 화면만 바뀌도록 관리
    <BrowserRouter>
      {/* [6] Routes: URL 주소별로 보여줄 화면(컴포넌트)을 묶는 영역 */}
      <Routes>
        {/* [7] /cms/login 경로: 관리자 로그인 화면 */}
        {/* - Layout 없이 단독 페이지로 표시 */}
        <Route path="/cms/login" element={<CmsLogin />} />

        {/* [8] /cms/* 경로: 로그인 이후 접근 가능한 관리자 영역 */}
        {/* - CmsLayout을 감싸서, Header/Sidebar가 항상 보이게 함. */}
        <Route path="/cms/*" element={<CmsLayout />}>
          {/* [8-1] /cms/home → CMS 메인 대시보드 */}
          <Route path="home" element={<CmsHome />} />

          {/* [8-2] /cms 경로로 접근했을 때 기본적으로 /cms/home으로 보냄 */}
          <Route index element={<Navigate to="home" replace />} />

          {/* [251006 추가 시작] 회원관리 관련 라우트 */}
          {/* ⚙️ [251007-2] 책임자 전용 회원관리 목록 라우트 추가 */}
          <Route path="user" element={<CmsUserList />} />
          {/* <Route path="user/create" element={<CmsUserCreate />} />
           <Route path="user/edit/:memberId" element={<CmsUserEdit />} /> 회원 수정 (⭐ 추가됨) */}
          <Route path="user/form" element={<CmsUserForm />} />

          {/* [251007 추가 시작] 시설관리 관련 라우트 */}
          <Route path="facility" element={<CmsFacilityList />} />   {/* 목록 */}
          <Route path="facility/create" element={<CmsFacilityCreate />} /> {/* 등록/수정 */}
            
          {/* [251008 추가] 예약관리 라우트 */}
          <Route path="reservation" element={<CmsReservation />} />

          {/* [251011 추가] 콘텐츠관리 라우트 */}
          <Route path="contents" element={<CmsContentList />} />  {/* 목록 */}
          <Route path="contents/:contentId" element={<CmsContentDetail />} />  {/* 상세 */}
          <Route path="contents/form" element={<CmsContentForm />} /> {/* 등록/수정 */}

        </Route>

        {/* [9] 예외 처리: 정의되지 않은 /cms 주소 접근 시 자동으로 /cms/login으로 보냄 */}
        <Route path="*" element={<Navigate to="/cms/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
