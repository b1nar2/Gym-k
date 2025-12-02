// [1] React 및 훅 불러오기
import React, { useContext } from "react"; // [1-1] useContext: 전역 Context(AuthContext) 접근용
import { Link } from "react-router-dom";   // [1-2] Link: 페이지 이동용 컴포넌트
import AuthContext from "../context/AuthContext"; //! [251002] 추가사항: 로그인 상태 확인 및 로그아웃 처리를 위해 AuthContext 불러오기

// *[251012] MUI 컴포넌트 import
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography'; // 사용자 이름 폰트 일관성 위해 추가


// [251013] 날씨 정보 추가
import WeatherInfo from "./WeatherInfo";

/**
 * 📌 Header 컴포넌트
 * - 상단 로고, 시설 이용 신청 버튼, 로그인 여부에 따른 버튼 표시
 */
const Header: React.FC = () => {
  // [2] AuthContext 사용해서 로그인 상태(authState)와 로그아웃 핸들러 가져오기
  const { authState, logoutHandler } = useContext(AuthContext)!; //! [251002] 추가사항: Context에서 authState, logoutHandler 추출
  const access = !!authState.token; // [2-1] 토큰 존재 여부로 로그인 여부 판별

  return (
    // [3] 최상단 헤더 영역 레이아웃
    <header className="flex justify-between items-center bg-gray-200 p-4 shadow"
      style={{ marginBottom: 16 }} // 네비게이션바 아래 공간 확보
    >
      {/* [3-1] 좌측 로고 영역 */}
      <div className="text-xl font-bold text-gray-800">
        <Link to="/">🏋 체육관 예약 시스템</Link> {/* 로고 클릭 시 홈("/")으로 이동 */}
      </div>

      {/* [3-2] 우측 메뉴 영역 */}
      {/* // *[251012] MUI Stack으로 버튼 간격 조절, width 100% 적용 */}
      <Stack
        direction="row"
        alignItems="center"
        sx={{ width: '100%' }}
        justifyContent="space-between" // 좌우 끝 정렬
      >
        {/* 251013 시설 이용 신청 버튼 비활성화 */}
        {/* 
        <Button
          component={Link} // *[251012] react-router-dom Link 컴포넌트로 동작하도록 설정
          to="/facilities" //! [251002] 추가사항: 정확히 /facilities 로 이동하도록 수정
          variant="contained" // *[251012] MUI 스타일 variant 지정
          color="primary" // *[251012] MUI 스타일 color 지정
        >
          시설 이용 신청
        </Button> 
        */}

        {/* [3-2-1] 로그인 여부(access)에 따른 분기 처리 */}
        {access ? (
          <Stack direction="row" spacing={2} alignItems="center" sx={{ marginLeft: 'auto' }}>
            {/* 로그인 사용자 이름을 Typography로 감싸 폰트 굵기 일관성 적용 */}
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              {authState.memberName}님
            </Typography>

            {/* //! [251013] 버튼 그룹을 오른쪽 끝으로 정렬하기 위해 별도 Stack 감싸기 */}
            <Button
              component={Link} // *[251012] Link 컴포넌트 적용
              to="/mypage"
              variant="outlined" // *[251012] MUI outlined variant
              color="success" // *[251012] MUI success color
              sx={{ minWidth: 100 }} // *[251012] 최소 너비 보장
            >
              마이페이지 {/* 로그인 시 접근 가능 */}
            </Button>

            <Button
              onClick={logoutHandler} //! [251002] 로그아웃 버튼 클릭 시 Context logoutHandler 실행
              variant="contained" // *[251012] MUI contained variant
              color="primary" // *[251012] MUI primary color
              sx={{ minWidth: 100 }} // *[251012] 최소 너비 보장
            >
              로그아웃
            </Button>
          </Stack>
        ) : (
          // //! [251013] 비로그인 상태일 때 회원가입, 로그인 버튼 오른쪽 끝 정렬 위해 Stack과 marginLeft auto 스타일 적용
          <Stack direction="row" spacing={2} sx={{ marginLeft: 'auto' }}>
            <Button
              component={Link} // *[251012] Link 컴포넌트 적용
              to="/join"
              variant="outlined" // *[251012] MUI outlined variant
              color="success" // *[251012] MUI success color
            >
              회원가입
            </Button>
            <Button
              component={Link} // *[251012] Link 컴포넌트 적용
              to="/login"
              variant="contained" // *[251012] MUI contained variant
              color="primary" // *[251012] MUI primary color
            >
              로그인
            </Button>
          </Stack>
        )}
      </Stack>
    </header>
  );
};

export default Header; // [4] 컴포넌트 export
