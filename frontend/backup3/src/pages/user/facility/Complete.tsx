import { Box, Typography, Button, Paper } from '@mui/material'; // *[251013] MUI 컴포넌트 임포트
import { useTheme } from '@mui/material/styles'; // *[251013] MUI 테마 사용
import { useLocation } from 'react-router-dom'; // *[251013] 현재 URL 위치 정보 획득

/**
 * 결제 완료 컴포넌트
 * 예약 완료 후 안내 및 홈으로 돌아가기 버튼 표시
 */
export default function Complete() {
  const location = useLocation(); // *[251013] 현재 위치 정보 가져오기
  const query = new URLSearchParams(location.search); // *[251013] 쿼리 파라미터 파싱
  const resvId = query.get("resvId"); // *[251013] 예약번호 조회
  const theme = useTheme(); // *[251013] MUI 테마 객체 사용

  return (
    <Paper
      // *[251013] Paper: 테마 기반 카드 컨테이너, 테두리 둥글기 및 그림자 적용
      sx={{
        p: 6, // *[251013] 내부 패딩 설정
        textAlign: 'center', // *[251013] 텍스트 중앙 정렬
        borderRadius: theme.shape.borderRadius, // *[251013] 테마의 borderRadius (둥근 모서리)
        boxShadow: theme.shadows[2], // *[251013] 테마에서 지정된 그림자 스타일
        fontFamily: theme.typography.fontFamily, // *[251013] 폰트 설정
      }}
    >
      <Typography
        variant="h5" // *[251013] 제목 크기 및 스타일 설정
        fontWeight="bold" // *[251013] 글씨 굵게
        mb={4} // *[251013] 아래쪽 마진
        color={theme.palette.text.primary} // *[251013] 기본 텍스트 색상 사용
        fontFamily={theme.typography.fontFamily} // *[251013] 폰트 설정
      >
        결제가 완료되었습니다
      </Typography>

      <Typography variant="body1" mb={2}>
        예약번호: {resvId} {/* *[251013] 예약번호 표시 */}
      </Typography>

      <Button
        variant="contained" // *[251013] 테마의 primary 색상 배경의 버튼
        color="primary"
        sx={{
          mt: 4, // *[251013] 위쪽 마진
          borderRadius: theme.shape.borderRadius, // *[251013] 둥근 모서리 적용
          textTransform: 'none', // *[251013] 대문자 변환 비활성화
          fontFamily: theme.typography.fontFamily, // *[251013] 폰트 설정
        }}
        onClick={() => (window.location.href = "/")} // *[251013] 클릭 시 홈 화면으로 이동
      >
        홈으로 돌아가기
      </Button>
    </Paper>
  );
}
