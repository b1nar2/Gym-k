// [1] React 훅 불러오기
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// [2] Axios 인스턴스
import api from "../../api/axios";

//! [251013] MUI 컴포넌트 import
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';

// [3] Join 컴포넌트 (회원가입)
export default function Join() {
  const API_URL = "/api/members"; // [3-1] 회원가입 API (UserMemberController)
  const navigate = useNavigate();

  // [3-2] 입력 상태 정의 (백엔드 요구 필드에 맞춤)
  const [form, setForm] = useState({
    memberId: "",
    memberPw: "",
    memberName: "",
    memberGender: "m", // 기본값: 남성
    memberEmail: "",
    memberMobile: "",
    memberBirthday: "",
    zip: "",
    memberPhone: "",
    roadAddress: "",
    jibunAddress: "",
    detailAddress: "",
  });

  // [3-3] 입력 핸들러
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // [3-4] 회원가입 실행
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // application/x-www-form-urlencoded 전송
      const params = new URLSearchParams();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== "") params.append(key, value);
      });

      await api.post(API_URL, params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      alert("회원가입 성공! 로그인해주세요.");
      navigate("/login");
    } catch (err: any) {
      //console.error("join error:", err);
      const msg = err?.response?.data?.message || "회원가입 실패";
      alert(msg);
    }
  };

  // [3-5] JSX
  return (
    <main className="wrapper">
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          maxWidth: 400,
          mx: "auto", // [251013] MUI 수평 중앙 정렬 (margin-left/right auto)
          p: 3,         // [251013] 내부 패딩 적용
          boxShadow: 3, // [251013] 박스 그림자 추가 (카드 느낌)
          borderRadius: 1, // [251013] 모서리 둥글게
          mt: 10,  // [251014] 위쪽 마진 추가
        }}
        className="join-card"
      >
        <h1 className="title join">회원가입</h1>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="아이디"
            name="memberId"
            value={form.memberId}
            onChange={handleChange}
            required
            fullWidth
            variant="outlined" // [251013] TextField 테두리 있는 스타일
          />
          <TextField
            label="비밀번호"
            type="password"
            name="memberPw"
            value={form.memberPw}
            onChange={handleChange}
            required
            fullWidth
            variant="outlined" // [251013] TextField 테두리 있는 스타일
          />
          <TextField
            label="이름"
            name="memberName"
            value={form.memberName}
            onChange={handleChange}
            required
            fullWidth
            variant="outlined" // [251013] TextField 테두리 있는 스타일
          />
          <TextField
            select
            label="성별"
            name="memberGender"
            value={form.memberGender}
            onChange={handleChange}
            fullWidth
            variant="outlined" // [251013] TextField 테두리 있는 스타일, 셀렉트 박스 구현
          >
            <MenuItem value="m">남성</MenuItem>
            <MenuItem value="f">여성</MenuItem>
          </TextField>
          <TextField
            label="이메일"
            type="email"
            name="memberEmail"
            value={form.memberEmail}
            onChange={handleChange}
            required
            fullWidth
            variant="outlined" // [251013] TextField 테두리 있는 스타일
          />
          <TextField
            label="휴대폰번호"
            name="memberMobile"
            value={form.memberMobile}
            onChange={handleChange}
            required
            fullWidth
            variant="outlined" // [251013] TextField 테두리 있는 스타일
          />
          <TextField
            label="생년월일 (YYYY-MM-DD)"
            type="date"
            name="memberBirthday"
            value={form.memberBirthday}
            onChange={handleChange}
            required
            fullWidth
            variant="outlined" // [251013] TextField 테두리 있는 스타일
            InputLabelProps={{ shrink: true }} // [251013] 날짜 라벨 축소 처리 (Material UI 권장)
          />
          <TextField
            label="우편번호 (선택)"
            name="zip"
            value={form.zip}
            onChange={handleChange}
            fullWidth
            variant="outlined" // [251013] TextField 테두리 있는 스타일
          />
          <TextField
            label="전화번호 (선택)"
            name="memberPhone"
            value={form.memberPhone}
            onChange={handleChange}
            fullWidth
            variant="outlined" // [251013] TextField 테두리 있는 스타일
          />
          <TextField
            label="도로명주소 (선택)"
            name="roadAddress"
            value={form.roadAddress}
            onChange={handleChange}
            fullWidth
            variant="outlined" // [251013] TextField 테두리 있는 스타일
          />
          <TextField
            label="지번주소 (선택)"
            name="jibunAddress"
            value={form.jibunAddress}
            onChange={handleChange}
            fullWidth
            variant="outlined" // [251013] TextField 테두리 있는 스타일
          />
          <TextField
            label="상세주소 (선택)"
            name="detailAddress"
            value={form.detailAddress}
            onChange={handleChange}
            fullWidth
            variant="outlined" // [251013] TextField 테두리 있는 스타일
          />
        </Box>
        <Button
          type="submit"
          variant="contained" // [251013] 강조된 색상의 채워진 버튼 스타일
          color="primary"     // [251013] 기본 primary 색상 적용 (파란색)
          fullWidth           // [251013] 버튼 가로폭 100%
          sx={{ mt: 3 }}      // [251013] 버튼 위쪽에 마진 3 단위 추가 (간격)
          className="btn join"
        >
          회원가입
        </Button>
      </Box>
    </main>
  );
}
