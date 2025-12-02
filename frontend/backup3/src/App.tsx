// // React에서 useContext 훅 임포트 - 상태관리용 (현재 사용 중단됨)
// import { useContext } from "react"; 

// // React Router DOM에서 라우팅 관련 컴포넌트 임포트
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; 

// // 인증 상태 관련 Context 임포트 (현재는 사용 안 함)
// import AuthContext from "./context/AuthContext"; 

// // 홈, 로그인, 로그아웃, 마이페이지, 예약리스트 등 페이지 컴포넌트 임포트
// import Home from "./pages/user/Home"; 
// import Login from "./pages/user/Login"; 
// import Logout from "./pages/user/Logout"; 
// import MyPage from "./pages/user/mypage/MyPage"; 
// // import ReservationList from "../backup/ReservationList"; 

// // [2025-10-10] 게시판 리스트 컴포넌트 임포트 (CMS 전용)
// import Boards from "./pages/cms/Boards"; // 게시판 리스트
// import BoardRegister from './pages/cms/BoardRegister'; // 게시판 등록
// import BoardEdit from "./pages/cms/BoardEdit"; // 게시판 편집

// // [2025-10-10] 관리자 권한 확인용 ProtectedRoute 컴포넌트 임포트
// import ProtectedRoute from "./context/ProtectedRoute"; 


// // App 컴포넌트: 전체 라우팅 설정 포함
// export default function App() {
//   // 인증 컨텍스트 상태 가져오기 (현재 사용 중단됨)
//   const authContext = useContext(AuthContext);
//   if (!authContext) return <p>로딩 중...</p>;
  
//   const authState = authContext.authState;
//   const access = !!authState?.token; // 토큰 존재 여부(로그인 상태)

//   return (
//     // 브라우저 주소 경로에 따라 렌더링할 컴포넌트를 결정하는 라우터
//     <BrowserRouter> 
//       <Routes>
//         {/* 메인 홈 경로 */}
//         <Route path="/" element={<Home />} /> 
        
//         {/* 로그인 경로 - 이미 로그인 시 홈으로 이동 */}
//         <Route
//           path="/login"
//           element={access ? <Navigate to="/" replace /> : <Login />} 
//         />
        
//         {/* 로그아웃 경로 */}
//         <Route path="/logout" element={<Logout />} />
        
//         {/* 마이페이지 경로 */}
//         <Route path="/mypage" element={<MyPage />} />
        
//         {/* [OLD] 기존 게시판 라우트 (누구나 접근 가능)
//           <Route path="/board" element={<BoardList />} /> 
//         */}
        
//         {/* 관리자 전용 게시판 리스트 라우트(리스트, 등록, 편집 순서) - 권한 체크 후 보여줌 */}
//       <Route path="/CMS/boards" element={<Boards />} />
//       <Route path="/CMS/boards/register" element={<BoardRegister />} /> 
//       <Route path="/CMS/boards/:boardId/edit" element={<BoardEdit />} />
        
//         {/* 관리자 전용 예약 리스트 라우트 (권한 체크 포함) */}
//         {/* <Route 
//           path="/admin/reservationList" 
//           element={<ProtectedRoute requiredRole="admin" element={<ReservationList />} />} 
//         /> */}
        

//       </Routes>
//     </BrowserRouter>
//   );
// }