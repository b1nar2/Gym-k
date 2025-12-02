import React, { useState, useEffect } from "react"; // [1] React 훅과 라우터 기능 불러오기
import { useParams, useNavigate } from "react-router-dom";  // [1-2] 라우터 훅

import { fetchFacilityById } from "../../../api/facilityApi"; // [2-1] 시설 단건 조회 API
import { createReservation, fetchOccupiedTimes, type OccupiedTime } from "../../../api/reservationApi"; // [2-2] 예약 등록 및 [수정] 완료 시간 조회 API와 타입 추가

import { useAuth } from "../../../auth/useAuth"; // [3-1] 로그인 정보 컨텍스트

// [251013] MUI 디자인 컴포넌트 import
import Box from '@mui/material/Box';  // 컨테이너 박스
import Typography from '@mui/material/Typography';  // 텍스트
import TextField from '@mui/material/TextField';  // 입력 필드
import Button from '@mui/material/Button';  // 버튼
import Select from '@mui/material/Select';  // 드롭다운 셀렉트박스
import MenuItem from '@mui/material/MenuItem';  // 셀렉트 옵션
import InputLabel from '@mui/material/InputLabel';  // 입력 라벨
import FormControl from '@mui/material/FormControl';  // 폼 컨트롤 그룹

// [4] 시설 데이터 타입 정의
interface Facility {
  facilityId: number;
  facilityName: string;
  facilityContent: string;
  facilityMoney: number;
  facilityOpenTime: string;
  facilityCloseTime: string;
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

  // [251027 신규] 예약 완료 시간대 상태
  const [occupiedTimes, setOccupiedTimes] = useState<OccupiedTime[]>([]);

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
      // ⬇️ [수정] Number() 변환을 명시적으로 하여 정확한 시간 차이(2시간)를 계산
      const start = Number(startHour);
      const end = Number(endHour);
      const hours = end - start;
      // ⬆️ [수정 완료]
      setTotalMoney(hours > 0 ? hours * facility.facilityMoney : 0);
    }
  }, [facility, startHour, endHour]);

  // [251027 신규] 선택된 날짜에 따라 예약 완료 시간대 목록을 불러오기
  useEffect(() => {
    if (facility && wantDate) {
      fetchOccupiedTimes(facility.facilityId, wantDate)
        .then(setOccupiedTimes)
        .catch(console.error);
    } else {
      setOccupiedTimes([]); // 날짜 미선택 시 초기화
    }
  }, [facility, wantDate]); // 시설ID 또는 날짜가 변경되면 재호출

  // [251027 신규] 특정 시간이 이미 예약되었는지 확인하는 헬퍼 함수
  const isTimeOccupied = (hour: number): boolean => {
    // 09시 -> "yyyy-MM-dd 09:00:00" 형태의 Date 객체 생성
    const timeStr = `${wantDate} ${String(hour).padStart(2, '0')}:00:00`;
    const checkDateTime = new Date(timeStr);

    for (const occupied of occupiedTimes) {
      const start = new Date(occupied.resvStartTime);
      const end = new Date(occupied.resvEndTime);

      // 체크 시간이 [예약시작시간, 예약종료시간) 범위 안에 있는지 확인
      // 16:00 시작 예약은 16:00 시점을 포함하여 차단합니다.
      if (checkDateTime >= start && checkDateTime < end) {
        return true; // 이미 예약됨
      }
    }
    return false; // 예약되지 않음
  };

  // ⬇️ [수정] 시작 시간 옵션과 종료 시간 옵션을 분리합니다. ⬇️
  // [251027 신규] 시작 시간 드롭다운 옵션 렌더링 함수 (차단 로직 적용)
  const renderStartTimeOptions = () => {
    // 운영시간 09시부터 21시까지 (총 13개)
    return Array.from({ length: 13 }, (_, i) => 9 + i).map((h) => (
      <MenuItem
        key={h}
        value={String(h).padStart(2, '0')} // '9'를 '09'로 변환
        disabled={isTimeOccupied(h)} // 예약된 시간 비활성화
      >
        {String(h).padStart(2, '0')}:00 {isTimeOccupied(h) ? "(예약 완료)" : ""}
      </MenuItem>
    ));
  };

  // [251027 신규] 종료 시간 드롭다운 옵션 렌더링 함수 (차단 로직 없음)
  const renderEndTimeOptions = () => {
    // 운영시간 09시부터 21시까지 (총 13개)
    return Array.from({ length: 13 }, (_, i) => 9 + i).map((h) => (
      <MenuItem
        key={h}
        value={String(h).padStart(2, '0')} // '9'를 '09'로 변환
      // 종료 시간은 예약 종료 시점을 의미하므로 차단 로직을 적용하지 않습니다.
      >
        {String(h).padStart(2, '0')}:00
      </MenuItem>
    ));
  };
  // ⬆️ [수정 완료]

  // 예약 신청 처리 함수
  const handleSubmit = async () => {
    if (!facility) return;

    // [251027 신규] 유효성 검사 추가: 예약된 시간 선택 여부
    const sh = Number(startHour);
    const eh = Number(endHour);

    // 선택된 시간 블록 내에 이미 예약된 시간이 있는지 확인
    for (let h = sh; h < eh; h++) {
      if (isTimeOccupied(h)) {
        // ⬇️ [수정] 사용자 요청 메시지로 변경
        alert("해당 시간대에는 예약신청이 불가능합니다.");
        return; // 예약된 시간이 포함되면 신청 중단
      }
    }
    // [251027 수정] startHour/endHour가 '9'일 경우 '09'로 포맷을 통일
    const request = {
      facilityId: facility.facilityId,
      resvContent: "",
      wantDate: wantDate,
      resvPersonCount: personCount,
      startHour: startHour.padStart(2, '0'),
      endHour: endHour.padStart(2, '0'),
    };

    try {
      const resvId = await createReservation(request);
      navigate(`/facilities/${id}/reserve/payment?resvId=${resvId}&money=${totalMoney}`);
    } catch (err) {
      console.error("예약 실패", err);
      // 백엔드 에러 메시지 처리는 API 파일에서 진행되었다고 가정합니다.
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

      {/* [251027 신규] 예약 현황 시각화 (텍스트 목록) */}
      {wantDate && occupiedTimes.length > 0 && (
        <Box mb={4} p={2} border={1} borderColor="warning.main" borderRadius={1} bgcolor="#fff3e0">
          <Typography variant="subtitle1" fontWeight="bold" color="warning.dark" mb={1}>
            ⚠️ {wantDate} 예약 현황 (예약 불가 시간)
          </Typography>
          {occupiedTimes.map((item, index) => (
            <Typography key={index} variant="body2" sx={{ ml: 1 }}>
              - {item.resvStartTime.substring(11, 16)} ~ {item.resvEndTime.substring(11, 16)} 예약 완료
            </Typography>
          ))}
        </Box>
      )}
      {wantDate && occupiedTimes.length === 0 && (
        <Box mb={4} p={2} border={1} borderColor="success.main" borderRadius={1} bgcolor="#e8f5e9">
          <Typography variant="subtitle1" color="success.dark">
            ✅ {wantDate} 해당 시설은 예약 가능한 시간대가 남아 있습니다.
          </Typography>
        </Box>
      )}

      {/* [27] 시간 선택 */}
      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <Box sx={{ flex: 1 }}>
          <InputLabel required>시작시간</InputLabel>
          {/* ⬇️ [수정] renderTimeOptions 대신 renderStartTimeOptions 사용 */}
          <Select
            value={startHour}
            onChange={(e) => setStartHour(e.target.value)}
            fullWidth
            disabled={!wantDate}
          >
            {renderStartTimeOptions()}
          </Select>
        </Box>
        <Box sx={{ flex: 1 }}>
          <InputLabel required>종료시간</InputLabel>
          {/* ⬇️ [수정] renderTimeOptions 대신 renderEndTimeOptions 사용 */}
          <Select
            value={endHour}
            onChange={(e) => setEndHour(e.target.value)}
            fullWidth
            disabled={!wantDate}
          >
            {renderEndTimeOptions()}
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
          backgroundColor: "#5ae048",       // *[251021] 초록색 배경 버튼 스타일 적용
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