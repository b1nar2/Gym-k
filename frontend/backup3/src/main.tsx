// 251012 MUI 테마 프로바이더 추가
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'

// [1] React 불러오기
import React from "react";

// [2] ReactDOM의 createRoot 불러오기 (React 18 방식)
import { createRoot } from "react-dom/client";

// [3] 최상위 UserApp 컴포넌트 불러오기
import UserApp from "./UserApp"; //? App → UserApp으로 변경, 파일명/컴포넌트명 맞춤 (".tsx" 확장자 빼도 됨)
// import CmsApp from "./CmsApp";   //? [251005] 관리자용 메인 App 추가함

// [4] AuthProvider 불러오기
import { AuthProvider } from "./context/AuthContext.tsx";

// [5] root 엘리먼트 가져오기 (index.html의 <div id="root">)
const root = document.getElementById("root") as HTMLElement;

// 251012 MUI 테마 직접 정의 또는 별도의 theme 파일 import 후 사용 권장
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
  },
})

// [6] ReactDOM으로 렌더링 시작
createRoot(root).render(
  // 기본은 User(회원)
  <React.StrictMode>
    {/* 251012 ThemeProvider로 전체 앱 감싸 MUI 테마 적용 */}
    <ThemeProvider theme={theme}>
      {/* 251012 기본 CSS 리셋 적용 */}
      <CssBaseline />
      {/* [6-1] AuthProvider로 UserApp을 감싸 전역 인증 상태 제공 */}
      <AuthProvider>
        <UserApp />   {/*//? App → UserApp */}
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);

//? [251005] CMS 전용 영역 분기 처리
//? 만약 현재 경로가 /cms로 시작한다면, 위의 UserApp 렌더링 대신 CmsApp 실행
// if (window.location.pathname.startsWith("/cms")) {
//   // [6-new-1] 관리자 전용 앱 실행
//   const cmsRoot = document.getElementById("root") as HTMLElement; // 동일 루트 엘리먼트 사용
//   createRoot(cmsRoot).render(
//     <React.StrictMode>
//       <CmsApp /> {/* CMSApp.tsx 내부의 라우터 구조 실행 */}
//     </React.StrictMode>
//   );
// }
