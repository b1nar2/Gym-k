//! [1] 상위 참조: CmsLayout.tsx의 [4-1] 항목에서 import 됨으로 참조

import React, { useEffect, useState } from "react"; // [2] React 및 훅 불러오기
import { useNavigate } from "react-router-dom"; // [2-1] 페이지 이동용

// [3] CmsHeader 컴포넌트 시작
// - CMS 상단 영역(Header)에 표시되는 UI를 담당함
// - 관리자 이름, 로그아웃 버튼, 시스템 타이틀 표시
export default function CmsHeader() {
  const navigate = useNavigate(); // [3-1] 페이지 이동 함수 선언
  const [adminName, setAdminName] = useState<string>(""); // [3-2] 관리자 이름 상태값

  // [4] 페이지 로드 시 localStorage에서 관리자 정보 불러오기
  useEffect(() => {
    const storedName = localStorage.getItem("adminName"); // [4-1] 관리자 이름
    //const storedToken = localStorage.getItem("token");    // [4-2] JWT 토큰
    //![251007] token -> cmsToken으로 변경 및 우선값 선정
     const storedToken = localStorage.getItem("cmsToken") || localStorage.getItem("token"); // ✅ CMS 우선 확인

    if (storedName) {
      setAdminName(storedName);
    } else {
      setAdminName("이름 확인 불가");
    }

    // [4-3] 토큰이 없으면 자동 로그아웃 유도
    if (!storedToken) {
      console.warn("⚠️ 로그인 정보가 없습니다. 로그인 페이지로 이동합니다.");
      navigate("/cms/login");
    }

    console.log("✅ CMS Header 로드 완료 - 관리자:", storedName);
  }, [navigate]);

  // [5] 로그아웃 버튼 클릭 시 실행
  const handleLogout = () => {
    // [5-1] localStorage에서 모든 관리자 관련 데이터 제거
    localStorage.removeItem("cmsToken"); //![251007] token -> cmsToken으로 변경, 로그아웃하면 토큰값 지워짐
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminRole");

    // [5-2] 콘솔 출력 및 알림 표시
    console.log("🧹 로그아웃 완료 - 관리자:", adminName);
    alert("로그아웃되었습니다.");

    // [5-3] 로그인 페이지로 이동
    navigate("/cms/login");
  };

  // [6] 렌더링 (TailwindCSS 기반)
  return (
    // <header className="flex justify-between items-center bg-white shadow px-6 py-3">
    <header className="navbar flex justify-between items-center bg-white shadow px-6 py-3">
      {/* [6-1] 좌측: 페이지 타이틀 */}
      <div className="text-lg font-bold text-gray-700"> 
        체육관 관리자 시스템</div>

      {/* [6-2] 우측: 관리자 이름 + 로그아웃 버튼 */}
      <div className="flex items-center gap-4">
        <span className="text-gray-700 font-semibold">
          {adminName}님
        </span>
        <button
          onClick={handleLogout}
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
