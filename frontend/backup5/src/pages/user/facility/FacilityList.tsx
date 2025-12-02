import React, { useEffect, useState } from "react"; // [1] React 훅 불러오기
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
import { Grid } from '@mui/material';

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
  }, [page]);

  // [10] JSX 반환: 실제 화면에 렌더링될 HTML 구조
  return (
    <Box 
      sx={{ 
        bgcolor: "#F6F8FA", 
        minHeight: "100vh", 
        py: { xs: 2, sm: 4, md: 6 },     // *[251021] (반응형 상하 패딩)
        px: { xs: 1, sm: 3 },             // *[251021] (반응형 좌우 패딩)
      }}
    > {/* *[241013] MUI 전체 배경색 및 상하 패딩 */}
      {/* [11] 검색 UI 영역 */}
      <Box 
        sx={{ 
          display: "flex", 
          flexWrap: "wrap",                 // *[251021] (반응형 줄넘김)
          gap: 2, 
          mb: 4 ,
        justifyContent: "center"         // *[251021] 검색영역 가운데 정렬
        }}
      > {/* *[241013] MUI 가로 정렬, 요소 간 여백, 아래 margin */}
        {/* [11-1] 시설 종류 선택 드롭다운 */}
        <FormControl
          sx={{
            minWidth: 120,
            height: 40,
            flexGrow: 1,                   // *[251021] (믹스되어 너비 조절됨)
            maxWidth: { xs: "100%", sm: 180 } // *[251021] (반응형 최대 너비)
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
          sx={{ 
            height: 40, 
            minWidth: { xs: "100%", sm: 240 },   // *[251021] (반응형 최소 너비)
            flexGrow: 1,
            maxWidth: 400                  // *[251021] (최대 너비 제한)
          }}
        />

        {/* [11-3] 조회 버튼 */}
        <Button
          onClick={() => {
            setPage(0);
            loadFacilities();
          }}
          variant="contained"
          sx={{
            minWidth: 90,
            fontWeight: "bold",
            fontSize : 16,
            height: 40,
            backgroundColor: "#5ae048",      // *[251021] (조회버튼 초록색 직접 지정)
            color: "white",
            "&:hover": {
              backgroundColor: "#48b43d",
            }
          }}
        >
          조회
        </Button>
      </Box>

      {/* [12] 목록 UI 영역 - 반응형 그리드, 동일한 카드 크기 고정 */}
      <Grid
        container
        spacing={3}
        maxWidth="lg"
        alignItems="stretch"               // *[251021] (모든 카드 동일 높이로 정렬)
        sx={{ 
          mx: "auto",
          px: { xs: 1, sm: 4 }             // *[251021] (반응형 좌우 패딩)
        }}
      >
        {items.map((f) => (
          <Grid
            item    // 반드시 prop으로만!
            key={f.facilityId}
            xs={12}
            sm={6}
            md={4}
            lg={3}
          >
            <Card
              onClick={() => navigate(`/facilities/${f.facilityId}`)}
              sx={{
                width: { xs: "100%", sm: 260, md: 260 },   // *[251021] (카드 너비 고정)
                height: { xs: 340, sm: 360, md: 380 },     // *[251021] (카드 높이 고정)
                display: "flex",
                flexDirection: "column",
                borderRadius: 1,
                boxShadow: 2,
                cursor: "pointer",
                transition: "0.2s",
                overflow: "hidden",
                "&:hover": { boxShadow: 6 },
                mx: "auto"
              }}
            >

            {/* [12-1] 시설 이미지 */}
            <img
              src={
                f.facilityImagePath && f.facilityImagePath !== "string" // [251023] facilityImagePath가 "string" 같은 잘못된 값일 경우 기본 이미지로 교체
                //* -------------------- 251021 images 경로 중복 방지 -----------------------------
                //!  ? `http://localhost:8181${f.facilityImagePath}` //! ✅ 백엔드 경로 직접 지정
                //!  : "/no-image.png" //! 이미지 없을 때 기본 이미지
                ? (f.facilityImagePath.startsWith("/images")       // ✅ 중복 방지
                ? `http://localhost:8181${f.facilityImagePath}` // 이미 "/images" 포함 → 그대로 붙임
                : `http://localhost:8181/images/${f.facilityImagePath}`) // 없을 때만 추가
                : "/no-image.png"
                //* -------------------- 251021 images 경로 중복 방지 -----------------------------
              }
              alt={f.facilityName}
              className="w-full h-40 object-cover rounded-t-lg"
              //! [251010] 이미지 크기 조정
              style={{
                width: "100%",
                height: "300px",
                objectFit: "cover",
                objectPosition: "center",
                borderTopLeftRadius: "0.5rem",
                borderTopRightRadius: "0.5rem",
              }}
            />
              {/* [12-2] 시설 정보 영역 */}
              <CardContent sx={{
                flexGrow: 1,                    // *[251021] (내용 부분 여분 공간 채움)
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                p: 2
              }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" mb={1}>
                    {f.facilityName}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {f.facilityContent}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    mt: 1,
                    display: "inline-block",
                    fontSize: 12,
                    bgcolor: "#F3F5F8",
                    color: "#5D6A7A",
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
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
