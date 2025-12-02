import React, { useState, useEffect } from "react"; // React 핵심 훅(useState, useEffect) 불러오기
import { useAuth } from "../../../auth/useAuth"; // [1-1] 로그인 상태(Context) 훅 불러오기
import api from "../../../api/axios"; // [1-2] axios 인스턴스 불러오기
import { Box, Button, TextField, Typography } from "@mui/material"; // [251021] MUI 컴포넌트 임포트
import { useTheme } from "@mui/material/styles"; // [251021] MUI 테마 사용

// [2] 회원정보 타입 정의
interface Member {
  memberId: string;
  memberPw?: string;
  newPassword?: string;
  confirmPassword?: string;
  memberEmail: string;
  memberPhone: string;
  memberMobile: string;
  zip: string;
  roadAddress: string;
  detailAddress: string;
}

// [3] 컴포넌트 정의
export default function UserInfoEdit() {
  const theme = useTheme(); // [251021] MUI 테마 사용
  const { authState } = useAuth(); // [3-1] 로그인 회원 정보
  const [member, setMember] = useState<Member | null>(null); // [3-2] 회원정보 상태
  const [loading, setLoading] = useState(true); // 로딩 상태

  // [4] 회원정보 조회 (최초 렌더링 시)
  useEffect(() => {
    api
      .get("/api/members/me")
      .then((res) => {
        setMember(res.data.data); // 회원정보 상태에 저장
        setLoading(false); // 로딩 완료
      })
      .catch((err) => {
        console.error("회원정보 불러오기 실패:", err);
        setLoading(false); // 로딩 완료
      });
  }, []);

  // [5] 입력값 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMember((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  // [6] 저장 버튼 클릭 시
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    // ⚠️ 비밀번호 변경 시 검증
    if (member.newPassword && member.newPassword !== member.confirmPassword) {
      alert("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append("currentPw", member.memberPw || ""); // [백엔드 currentPw]
      params.append("newPw", member.newPassword || ""); // [백엔드 newPw]
      params.append("memberEmail", member.memberEmail || "");
      params.append("memberPhone", member.memberPhone || "");
      params.append("memberMobile", member.memberMobile || "");
      params.append("roadAddress", member.roadAddress || "");
      params.append("detailAddress", member.detailAddress || "");
      params.append("zip", member.zip || ""); // [추가] 우편번호

      await api.put("/api/members/me", params, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      alert("회원정보가 수정되었습니다.");
    } catch (err) {
      console.error("회원정보 수정 실패:", err);
      alert("회원정보 수정 중 오류가 발생했습니다.");
    }
  };

  if (loading) return <p>로딩 중...</p>;
  if (!member) return <p>회원정보를 불러올 수 없습니다.</p>;

  // [7] JSX UI
  return (
    <Box component="main" sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        회원정보 수정
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* 아이디 */}
        <TextField
          label="회원 ID"
          name="memberId"
          value={member.memberId}
          InputProps={{ readOnly: true }}
          variant="outlined"
          fullWidth
        />

        {/* 기존 비밀번호 */}
        <TextField
          label="기존비밀번호 *"
          type="password"
          name="memberPw"
          value={member.memberPw || ""}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          required
        />

        {/* 신규 비밀번호 */}
        <TextField
          label="신규비밀번호 *"
          type="password"
          name="newPassword"
          value={member.newPassword || ""}
          onChange={handleChange}
          variant="outlined"
          fullWidth
        />

        {/* 비밀번호 확인 */}
        <TextField
          label="비밀번호 확인 *"
          type="password"
          name="confirmPassword"
          value={member.confirmPassword || ""}
          onChange={handleChange}
          variant="outlined"
          fullWidth
        />

        {/* 이메일 */}
        <TextField
          label="이메일"
          type="email"
          name="memberEmail"
          value={member.memberEmail}
          onChange={handleChange}
          variant="outlined"
          fullWidth
        />

        {/* 전화번호 */}
        <TextField
          label="전화번호"
          type="text"
          name="memberPhone"
          value={member.memberPhone}
          onChange={handleChange}
          variant="outlined"
          fullWidth
        />

        {/* 휴대폰 */}
        <TextField
          label="휴대폰 *"
          type="text"
          name="memberMobile"
          value={member.memberMobile}
          onChange={handleChange}
          variant="outlined"
          fullWidth
          required
        />

        {/* 주소: 우편번호 + 도로명주소 */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            name="zip"
            label="우편번호"
            value={member.zip}
            onChange={handleChange}
            variant="outlined"
            sx={{ flex: 1 }}
          />
          <TextField
            name="roadAddress"
            label="도로명주소"
            value={member.roadAddress}
            onChange={handleChange}
            variant="outlined"
            sx={{ flex: 3 }}
          />
        </Box>

        {/* 상세주소 */}
        <TextField
          name="detailAddress"
          label="상세주소"
          value={member.detailAddress}
          onChange={handleChange}
          variant="outlined"
          fullWidth
        />

        {/* 저장 버튼 */}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          sx={{ mt: 3, py: 1.5, borderRadius: theme.shape.borderRadius }}
        >
          완료
        </Button>
      </Box>
    </Box>
  );
}
