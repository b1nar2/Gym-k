//! [1] 상위 참조: CmsLayout.tsx의 [4-2] 항목에서 import 됨으로 참조

import React from "react"; // [2] React 불러오기: 컴포넌트 생성용 필수 라이브러리
import { NavLink } from "react-router-dom"; // [3] NavLink: 메뉴 클릭 시 경로 이동을 위한 React Router 기능

// [4] CmsSidebar 컴포넌트 시작
// - 좌측 고정 메뉴로, 관리자들이 다른 기능으로 이동할 수 있게 도와줌
// - 각 메뉴는 NavLink로 연결되어 있으며, 현재 위치한 페이지는 강조 표시됨
export default function CmsSidebar() {
  
  //! [251006 추가사항: role 타입 지정 및 null 방지]
  const role: string = localStorage.getItem("adminRole") || ""; // string | null → string 변환

  // [5] 메뉴 항목 정의
  // - 각 메뉴는 이름과 이동할 URL로 구성됨
  const menuItems = [
    
    //{ name: "홈", path: "/cms/home" }, // [old]
    { name: "홈", path: "/cms/home", icon: "fa fa-home" }, //? [251009] icon 속성 추가 (추후 아이콘 첨부예정)
    
    // { name: "회원 관리", path: "/cms/user" }, 
    //...(role === "책임자" ? [{ name: "회원 관리", path: "/cms/user" }] : []), //! [251006] 책임자만 표시
    ...(role === "책임자" ? [{ name: "회원 관리", path: "/cms/user", icon: "fa fa-user-secret" }]: []), //? [251009] icon 속성 추가
    
    //{ name: "시설 관리", path: "/cms/facility" },
    { name: "시설 관리", path: "/cms/facility", icon: "fa fa-building-o" }, //? [251009] icon 속성 추가

    // { name: "신청 현황", path: "/cms/reservation" },
    { name: "신청 현황", path: "/cms/reservation", icon: "fa fa-calendar-check-o" }, //? [251009] icon 속성 추가

    // { name: "콘텐츠 관리", path: "/cms/contents" },
    { name: "콘텐츠 관리", path: "/cms/contents", icon: "fa fa-files-o" }, //? [251009] icon 속성 추가

    //{ name: "게시판 관리", path: "/cms/board" },
    { name: "게시판 관리", path: "/cms/board", icon: "fa fa-archive" }, //? [251009] icon 속성 추가
  ];

  // [6] JSX 렌더링 시작
  // - 사이드바 전체는 세로 정렬(Flex Column)로 구성
  // - TailwindCSS로 색상 및 간격 지정
  return (
     // ⚙️ Codersbite 스타일 기반 사이드바 전체 구조
    <div className="sidebar__menu">
      {/* [1] 사이드바 제목 영역 */}
      <div className="sidebar__title">
        <div className="sidebar__img">
          <img src="/assets/logo.png" alt="logo" style={{ width: "40px", marginRight: "8px" }} />
          <h1>Gym CMS</h1>
        </div>
      </div>

      {/* [2] 메뉴 링크 영역 */}
      {menuItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `sidebar__link ${isActive ? "active_menu_link" : ""}`
          }
        >
          <i className={item.icon} aria-hidden="true"></i>
          <span>{item.name}</span>
        </NavLink>
      ))}

      {/* [3] 로그아웃 버튼 (옵션) */}
      <div className="sidebar__logout">
        <i className="fa fa-power-off"></i>
        <a
          href="#logout"
          onClick={(e) => {
            e.preventDefault();
            localStorage.removeItem("cmsToken");
            window.location.href = "/cms/login";
          }}
        >
          로그아웃
        </a>
      </div>
    </div>
  );
}