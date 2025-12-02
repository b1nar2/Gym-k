// [1] React 및 훅 불러오기
import { Link } from "react-router-dom"; // [1-1] Link: 페이지 이동 링크
import { useAuth } from "../../auth/useAuth"; // [1-2] 로그인 상태 확인용 훅


// [2] 공통 UI 컴포넌트 (리우씨 UI)
// import Header from "../../components/Header";
// import Navbar from "../../components/NavBar";
import FacilityCard from "../../components/FacilityCard";
import NoticeTable from "../../components/NoticeTable";
import ContentTable from "../../components/ContentTable";
// import Footer from "../../components/Footer";


// [2-1] MUI 컴포넌트 불러오기
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';


// [3] Home 컴포넌트
export default function Home() {
  const { authState } = useAuth(); // [3-1] Context에서 현재 로그인 상태 가져오기
  const access = !!authState.token; // [3-2] 토큰 여부로 로그인 판별


  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'grey.50',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Noto Sans KR", sans-serif'
      }}
    >
      {/* [리우 UI] 메인 콘텐츠 - 컨테이너로 전체 감싸기 */}
      <Container maxWidth="lg" sx={{ flex: 1, py: 6 }}>
        {/* 로그인 상태 안내 (기능 그대로, UI만 MUI로 변경) */}
        <Box mb={6} textAlign="center">

        {/* 251013 로그인/회원가입 - 마이페이지/로그아웃 버튼 비활성화 */}
        {/*
          {access ? (
            // [로그인 상태: 마이페이지/로그아웃 버튼 제공]
            <Stack spacing={2} alignItems="center">
              <Typography variant="h4" fontWeight={700} color="primary.main">
                환영합니다! {authState.memberName}님
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  component={Link}
                  to="/mypage"ㄴ
                  variant="contained"
                  color="primary"
                  sx={{ minWidth: 120, borderRadius: 2, boxShadow: 2 }}
                >
                  마이페이지
                </Button>
                <Button
                  component={Link}
                  to="/logout"
                  variant="outlined"
                  color="primary"
                  sx={{ minWidth: 120, borderRadius: 2 }}
                >
                  로그아웃
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={2} alignItems="center">
              <Stack direction="row" spacing={2}>
                <Button
                  component={Link}
                  to="/login"
                  variant="contained"
                  color="primary"
                  sx={{ minWidth: 120, borderRadius: 2, boxShadow: 2 }}
                >
                  로그인
                </Button>
                <Button
                  component={Link}
                  to="/join"
                  variant="outlined"
                  color="primary"
                  sx={{ minWidth: 120, borderRadius: 2 }}
                >
                  회원가입
                </Button>
              </Stack>
            </Stack>
          )}
          */}
        </Box>


        {/* 시설 카드 그룹 */}
        <Grid container spacing={3} mb={6}>
          {/* [4] 주요 시설 별 카드 컴포넌트 */}
          {['수영장', '볼링장', '농구장', '풋살장', '배드민턴장'].map((name) => (
            <Grid
              key={name}
              // 251012 반응형 그리드: 화면 크기에 따라 컬럼 수 자동 조절
              sx={{
                gridColumn: {
                  xs: 'span 12',  // 251012 모바일: 한 줄 전체 사용 (1개씩)
                  sm: 'span 6',   // 251012 작은 태블릿: 한 줄에 2개 (12/6=2)
                  md: 'span 3',   // 251012 데스크탑 중간 크기: 한 줄에 4개 (12/3=4)
                  lg: 'span 2',   // 251012 큰 화면: 한 줄에 6개 (12/2=6)
                }
              }}
            >
              <FacilityCard name={name} />
            </Grid>
          ))}
        </Grid>


        {/* 구분선 */}
        <Divider sx={{ my: 4 }} />


        {/* 공지사항 + 콘텐츠 테이블 (MUI Paper로 감싸기) */}
        <Grid container spacing={3}>
          <Grid
            // 251012 반응형 그리드: 작은 화면에서는 전체 너비, 중간 이상은 절반 너비로 배치
            sx={{
              gridColumn: {
                xs: 'span 12',  // 251012 모바일: 전체 넓이 사용
                md: 'span 6',   // 251012 데스크탑 이상: 2등분 (한 줄에 2개)
              }
            }}
          >
            <Paper elevation={2} sx={{ p: 2, borderRadius: 3, height: '100%' }}>
              <NoticeTable />
            </Paper>
          </Grid>
          <Grid
            sx={{
              gridColumn: {
                xs: 'span 12',  // 251012 모바일: 전체 넓이 사용
                md: 'span 6',   // 251012 데스크탑 이상: 2등분 (한 줄에 2개)
              }
            }}
          >
            <Paper elevation={2} sx={{ p: 2, borderRadius: 3, height: '100%' }}>
              <ContentTable />
            </Paper>
          </Grid>
        </Grid>
      </Container>
      {/* [리우 UI] 하단 영역 */}
      {/* <Footer /> */}
    </Box>
  );
}
