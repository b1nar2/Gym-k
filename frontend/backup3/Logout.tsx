// [1] React 불러오기
import React from "react";

// [2] 라우터 이동용 훅
import { useNavigate } from "react-router-dom";

// [3] AuthContext 연동용 커스텀 훅
import { useAuth } from "../../auth/useAuth";

// *[251016] MUI 컴포넌트 import
import Box from '@mui/material/Box';          // 251016 레이아웃용 박스
import Typography from '@mui/material/Typography';  // 251016 타이포그래피
import Button from '@mui/material/Button';    // 251016 버튼

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

  // [4-4] 렌더링: MUI Box로 레이아웃 감싸고 Typography, Button으로 구성
  return (
    <Box
      className="wrapper"
      sx={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        p: 4,
      }}
    >
      <Box
        className="container"
        sx={{
          maxWidth: 480,
          width: "100%",
          backgroundColor: "background.paper",
          boxShadow: 3,
          borderRadius: 2,
          p: 4,
          textAlign: "center",
        }}
      >
        <Typography variant="h4" component="h1" className="title" gutterBottom>
          로그아웃
        </Typography>
        <Typography variant="body1" mb={3}>
          {authState.memberName ?? ""}님, 로그아웃 하시겠습니까?
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleLogout}
          className="btn logout"
          fullWidth
          size="large"
          sx={{ fontWeight: "bold" }}
        >
          로그아웃
        </Button>
      </Box>
    </Box>
  );
}
