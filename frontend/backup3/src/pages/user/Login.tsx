// 화면ID: U_LOGIN_00
// 파일경로: src/pages/user/Login.tsx
// 설명: 리우 UI의 로그인 폼 레이아웃을 그대로 사용하되,
//       로그인 요청(axios) 및 AuthContext 연동은 기존 우리 로직을 적용한 통합본입니다.


// [1] React 및 훅 불러오기
import React, { useState } from "react";                   // React 기본
import { useNavigate } from "react-router-dom";            // 라우터 이동 훅

// 251012 추가 MUI 컴포넌트
import Box from '@mui/material/Box';                       // 251012 추가
import Paper from '@mui/material/Paper';                   // 251012 추가
import Typography from '@mui/material/Typography';         // 251012 추가
import TextField from '@mui/material/TextField';           // 251012 추가
import Button from '@mui/material/Button';                 // 251012 추가
import Divider from '@mui/material/Divider';               // 251012 추가
import Stack from '@mui/material/Stack';                   // 251012 추가
import Checkbox from '@mui/material/Checkbox';             // 251012 추가
import FormControlLabel from '@mui/material/FormControlLabel'; // 251012 추가

// [2] AuthContext 훅 (우리 프로젝트용)
import { useAuth } from "../../auth/useAuth";              // [2-1] 로그인/로그아웃 상태 접근

// [3] Axios 인스턴스 (공통)
//import api from "../../api/axios"; // [3-1] baseURL 및 인터셉터 설정된 axios
import axiosLogin from "../../api/axiosLogin"; //! [251009] 로그인 전용 axios (CORS preflight 방지용)


// [4] Login 컴포넌트 정의
export default function Login(): React.ReactElement {
  // [4-1] 입력 상태 관리
  const [memberId, setMemberId] = useState<string>("");      // 회원ID 입력값
  const [password, setPassword] = useState<string>("");      // 비밀번호 입력값
  const [remember, setRemember] = useState<boolean>(false);  // ID 기억 체크박스
  const [loading, setLoading] = useState<boolean>(false);    // 로딩 플래그

  // [4-2] AuthContext의 로그인 핸들러 가져오기
  const { loginHandler } = useAuth();                        // loginHandler: { user, token } 저장

  // [4-3] 페이지 이동 훅
  const navigate = useNavigate();

  // [4-4] 폼 제출(로그인) 처리 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !password) {
      alert("아이디와 비밀번호를 입력해주세요.");
      return;
    }
    try {
      setLoading(true);
      // [5] 백엔드 로그인 API 호출
      // - SignController.signIn(@RequestParam userId, @RequestParam password) 와 연동
      /*
        ! [old]
        const res = await api.post("/sign-api/sign-in", null, {
          params: { userId: memberId, password: password }, // 백엔드는 RequestParam으로 받음
        });
      */
      //! [251009] axios에 맞게끔 변경
      const res = await axiosLogin.post("/sign-api/sign-in", null, {
        params: { userId: memberId, password: password }, // 백엔드는 RequestParam으로 받음
      });

      const data = res.data;
      console.log("login response:", data);

      // [6] 정상 응답 처리: token + user 둘 다 있어야 성공으로 간주
      if (data && data.token && data.user) {
        //^----[251002] 추가사항 ProtectedRoute.authContext의 Context미전달 버그 패치 ----
        localStorage.setItem("memberId", memberId);
        localStorage.setItem("memberRole", data.user.memberRole);
        //^----------------------------------------------------------------------------
        // [6-1] 로컬 저장소에 ID 기억 여부 반영 (remember)
        if (remember) {
          localStorage.setItem("rememberId", memberId);
        } else {
          localStorage.removeItem("rememberId");
        }
        // [6-2] AuthContext에 유저+토큰 저장 (loginHandler가 localStorage token 저장도 담당)
        loginHandler({ user: data.user, token: data.token });
        // [6-3] 로그인 성공 시 마이페이지 이동
        navigate("/mypage");
        // [6-4] 입력 초기화(보안상 비밀번호는 클리어)
        setMemberId(""); setPassword("");
      } else {
        // [6-5] 실패 처리: 서버가 실패 메시지를 보낼 경우 표시
        const errMsg = data?.message ?? data?.msg ?? "로그인에 실패했습니다.";
        alert(errMsg);
      }
    } catch (err: any) {
      console.error("login error:", err);
      const msg = err?.response?.data?.message || err?.message || "서버 요청 중 오류가 발생했습니다.";
      alert(msg);
    } finally {
      setLoading(false); // 로딩 종료
    }
  };

  // [7] 컴포넌트 렌더링 (리우 UI 카드 스타일을 반영한 마크업)
  // 251012 추가 아래 렌더링 부분을 모두 MUI 스타일로 리팩터링
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.50", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* 251012 추가 로그인 카드 스타일 적용 */}
      <Paper elevation={3} sx={{ maxWidth: 400, width: "100%", p: 4, mx: "auto", borderRadius: 4 }}>
        <form onSubmit={handleSubmit}>
          {/* 카드 타이틀 */}
          <Typography variant="h4" fontWeight={700} color="primary.main" textAlign="center" mb={1}>
            Login
          </Typography>
          {/* 251012 추가 구분선 */}
          <Divider sx={{ my: 2 }} />
          {/* 입력영역 */}
          <Stack spacing={2} mb={2}>
            <TextField
              label="ID"
              variant="outlined"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              placeholder="아이디를 입력하세요"
              autoComplete="username"
              fullWidth
              required
            />
            <TextField
              label="PW"
              variant="outlined"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
              fullWidth
              required
            />
          </Stack>
          {/* 251012 추가 ID 기억하기 체크박스 */}
          <FormControlLabel
            control={<Checkbox color="primary" checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
            label="ID 기억하기"
            sx={{ mb: 2 }}
          />
          {/* 251012 추가 구분선 */}
          <Divider sx={{ my: 2 }} />
          {/* 액션 버튼들 (리우 UI: 굵은 rounded 버튼 두 개) */}
          <Stack direction="row" spacing={2}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ borderRadius: 3, fontWeight: 600 }}
            >
              {loading ? "로그인 중..." : "Login"}
            </Button>
            <Button
              type="button"
              variant="outlined"
              color="primary"
              fullWidth
              size="large"
              onClick={() => navigate("/join")}
              disabled={loading}
              sx={{ borderRadius: 3, fontWeight: 600 }}
            >
              회원가입
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
