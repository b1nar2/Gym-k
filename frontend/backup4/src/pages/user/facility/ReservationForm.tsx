import React, { useState, useEffect } from "react"; // [1] React 훅과 라우터 기능 불러오기
import { useParams, useNavigate } from "react-router-dom";  // [1-2] 라우터 훅

import { fetchFacilityById } from "../../../api/facilityApi"; // [2-1] 시설 단건 조회 API
import { createReservation } from "../../../api/reservationApi"; // [2-2] 예약 등록 API

import { useAuth } from "../../../auth/useAuth"; // [3-1] 로그인 정보 컨텍스트

// [251013] MUI 디자인 컴포넌트 import
import Box from '@mui/material/Box';  // 컨테이너 박스
import Typography from '@mui/material/Typography';  // 텍스트
import TextField from '@mui/material/TextField';  // 입력 필드
import Button from '@mui/material/Button';  // 버튼
import Select from '@mui/material/Select';  // 드롭다운 셀렉트박스
import MenuItem from '@mui/material/MenuItem';  // 셀렉트 옵션
import InputLabel from '@mui/material/InputLabel';  // 입력 라벨
import FormControl from '@mui/material/FormControl';  // 폼 컨트롤 그룹

// [4] 시설 데이터 타입 정의
interface Facility {
  facilityId: number; // [4-1]
  facilityName: string; // [4-2]
  facilityContent: string; // [4-3]
  facilityMoney: number; // [4-4]
  facilityOpenTime: string; // [4-5]
  facilityCloseTime: string; // [4-6]
}

export default function ReservationForm() {
  const { id } = useParams<{ id: string }>(); // [5-1] URL에서 시설 ID 추출
  const navigate = useNavigate(); // [5-2] 페이지 이동 함수
  const { authState } = useAuth(); // [5-3] 로그인 정보

  // 상태 선언
  const [facility, setFacility] = useState<Facility | null>(null);
  const [personCount, setPersonCount] = useState<number>(1);
  const [mobile, setMobile] = useState<string>(authState.memberMobile || "");
  const [wantDate, setWantDate] = useState<string>("");
  const [startHour, setStartHour] = useState<string>("09");
  const [endHour, setEndHour] = useState<string>("10");
  const [totalMoney, setTotalMoney] = useState<number>(0);

  // 시설 정보 불러오기
  useEffect(() => {
    if (id) {
      fetchFacilityById(Number(id))
        .then(setFacility)
        .catch(console.error);
    }
  }, [id]);

  // 이용료 자동계산 *[251021] (총 금액 자동 계산)
  useEffect(() => {
    if (facility) {
      const hours = Number(endHour) - Number(startHour);
      setTotalMoney(hours > 0 ? hours * facility.facilityMoney : 0);
    }
  }, [facility, startHour, endHour]);

  // 예약 신청 처리 함수
  const handleSubmit = async () => {
    if (!facility) return;
    const request = {
      facilityId: facility.facilityId,
      resvContent: "",
      wantDate: wantDate,
      resvPersonCount: personCount,
      startHour: startHour,
      endHour: endHour,
    };

    try {
      const resvId = await createReservation(request);
      navigate(`/facilities/${id}/reserve/payment?resvId=${resvId}&money=${totalMoney}`);
    } catch (err) {
      console.error("예약 실패", err);
      alert("예약 신청에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 로딩 처리
  if (!facility) return <Box sx={{ p: 6 }}>로딩중...</Box>;

  return (
    <Box sx={{ p: 6, maxWidth: 640, mx: "auto" }}> {/* *[251013] MUI 컨테이너, 패딩/최대 너비/중앙 정렬 */}
      <Typography variant="h5" fontWeight="bold" mb={4}> {/* *[251013] 제목, 굵게, 아래 여백 */}
        예약 신청
      </Typography>

      {/* [22] 시설 상세 정보 */}
      <Box mb={4}>
        <Typography variant="h6" fontWeight="bold">{facility.facilityName}</Typography> {/* *[251013] 시설명 볼드 */}
        <Typography mb={1}>{facility.facilityContent}</Typography> {/* *[251013] 설명 텍스트 */}
        <Typography mb={1}>
          이용료(1시간): {facility.facilityMoney.toLocaleString()} 원
        </Typography>
        <Typography>
          운영시간: {facility.facilityOpenTime} ~ {facility.facilityCloseTime}
        </Typography>
      </Box>

      {/* [23] 대표자 정보 (읽기전용) */}
      <Box mb={4}>
        <InputLabel required>대표자</InputLabel> {/* *[251013] 입력 라벨 */}
        <TextField
          value={authState.memberName || ""}
          InputProps={{ readOnly: true }}
          fullWidth
          sx={{ bgcolor: "#F5F5F5" }} // *[251013] 읽기전용 필드 배경색
        />
      </Box>

      {/* [24] 총 인원 입력 */}
      <Box mb={4}>
        <InputLabel required>총 인원</InputLabel>
        <TextField
          type="number"
          value={personCount}
          inputProps={{ min: 1 }}
          onChange={(e) => setPersonCount(Number(e.target.value))}
          fullWidth
        />
      </Box>

      {/* [25] 휴대폰 번호 입력 */}
      <Box mb={4}>
        <InputLabel required>휴대폰 번호</InputLabel>
        <TextField
          type="text"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          fullWidth
        />
      </Box>

      {/* [26] 신청일 선택 */}
      <Box mb={4}>
        <InputLabel required>신청일</InputLabel>
        <TextField
          type="date"
          value={wantDate}
          onChange={(e) => setWantDate(e.target.value)}
          fullWidth
        />
      </Box>

      {/* [27] 시간 선택 */}
      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <Box sx={{ flex: 1 }}>
          <InputLabel required>시작시간</InputLabel>
          <Select value={startHour} onChange={(e) => setStartHour(e.target.value)} fullWidth>
            {Array.from({ length: 13 }, (_, i) => 9 + i).map((h) => (
              <MenuItem key={h} value={String(h)}>
                {h}:00
              </MenuItem>
            ))}
          </Select>
        </Box>
        <Box sx={{ flex: 1 }}>
          <InputLabel required>종료시간</InputLabel>
          <Select value={endHour} onChange={(e) => setEndHour(e.target.value)} fullWidth>
            {Array.from({ length: 13 }, (_, i) => 9 + i).map((h) => (
              <MenuItem key={h} value={String(h)}>
                {h}:00
              </MenuItem>
            ))}
          </Select>
        </Box>
      </Box>

      {/* [28] 이용시간 및 비용 요약 */}
      <Typography fontWeight="semibold" mb={4}>
        이용시간 {Number(endHour) - Number(startHour)}시간 × {facility.facilityMoney.toLocaleString()}원 = 총 {totalMoney.toLocaleString()} 원
      </Typography>

      {/* [29] 결제하기 버튼 */}
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        fullWidth
        sx={{
          py: 1.5,
          fontWeight: "bold",
          backgroundColor: "#5ae048",       // *[251021] 초록색 배경 버튼 스타일 적용
          "&:hover": {
            backgroundColor: "#48b43d",
          },
        }}
      >
        결제하기
      </Button>
    </Box>
  );
}
