// React useContext 훅 임포트 (현재는 사용 안 함)
import { useContext } from "react"; 

// react-router-dom에서 경로 강제 이동(Navigate) 도구 임포트
import { Navigate } from "react-router-dom"; 

// 인증 상태 관리용 Context 임포트 (현재는 사용 안 함)
import AuthContext from "./AuthContext"; 


// ProtectedRoute 컴포넌트 Props 타입 정의
interface ProtectedRouteProps {
  requiredRole?: string;              // 접근 권한 역할 (ex: 'admin')
  element: React.ReactElement;       // 권한 체크 후 보여줄 컴포넌트
}


// ProtectedRoute: 권한 검사 후 허용된 경우만 element 렌더링하는 컴포넌트
function ProtectedRoute({ requiredRole, element }: ProtectedRouteProps) {
  console.log("ProtectedRoute 컴포넌트 실행됨");

  // [2025-10-02] useContext 대신 로컬스토리지에서 로그인 정보 직접 가져오기
  const token = localStorage.getItem("token");           // 로그인 토큰
  const memberRole = localStorage.getItem("memberRole"); // 회원 역할 정보 ('admin' 등)
  
  // 토큰이 없으면 로그인 안 된 상태이므로 로그인 페이지로 이동
  if (!token) {
    console.log("토큰 없음 - 로그인 필요");
    return <Navigate to="/login" replace />;
  }
  
  // 역할 정보가 없거나 빈 문자열이면 접근 거부
  if (!memberRole || memberRole === "") {
    console.log("회원 역할 정보 없음 - 홈으로 이동");
    return <Navigate to="/" replace />;
  }
  
  // requiredRole(접근 권한)이 지정되어 있고,
  // 현재 사용자 역할이 그 권한과 다르면 접근 거부
  if (requiredRole && memberRole !== requiredRole) {
    alert("접근 권한이 없습니다. 관리자만 접근할 수 있습니다.");
    console.log("권한 불일치 - 홈으로 이동");
    return <Navigate to="/" replace />;
  }
  
  // 권한이 모두 일치하면, props로 받은 element(컴포넌트)를 렌더링
  console.log("권한 확인 완료 - 해당 페이지 렌더링");
  return element;
}


export default ProtectedRoute;
// ProtectedRoute.tsx에서 권한 검사 후 전달받은 컴포넌트 렌더링 방식 구현 완료
