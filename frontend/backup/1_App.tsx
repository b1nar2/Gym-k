import { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import AuthContext from "./context/AuthContext";
import Home from "./pages/user/Home";
import Login from "./pages/user/Login";
import Logout from "./pages/user/Logout";
import MyPage from "./pages/user/mypage/MyPage";
// import ReservationList from "./pages/cms/ReservationList";
import Demo2 from "./pages/cms/Demo2";
import ProtectedRoute from "./context/ProtectedRoute";

import ReservationList from "./pages/cms/ReservationList";
import BoardList from './pages/cms/BoardList'; // 게시판 리스트 컴포넌트


export default function App() {
  const authContext = useContext(AuthContext);
    if (!authContext) return <p>로딩 중...</p>;
    const { authState } = authContext;
  const access = !!authState?.token;
  console.log("***authContext 확인:", authContext )

  return (
    <BrowserRouter>
      <Routes>
        {/* 일반 사용자 라우트 */}
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={access ? <Navigate to="/" replace /> : <Login />}
        />

        {/* 로그아웃 페이지 라우트 */}
        <Route path="/logout" element={<Logout />} />

        {/* 마이페이지 라우트 */}
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/admin/ReservationList" element={<ProtectedRoute requiredRole="admin" />} />
        {/* <Route path="/admin" element={<ReservationList />} /> */}
        
        {/* 관리자 전용 라우트 */}
        {/* <Route path="/admin" element={<ProtectedRoute requiredRole="admin" />}> */}
          {/* 인덱스 페이지(admin의 기본 페이지) */}
          {/*<Route index element={<ReservationList />} />*/}
          {/* <Route path="admin" element={<ReservationList />} /> */}
          {/* 부모경로 admin, 자식경로는 절대 경로가 아닌 상대 경로로 작성해야 함 */}
          {/* <Route path="/CmsReservations" element={<ReservationList />} /> */}
          {/*<Route path="CmsReservations" element={<Demo2 />} />*/}
          {/* <Route path="adminDemo2" element={<Demo2 />} /> */}
          {/* 필요하면 추가 */}
        {/* </Route> */}
      </Routes>
    </BrowserRouter>
  );
}
