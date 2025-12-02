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

// *[251021] (기능설명) useTheme, useMediaQuery 추가 import
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// [3] Join 컴포넌트 (회원가입)
export default function Join() {
  const API_URL = "/api/members"; // [3-1] 회원가입 API (UserMemberController)
  const navigate = useNavigate();

  // *[251021] (기능설명) 반응형 화면 크기 체크 훅 사용
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

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
          maxWidth: 600,
          mx: "auto",
          p: 3,
          boxShadow: 3,
          borderRadius: 2,
          mt: 10,
          bgcolor: "background.paper",
          display: "flex",
          flexDirection: "column", // *[251021] (세로 방향)
          gap: 2, // 아이템 간 간격
        }}
      >
        <h1
          className="title join"
          style={{
            fontSize: isMobile ? "1.4rem" : "1.8rem",
            color: theme.palette.text.primary,
            textAlign: "center",
            fontWeight: 700,
            marginBottom: "2rem",
            fontFamily: '"Noto Sans KR", sans-serif',
          }}
        >
          회원가입
        </h1>
        <TextField
          label="아이디"
          name="memberId"
          value={form.memberId}
          onChange={handleChange}
          required
          fullWidth
          variant="outlined"
        />
        <TextField
          label="비밀번호"
          type="password"
          name="memberPw"
          value={form.memberPw}
          onChange={handleChange}
          required
          fullWidth
          variant="outlined"
        />
        <TextField
          label="이름"
          name="memberName"
          value={form.memberName}
          onChange={handleChange}
          required
          fullWidth
          variant="outlined"
        />
        <TextField
          select
          label="성별"
          name="memberGender"
          value={form.memberGender}
          onChange={handleChange}
          fullWidth
          variant="outlined"
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
          variant="outlined"
        />
        <TextField
          label="휴대폰번호"
          name="memberMobile"
          value={form.memberMobile}
          onChange={handleChange}
          required
          fullWidth
          variant="outlined"
        />
        <TextField
          label="생년월일 (YYYY-MM-DD)"
          type="date"
          name="memberBirthday"
          value={form.memberBirthday}
          onChange={handleChange}
          required
          fullWidth
          variant="outlined"
          slotProps={{ label: { shrink: true } }}
        />
        <TextField
          label="우편번호 (선택)"
          name="zip"
          value={form.zip}
          onChange={handleChange}
          fullWidth
          variant="outlined"
        />
        <TextField
          label="전화번호 (선택)"
          name="memberPhone"
          value={form.memberPhone}
          onChange={handleChange}
          fullWidth
          variant="outlined"
        />
        <TextField
          label="도로명주소 (선택)"
          name="roadAddress"
          value={form.roadAddress}
          onChange={handleChange}
          fullWidth
          variant="outlined"
        />
        <TextField
          label="지번주소 (선택)"
          name="jibunAddress"
          value={form.jibunAddress}
          onChange={handleChange}
          fullWidth
          variant="outlined"
        />
        <TextField
          label="상세주소 (선택)"
          name="detailAddress"
          value={form.detailAddress}
          onChange={handleChange}
          fullWidth
          variant="outlined"
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{
            mt: 3,
            fontWeight: 700,
            fontSize: isMobile ? "1rem" : "1.1rem",
            borderRadius: theme.shape.borderRadius,
            boxShadow: 2,
            textTransform: "none",
          }}
          className="btn join"
        >
          가입하기
        </Button>
      </Box>
    </main>
  );
}
