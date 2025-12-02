// [1] React 불러오기
import React from "react";

// [2] 라우터 이동용 훅
import { useNavigate } from "react-router-dom";

// [3] AuthContext 연동용 커스텀 훅
import { useAuth } from "../../auth/useAuth";

// [4] Logout 컴포넌트 정의
export default function Logout() {
  const { logoutHandler, authState } = useAuth(); // [4-1] 로그아웃 핸들러 및 현재 사용자 정보
  const navigate = useNavigate(); // [4-2] 페이지 이동 훅

  // [4-3] 로그아웃 실행 및 홈 리다이렉트
  function handleLogout() {
    logoutHandler();     // 토큰 제거 및 상태 초기화

    //^----[251002] 추가사항 ProtectedRoute.authContext의 Context미전달 버그 패치 ----
    localStorage.removeItem("memberId");
    localStorage.removeItem("memberRole");
    //^----------------------------------------------------------------------------
    
    navigate("/");       // 홈으로 이동
    // 필요 시 window.location.reload(); 대신 navigate 사용 권장
  }

  return (
    <main className="wrapper">
      <div className="container">
        <h1 className="title">로그아웃</h1>
        <p>{authState.memberName ?? ""}님, 로그아웃 하시겠습니까?</p>
        <button className="btn logout" onClick={handleLogout}>로그아웃</button>
      </div>
    </main>
  );
}
