// [1] React 및 훅 불러오기
import React, { useContext } from "react"; // [1-1] useContext: 전역 Context(AuthContext) 접근용
import { Link } from "react-router-dom";   // [1-2] Link: 페이지 이동용 컴포넌트
import AuthContext from "../context/AuthContext"; //! [251002] 추가사항: 로그인 상태 확인 및 로그아웃 처리를 위해 AuthContext 불러오기

// [251016] 알림 아이콘 컴포넌트 import (빨간 점 뱃지 포함)
import NotificationBell from "./Notification/NotificationBell"; // [추후 활성화 예정] 알림 컴포넌트 비활성화 위해 주석 처리

import Box from '@mui/material/Box'; // * 251016 레이아웃 박스
import Button from '@mui/material/Button'; // * 251016 버튼
import Typography from '@mui/material/Typography'; // * 251016 텍스트 (폰트 일관성 위해 추가)

const Header: React.FC = () => {
  // [2] AuthContext 사용해서 로그인 상태(authState)와 로그아웃 핸들러 가져오기
  const { authState, logoutHandler } = useContext(AuthContext)!; //! [251002]
  const access = !!authState.token; // [2-1] 토큰 존재 여부로 로그인 여부 판별

  return (
    // [3] 최상단 헤더 영역 레이아웃
    <Box 
      component="header"
      sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        bgcolor: 'grey.200', 
        p: 2, 
        boxShadow: "none",
        mb: 2, // 네비게이션바 아래 공간 확보
      }}
    >
      {/* [3-1] 좌측 로고 영역 */}
      <Typography variant="h6" fontWeight="bold" color="text.primary">
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>🏋 체육관 예약 시스템</Link> {/* 로고 클릭 시 홈("/")으로 이동 */}
      </Typography>

      {/* [3-2] 우측 메뉴 영역 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* ✅ 항상 보이는 시설 이용 신청 버튼 (현재는 주석 처리) */}
        {/*
          <Button 
            component={Link} 
            to="/facilities" 
            variant="contained" 
            color="primary"
          >
            시설 이용 신청
          </Button> 
        */}

        {/* [3-2-1] 로그인 여부(access)에 따른 분기 처리 */}
        {access ? ( 
          <>
            {/* 로그인 상태일 때 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="body1" 
                fontWeight="bold" 
                component="div"
                sx={{ display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                }}
              >
                {authState.memberName}님
                <NotificationBell />
                {/* [추후 활성화 예정] 알림 아이콘 비활성화 처리 */}
              </Typography>

              <Button
                component={Link} // *[251016] Link 컴포넌트 적용
                to="/mypage"
                variant="outlined" // *[251016] MUI outlined variant
                color="success" // *[251016] MUI success color
                sx={{ minWidth: 100 }}
              >
                마이페이지 {/* 로그인 시 접근 가능 */}
              </Button>

              <Button
                onClick={logoutHandler} //! [251002] 로그아웃 버튼 클릭 시 Context의 logoutHandler 실행
                variant="contained" // *[251016] MUI contained variant
                color="primary" // *[251016] MUI primary color
                sx={{ minWidth: 100 }}
              >
                로그아웃
              </Button>
            </Box>
          </>
        ) : (
          <>
            {/* 비로그인 상태일 때 */}
            <Button
              component={Link}
              to="/join"
              variant="outlined"
              color="success"
              sx={{ minWidth: 100 }}
            >
              회원가입
            </Button>
            <Button
              component={Link}
              to="/login"
              variant="contained"
              color="primary"
              sx={{ minWidth: 100 }}
            >
              로그인
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Header; // [4] 컴포넌트 export
