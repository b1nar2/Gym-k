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
  facilityImagePath: string; // 시설 이미지 경로
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

  //* -----------------------[251021] 이미지 -----------------------
  // 이미지 경로 중복(/images/images) 방지 처리 및 기본이미지 지정
  const imageUrl = facility.facilityImagePath
    ? (facility.facilityImagePath.startsWith("/images")
        ? `http://localhost:8181${facility.facilityImagePath}`
        : `http://localhost:8181/images/${facility.facilityImagePath}`)
    : "/no-image.png";
  //* --------------------------------------------------------------
    
  return (
    <Box p={6} maxWidth={720} mx="auto"> {/* [251016] MUI 패딩, 최대너비, 중앙정렬 */}

     {/* //* -----------------------[251021] 이미지 ----------------------- */}
      {/* 시설 상세 상단 대표 이미지 표시 영역 */}
      <div className="mb-6">
        <img
          src={imageUrl}
          alt={facility.facilityName}
          className="w-full h-80 object-cover rounded-lg shadow-md"
          style={{
            width: "40vw",          // 화면 전체의 40% 비율로 고정
            height: "auto",         // 세로는 비율에 맞춰 자동 조정
            objectFit: "cover",     // 비율 유지하며 꽉 채움
            objectPosition: "center", // 중앙 기준으로 크롭
            borderRadius: "0.75rem",  // 모서리 둥글게
          }}
        />
      </div>
      {/* //* ------------------------------------------------------------ */}
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
