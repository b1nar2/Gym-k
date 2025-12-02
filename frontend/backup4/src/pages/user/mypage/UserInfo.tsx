import React, { useState } from "react"; // [251005] useState 추가
import { useAuth } from "../../../auth/useAuth";
import api from "../../../api/axios";

// *[251016] MUI 컴포넌트 import
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

export default function UserInfo() {
  const { authState } = useAuth(); // [3-1]

  // [251005] 초기값 Context 기반 세팅
  const [email, setEmail] = useState(authState.memberEmail || "");
  const [mobile, setMobile] = useState(authState.memberMobile || "");
  const [phone, setPhone] = useState(authState.memberPhone || "");
  const [roadAddress, setRoadAddress] = useState(authState.roadAddress || "");
  const [detailAddress, setDetailAddress] = useState(authState.detailAddress || "");

  // [251005] 회원정보 수정 API
  const handleUpdate = async () => {
    try {
      const payload = {
        memberEmail: email,
        memberMobile: mobile,
        memberPhone: phone,
        roadAddress,
        detailAddress
      };
      await api.put("/api/members/me", payload);
      alert("회원정보가 수정되었습니다.");
      console.log("회원정보 수정 완료:", payload);
    } catch (err) {
      console.error("회원정보 수정 실패:", err);
      alert("회원정보 수정 중 오류가 발생했습니다.");
    }
  };

  return (
    <Box className="wrapper" sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>회원정보</Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography>아이디 : {authState.memberId}</Typography>
        <Typography>이름 : {authState.memberName}</Typography>

        <TextField
          label="이메일"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />

        <Typography>권한 : {authState.memberRole}</Typography>

        <TextField
          label="휴대폰번호"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          fullWidth
        />

        <TextField
          label="일반전화"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          fullWidth
        />

        <TextField
          label="도로명주소"
          value={roadAddress}
          onChange={(e) => setRoadAddress(e.target.value)}
          fullWidth
        />

        <TextField
          label="상세주소"
          value={detailAddress}
          onChange={(e) => setDetailAddress(e.target.value)}
          fullWidth
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleUpdate}
          sx={{ mt: 3 }}
        >
          회원정보 수정하기
        </Button>
      </Box>
    </Box>
  );
}
