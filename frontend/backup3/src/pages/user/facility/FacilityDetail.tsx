import { useEffect, useState } from "react"; // [1] React 훅 불러오기
import { useParams, useNavigate } from "react-router-dom"; // [2] 라우팅 훅: URL 파라미터/이동
import { fetchFacilityById } from "../../../api/facilityApi"; // [3] 단건 조회 API 함수 import

// [2-1] MUI 컴포넌트 불러오기
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

// [4] 시설 상세 데이터 구조 정의
interface Facility {
  facilityId: number;        // PK
  facilityName: string;      // 시설명
  facilityContent: string;   // 설명
  facilityMoney: number;     // 이용료
  facilityOpenTime: string;  // 개장시간
  facilityCloseTime: string; // 폐장시간
}

// [5] 컴포넌트 시작
export default function FacilityDetail() {
  const { id } = useParams<{ id: string }>(); // [6] URL에서 id 파라미터 추출
  const navigate = useNavigate(); // [7] 페이지 이동 함수
  const [facility, setFacility] = useState<Facility | null>(null); // [8] 시설 정보 상태

  // [9] 컴포넌트 로딩 시 / id 변경 시 실행
  useEffect(() => {
    if (id) {
      fetchFacilityById(Number(id)) // [10] API 호출 (문자열 → 숫자 변환)
        .then(setFacility) // 성공 시 facility 상태에 저장
        .catch(console.error); // 실패 시 로그 출력
    }
  }, [id]);

  // [11] facility 값이 없으면 "로딩중..." 출력
  if (!facility) return <Box sx={{ p: 6 }}>로딩중...</Box>;

  // [12] facility 값이 있으면 상세 화면 출력
  return (
    <Box sx={{ p: 6, maxWidth: 720, mx: "auto" }}> {/* *[241013] MUI 전체 레이아웃 박스, 가운데 정렬, 최대 너비 */}
      <Typography variant="h4" fontWeight="bold" mb={4}> {/* *[241013] MUI 제목, 굵기, 아래 여백 */}
        {facility.facilityName}
      </Typography>
      <Typography mb={4}> {/* *[241013] MUI 설명 텍스트 아래 여백 */}
        {facility.facilityContent}
      </Typography>

      {/* [12-1] 이용료 영역 */}
      <Box sx={{ display: "flex", gap: 2, mb: 4 }}> {/* *[241013] MUI flex 레이아웃, 요소 간 간격 */}
        <Typography fontWeight="semibold">이용료:</Typography> {/* *[241013] MUI 레이블 굵기 */}
        <Typography>{facility.facilityMoney.toLocaleString()} 원</Typography> {/* *[241013] 숫자 포맷 */}
      </Box>

      {/* [12-2] 운영시간 영역 */}
      <Box sx={{ display: "flex", gap: 2, mb: 4 }}> {/* *[241013] 유사한 flex 레이아웃 */}
        <Typography fontWeight="semibold">운영시간:</Typography>
        <Typography>
          {facility.facilityOpenTime} ~ {facility.facilityCloseTime}
        </Typography>
      </Box>

      {/* [12-3] 예약 버튼 */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate(`/facilities/${facility.facilityId}/reserve`)} // 예약 페이지 이동
        sx={{ px: 4, py: 2, borderRadius: 2 }} // *[241013] MUI 버튼 패딩, 둥근 모서리
      >
        예약하기
      </Button>
    </Box>
  );
}
