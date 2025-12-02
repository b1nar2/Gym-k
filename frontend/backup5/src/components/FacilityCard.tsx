/**
 * 📌 FacilityCard 컴포넌트 [251023]
 * - 체육관 내 특정 시설(수영장, 볼링장 등)을 카드 형태로 표시
 * - 이름(name)과 이미지(image) props로 받아서 출력
 * - '시설 이용 신청' 버튼 클릭 시 예약 페이지로 이동
 * - 기존 주석 유지 및 추가 설명 포함
 */
import React from 'react';
import { Link } from 'react-router-dom'; // ✅ 라우터 링크용 import
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';


// [251023] FacilityCard에 전달될 props 타입 정의
interface FacilityCardProps {
  name: string;               // 시설 이름 (예: 수영장, 농구장 등)
  image?: string;             // 시설 이미지 경로 (옵션)
  reservationUrl?: string;    // 예약 신청 페이지 URL (옵션)
}


// [251023] FacilityCard 컴포넌트 구현
const FacilityCard: React.FC<FacilityCardProps> = ({ name, image, reservationUrl }) => {
  return (
    // 카드 전체를 감싸며 스타일 적용, hover 시 그림자 효과 추가
    <Card
      sx={{
        width: 210,       // [251023] 카드 너비 고정
        borderRadius: 0.5, // [251023] 카드 모서리 둥글게 설정
        cursor: 'pointer', // [251023] 마우스 포인터 모양 변경
        display: 'flex',
        flexDirection: 'column', // [251023] 세로 방향 배치
        '&:hover': { boxShadow: '0 0 8px 3px rgba(44, 202, 44, 0.23)' }, // [251023] 녹색 테두리 그림자 효과
        mx: 'auto', // [251023] 좌우 중앙 정렬
      }}
    >
      {/* [251023] 시설 이미지 감싸는 Link: 클릭 시 시설 목록 페이지로 이동 */}
      <Link to="/facilities">
        {image ? (
          // [251023] 이미지가 있으면 CardMedia로 출력, 스타일 지정
          <CardMedia
            component="img" // HTML img 요소로 렌더링
            image={image}
            alt={name}
            sx={{
              width: '100%',    // [251023] 가로폭 100%
              height: '240px',   // [251023] 고정 높이
              objectFit: 'cover', // [251023] 이미지 비율 유지하며 꽉 채움
              mx: 'auto',         // [251023] 수평 중앙 정렬
              borderRadius: 0,    // [251023] 모서리 둥글기 없음 (상단 카드랑 연결)
            }}
          />
        ) : (
          // [251023] 이미지 없는 경우 대체 빈 박스(회색 배경), 크기 및 중앙 정렬 포함
          <Box
            sx={{
              height: 140,
              backgroundColor: 'grey.300',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1,
            }}
          >
            {/* [251023] 빈 공간, 필요 시 아이콘이나 텍스트 삽입 가능 */}
          </Box>
        )}
      </Link>

      {/* [251023] 카드 하단에 시설명, 예약 버튼 */}
      <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
        {/* 시설명 텍스트: 제목 스타일 variant h6 사용 */}
        <Typography gutterBottom variant="h6" component="div">
          {name}
        </Typography>

        {/* 예약 버튼: 링크 컴포넌트로 감싸고 스타일 적용 */}
        <Button
          component={Link}
          to={reservationUrl ? reservationUrl : `/reservation/${name}`} // [251023] 예약 URL, 전달된 예약 URL 우선 사용, 없으면 name 기반 생성
          variant="contained"
          color="primary"
          fullWidth
          sx={{ borderRadius: 2, textTransform: 'none' }} // [251023] 버튼 테두리 둥글게, 텍스트 변환 없음
        >
          시설 이용 신청
        </Button>
      </CardContent>
    </Card>
  );
};


export default FacilityCard;
