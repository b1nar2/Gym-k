// [1] React 및 Router 불러오기
import "./UserApp.css"; //TODO [251021] 스타일 적용
import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"; // ⚠️ BrowserRouter 추가

// [2] AuthContext 불러오기
import AuthContext from "./context/AuthContext";

// [3] [리우UI 적용] 공통 레이아웃 컴포넌트
import Header from "./components/Header";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// [4] [리우UI 적용] 페이지
import Home from "./pages/user/Home";           // 메인 홈
// import DirectionsPage from "./pages/DirectionsPage"; // 오시는 길

// [5] User 페이지 (우리 로직 유지)
import Login from "./pages/user/Login";              // U_LOGIN_00
import Join from "./pages/user/Join";                // U_JOIN_00
import Logout from "./pages/user/Logout";            // 로그아웃
import MyPage from "./pages/user/mypage/MyPage";     // U_MY_00
import UserInfo from "./pages/user/mypage/UserInfo"; // U_MY_01
import UserInfoEdit from "./pages/user/mypage/UserInfoEdit"; //![251005] U_MY_01 회원정보 수정

// [251001] 시설페이지 
import FacilityList from "./pages/user/facility/FacilityList";
import FacilityDetail from "./pages/user/facility/FacilityDetail";
import ReservationForm from "./pages/user/facility/ReservationForm"; // U_FA_02 예약 신청
import PaymentForm from "./pages/user/facility/PaymentForm"; // U_FA_03 : 결제 신청
import Complete from "./pages/user/facility/Complete";       // U_FA_04 : 신청 완료

// [251012] 콘텐츠페이지
import ContentDetail from "./pages/user/content/ContentDetail"; // 사용자 콘텐츠 상세

// [251020 추가] 사용자 게시판/게시글 화면 import
import UserPostList from "./pages/user/board/UserPostList"; // 사용자 게시판 
import UserPostDetail from "./pages/user/board/UserPostDetail"; // 사용자 게시글 상세
import UserPostForm from "./pages/user/board/UserPostForm"; // 사용자 게시글 등록/수정

//! ✅ [251014 추가] 에디터 테스트 화면 import
import EditorTest from "./pages/test/EditorTest";

// [251022] MUI테마 적용
import { ThemeProvider } from '@mui/material/styles';
import theme from './css/user/theme';

// [6] App 컴포넌트 정의
export default function UserApp() {
  const { authState } = useContext(AuthContext)!; // [6-1] 로그인 상태
  const access = !!authState.token;               // [6-2] 토큰 존재 여부

  return (
  <ThemeProvider theme={theme}>
    <BrowserRouter> {/* ⚠️ BrowserRouter로 전체 감싸기 */}
      <div className="UserApp">  {/*//? App → UserApp */}
        {/* [UI 적용] 상단 영역 */}
        <Header />
        <Navbar />

        {/* [라우팅 정의] */}
        <main className="main">
          <Routes>
            {/* [홈 화면] */}
            <Route path="/" element={<Home />} />  {/* [리우UI 적용] */}
            {/* <Route path="/directions" element={<DirectionsPage />} /> */}

            {/* [사용자 기능] */}
            <Route path="/login" element={access ? <Navigate to="/" /> : <Login />} />
            <Route path="/join" element={access ? <Navigate to="/" /> : <Join />} /> 
            <Route path="/logout" element={access ? <Logout /> : <Navigate to="/login" />} />
            <Route path="/mypage" element={access ? <MyPage /> : <Navigate to="/login" />} />
            <Route path="/mypage/info" element={access ? <UserInfo /> : <Navigate to="/login" />} />
            {/*//![251005] 사용자 정보 수정 */}
            <Route path="/mypage/edit" element={access ? <UserInfoEdit /> : <Navigate to="/login" />} />


            {/* 시설가능 */}
            <Route path="/facilities" element={<FacilityList />} />
            <Route path="/facilities/:id" element={<FacilityDetail />} />

            {/* 예약신청 */}
            <Route path="/facilities/:id/reserve" element={access ? <ReservationForm /> : <Navigate to="/login" />} />

            {/* 결제신청 */}
            <Route
              path="/facilities/:id/reserve/payment"
              element={access ? <PaymentForm /> : <Navigate to="/login" />}
            />

            {/* 결제완료 */}
            <Route
              path="/facilities/:id/complete"
              element={access ? <Complete /> : <Navigate to="/login" />}
            />

            {/* ✅ [251012 추가] 사용자 콘텐츠 상세 페이지 라우트 */}
            <Route
              path="/contents/:contentType/:contentNum"
              element={<ContentDetail />}
            />

            {/* ✅ 게시판 (게시판명 클릭 시 이동) */}
            <Route path="/board/:boardId" element={<UserPostList />} />{/* 목록 */}
            <Route path="/board/:boardId/posts/:postId" element={<UserPostDetail />} />{/* 상세 */}
            <Route path="/board/:boardId/form" element={<UserPostForm />} />{/* 등록 */}
            <Route path="/board/:boardId/posts/:postId/edit" element={<UserPostForm />} />{/* 수정 */}
            
            
            {/* //! [251014] 리치 에디터 테스트용 */}
            <Route path="/test/editor" element={<EditorTest />} />
          </Routes>
        </main>

        {/* [리우씨UI 적용] 하단 영역 */}
        <Footer />
      </div>
    </BrowserRouter>
  </ThemeProvider>
  );
}
