import { useContext } from "react"; 
// React의 useContext 훅을 가져와서 컴포넌트 내에서 Context API 사용 가능하게 함

import { Navigate, Outlet } from "react-router-dom"; 
// react-router-dom에서 페이지 이동 및 자식 컴포넌트 렌더링 도구를 가져옴 
// Navigate: 특정 경로로 강제 이동, Outlet: 중첩 라우트 자식 컴포넌트 표시

import AuthContext from "./AuthContext"; 
// 프로젝트 내 AuthContext를 임포트, 로그인 상태 등 인증 정보를 얻기 위한 용도

import ReservationList from "../pages/cms/ReservationList"; 
// 관리자일 때 보여줄 예약 리스트 페이지 컴포넌트를 임포트

import BoardList from "../pages/cms/BoardList";


// ProtectedRoute 컴포넌트가 받을 props 타입 정의, requiredRole은 선택 속성(예: 'admin')
interface ProtectedRouteProps {
  requiredRole?: string;
}

function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  console.log("ProtectedRoute")
  //! 251002 : 보완 패치 ProtectedRoute.authContext의 Context미전달 버그 패치

  // 이전에 사용하던 Context 방식 코드들은 주석 처리됨
  // const authContext = useContext(AuthContext);
  // console.log("ProtectedRoute.authContext 확인:", authContext )
  // if (!authContext) return <p>로딩 중...</p>;
  // const { authState } = authContext;

  // [2025-10-02] Context 대신 로컬 스토리지에서 토큰, 회원ID, 역할 가져오기
  const token = localStorage.getItem("token"); // 로그인 토큰 확인용
  const memberId = localStorage.getItem("memberId"); // 로그인한 회원 ID
  const memberRole = localStorage.getItem("memberRole"); // 로그인한 회원 역할 ('admin' 또는 'user' 등)
  
  console.log("로컬스토리지 확인 후")
  console.log("토큰 자료형 : ", typeof token)
  console.log("토큰 값 : ", token)

  // 토큰이 없으면 아직 로그인하지 않은 상태이므로 로그인 페이지로 이동시킴
  if (token == null) { // 로그인 미인증 시
    return <Navigate to="/login" replace />;
  }

  console.log("requiredRole 확인:", typeof requiredRole )
  console.log("requiredRole 확인2:", requiredRole )
  console.log("memberId 확인:", memberId )
  console.log("memberRole 확인:", memberRole )

  // 역할 관련 검사를 하는 부분
  // 회원 역할(memberRole)이 없거나 빈 문자열일 때는 접근 제한 및 홈으로 이동 처리
  if (memberRole == null || memberRole == '') {
    console.log("테스트중")
    return <Navigate to="/" replace />;
  } 
  // 관리자(admin) 역할이라면 관리자 전용 페이지인 ReservationList 컴포넌트로 이동
  else if (memberRole == 'admin') { // 관리자일때 (role이 admin)
    console.log("Go-To ReservationList 관리자")
    return <ReservationList />;
  } 
  // 일반 회원(user 등)이라면 관리자 전용 페이지 접근 불가 메시지와 함께 홈으로 이동
  else {
    alert("관리자만 접근 가능한 페이지입니다.")
    return <Navigate to="/" replace />;
  }

  // 이 라인은 실행 안됨 (코드 불필요)
  // return <Outlet />;
}

export default ProtectedRoute;
