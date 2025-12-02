// [1] React 및 훅 불러오기
import { useEffect, useState } from "react";
import { fetchFacilities } from "../../../api/facilityApi";
import { useNavigate } from "react-router-dom";

// [2-1] MUI 컴포넌트 불러오기
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';

// [4] 시설 데이터 타입 정의
interface Facility {
  facilityId: number;        // 시설 고유번호(PK)
  facilityName: string;      // 시설명
  facilityContent: string;   // 시설 설명
  facilityImagePath: string; // 시설 이미지 경로
  facilityType: string;      // 시설 종류(풋살장, 농구장 등)
}

// [5] React 컴포넌트 시작
export default function FacilityList() {
  const navigate = useNavigate();

  // [7] 상태(state) 선언: 화면에서 바뀌는 값들을 저장
  const [items, setItems] = useState<Facility[]>([]);
  const [name, setName] = useState(""); // 검색 필터 - 기본값 ""
  const [facilityType, setFacilityType] = useState(""); // 검색 필터 - 빈값이면 전체 조회
  const [page, setPage] = useState(0); // 현재 페이지 번호

  // [8] 목록 조회 함수: 비동기(async)로 서버에 요청
  const loadFacilities = async () => {
    try {
      // 서버에서 시설 목록을 조회 → 조건(name, facilityType, page, size) 전달
      const data = await fetchFacilities({ name, facilityType, page, size: 10 });
      console.log("데이터:", data); // 서버 응답 콘솔에 출력
      setItems(data.items); // 응답받은 시설 목록을 상태에 저장
    } catch (err) {
      console.error("시설 목록 조회 실패", err); // 오류 시 로그 출력
    }
  };

  // [9] 최초 실행: 컴포넌트가 처음 렌더링되거나 page 값이 바뀔 때 실행
  useEffect(() => {
    loadFacilities(); // 목록 로딩 실행
  }, [page]); // page 값이 변경될 때마다 실행

  // [10] JSX 반환: 실제 화면에 렌더링될 HTML 구조
  return (
    <Box sx={{ bgcolor: "#F6F8FA", minHeight: "100vh", py: 4 }}> {/* *[241013] MUI 전체 배경색 및 상하 패딩 */}
      {/* [11] 검색 UI 영역 */}
      <Box sx={{ display: "flex", gap: 2, mb: 4 }}> {/* *[241013] MUI 가로 정렬, 요소 간 여백, 아래 margin */}
        {/* [11-1] 시설 종류 선택 드롭다운 */}
        <FormControl
          sx={{
            minWidth: 120,
            height: 40,
          }}
          size="small"
        >
          <InputLabel>시설종류</InputLabel>
          <Select
            value={facilityType}
            label="시설종류"
            onChange={(e) => {
              const value = e.target.value;
              setFacilityType(value === "전체" ? "" : value); // 전체 선택 시 빈문자열로 전송
            }}
            sx={{ height: 40 }} // *[241013] MUI Select 높이 맞춤
          >
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="수영장">수영장</MenuItem>
            <MenuItem value="농구장">농구장</MenuItem>
            <MenuItem value="풋살장">풋살장</MenuItem>
            <MenuItem value="배드민턴장">배드민턴장</MenuItem>
            <MenuItem value="볼링장">볼링장</MenuItem>
          </Select>
        </FormControl>

        {/* [11-2] 시설명 입력창 */}
        <TextField
          type="text"
          placeholder="시설명 검색"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          size="small"
          sx={{ height: 40, width: 300 }} // *[241013] MUI TextField 높이 맞춤
          
        />

        {/* [11-3] 조회 버튼 */}
        <Button
          onClick={() => {
            setPage(0);
            loadFacilities();
          }}
          variant="contained"
          color="success"
          sx={{ minWidth: 90, fontWeight: "bold", height: 40 }} // *[241013] MUI 버튼 높이 및 스타일
        >
          조회
        </Button>
      </Box>

      {/* [12] 목록 UI 영역 - CSS gridColumn 속성 사용 */}
      <Grid
        container
        spacing={3}
        maxWidth="lg"
        sx={{ mx: "auto" }}
      >
        {items.map((f) => (
          <Grid
            key={f.facilityId}
            sx={{
              gridColumn: {
                xs: 'span 12', // 모바일: 한 줄 전체 차지
                sm: 'span 6',  // 작은 태블릿: 2개씩
                md: 'span 4',  // 데스크탑: 3개씩
                lg: 'span 3',  // 큰화면: 4개씩
              },
            }}
          >
            <Card
              onClick={() => navigate(`/facilities/${f.facilityId}`)}
              sx={{
                borderRadius: 3, // *[241013] MUI 카드 테두리 둥글게 처리
                boxShadow: 2,    // *[241013] MUI 카드 기본 그림자
                cursor: "pointer", // *[241013] MUI 마우스 커서 포인터
                transition: "0.2s", // *[241013] MUI 부드러운 호버전환
                "&:hover": { boxShadow: 6 }, // *[241013] MUI 호버 시 그림자 증가
              }}
            >
              {/* [12-1] 시설 이미지 */}
              <CardMedia
                component="img"
                height="180"
                image={f.facilityImagePath ? `http://localhost:8181${f.facilityImagePath}` : "/imgtest/999.png"}
                alt={f.facilityName}
                sx={{
                  objectFit: "cover",
                  '& img': {
                    borderTopLeftRadius: 1,     // 이미지 태그에 직접 둥근모서리 적용
                    borderTopRightRadius: 1,
                  },
                  borderTopLeftRadius: 1,  // CardMedia 루트에 적용 (권장)
                  borderTopRightRadius: 1,
                }}
              />
              {/* [12-2] 시설 정보 영역 */}
              <CardContent>
                <Typography variant="h6" fontWeight="bold" mb={1}> {/* *[241013] MUI 제목 폰트 진하게 */}
                  {f.facilityName}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: "-webkit-box",  // *[241013] MUI 2줄 말줄임 처리
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {f.facilityContent}
                </Typography>
                <Box
                  sx={{
                    mt: 1,
                    display: "inline-block",
                    fontSize: 12,
                    bgcolor: "#F3F5F8",  // *[241013] MUI 회색 배경 뱃지
                    color: "#5D6A7A",    // *[241013] MUI 뱃지 글씨 색깔
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,     // *[241013] MUI 둥근 뱃지
                  }}
                >
                  {f.facilityType}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
