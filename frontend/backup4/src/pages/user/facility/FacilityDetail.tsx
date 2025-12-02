import { useEffect, useState } from "react"; // [1] React 훅 불러오기
import { useParams, useNavigate } from "react-router-dom"; // [2] 라우팅 훅
import { fetchFacilityById } from "../../../api/facilityApi"; // [3] 단건 조회 API

// * 251016 MUI 컴포넌트 import 
import Box from '@mui/material/Box'; // * 251016 레이아웃 컨테이너
import Typography from '@mui/material/Typography'; // * 251016 텍스트 스타일링
import Button from '@mui/material/Button'; // * 251016 버튼

// 데이터 타입 정의
interface Facility {
  facilityId: number;       
  facilityName: string;     
  facilityContent: string;  
  facilityMoney: number;    
  facilityOpenTime: string; 
  facilityCloseTime: string;
}

export default function FacilityDetail() {
  const { id } = useParams<{ id: string }>(); // [6] URL 파라미터
  const navigate = useNavigate(); // [7] 페이지 이동
  const [facility, setFacility] = useState<Facility | null>(null); // [8] 상태

  useEffect(() => {
    if (id) {
      fetchFacilityById(Number(id))
        .then(setFacility)
        .catch(console.error);
    }
  }, [id]);

  if (!facility) return <Box p={6}>로딩중...</Box>; // [11] 로딩 표시 MUI Box로

  return (
    <Box p={6} maxWidth={720} mx="auto"> {/* [251016] MUI 패딩, 최대너비, 중앙정렬 */}
      <Typography variant="h4" fontWeight="bold" mb={4}> {/* [251016] 제목 */}
        {facility.facilityName}
      </Typography>

      <Typography mb={4}> {/* [251016] 설명 텍스트 */}
        {facility.facilityContent}
      </Typography>

      {/* [12-1] 이용료 영역 */}
      <Box display="flex" gap={2} mb={4}>
        <Typography fontWeight="medium">이용료:</Typography>
        <Typography>{facility.facilityMoney.toLocaleString()} 원</Typography>
      </Box>

      {/* [12-2] 운영시간 영역 */}
      <Box display="flex" gap={2} mb={4}>
        <Typography fontWeight="medium">운영시간:</Typography>
        <Typography>
          {facility.facilityOpenTime} ~ {facility.facilityCloseTime}
        </Typography>
      </Box>

      {/* [12-3] 예약 버튼 */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate(`/facilities/${facility.facilityId}/reserve`)}
        sx={{ px: 4, py: 1.5 }}
      >
        예약하기
      </Button>
    </Box>
  );
}
