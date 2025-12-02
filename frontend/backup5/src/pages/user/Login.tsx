// 화면ID: U_LOGIN_00
// 파일경로: src/pages/user/Login.tsx
// 설명: 리우 UI의 로그인 폼 레이아웃을 그대로 사용하되,
//       로그인 요청(axios) 및 AuthContext 연동은 기존 우리 로직을 적용한 통합본입니다.


// [1] React 및 훅 불러오기
import React, { useState } from "react";                            // React 기본
import { useNavigate } from "react-router-dom";                     // 라우터 이동 훅


// [2] AuthContext 훅 (우리 프로젝트용)
import { useAuth } from "../../auth/useAuth";                       // [2-1] 로그인/로그아웃 상태 접근


// [3] Axios 인스턴스 (공통)
//import api from "../../api/axios";                                // [3-1] baseURL 및 인터셉터 설정된 axios
import axiosLogin from "../../api/axiosLogin";                      //! [251009] 로그인 전용 axios (CORS preflight 방지용)


// *[251021] MUI 테마 적용 관련 import 추가
import { ThemeProvider, CssBaseline, Container, Paper, TextField, Button, Typography, Divider, Stack, FormControlLabel, Checkbox, Box } from "@mui/material"; // *[251021] MUI 컴포넌트
import theme from "../../css/user/theme"; // *[251021] 커스텀 테마 import


// [4] Login 컴포넌트 정의
export default function Login(): React.ReactElement {
  // [4-1] 입력 상태 관리
  const [memberId, setMemberId] = useState<string>("");             // 회원ID 입력값
  const [password, setPassword] = useState<string>("");             // 비밀번호 입력값
  const [remember, setRemember] = useState<boolean>(false);         // ID 기억 체크박스
  const [loading, setLoading] = useState<boolean>(false);           // 로딩 플래그

  // [4-2] AuthContext의 로그인 핸들러 가져오기
  const { loginHandler } = useAuth();                               // loginHandler: { user, token } 저장

  // [4-3] 페이지 이동 훅
  const navigate = useNavigate();

  // [4-4] 폼 제출(로그인) 처리 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();                                             // 폼 기본 동작 방지
    if (!memberId || !password) {
      alert("아이디와 비밀번호를 입력해주세요.");                  // 간단 유효성 체크
      return;
    }

    try {
      setLoading(true);                                             // 로딩 시작
      const res = await axiosLogin.post("/sign-api/sign-in", null, {
        params: { userId: memberId, password: password },           // 백엔드는 RequestParam으로 받음
      });

      const data = res.data;
      console.log("login response:", data);

      if (data && data.token && data.user) {
        localStorage.setItem("memberId", memberId);
        localStorage.setItem("memberRole", data.user.memberRole);
        localStorage.setItem("token", data.token); // ✅ 추가
        if (remember) {
          localStorage.setItem("rememberId", memberId);             // ID 기억(간단 구현)
        } else {
          localStorage.removeItem("rememberId");
        }
        loginHandler({ user: data.user, token: data.token });
        navigate("/mypage");
        setMemberId("");
        setPassword("");
      } else {
        const errMsg = data?.message ?? data?.msg ?? "로그인에 실패했습니다.";
        alert(errMsg);
      }
    } catch (err: any) {
      console.error("login error:", err);
      const msg = err?.response?.data?.message || err?.message || "서버 요청 중 오류가 발생했습니다.";
      alert(msg);
    } finally {
      setLoading(false);                                            // 로딩 종료
    }
  };

  // [7] 컴포넌트 렌더링 (리우 UI 카드 스타일을 반영한 마크업)
  return (
    // *[251021] ThemeProvider로 전체 감싸 MUI theme 적용
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* *[251021] 브라우저 기본 스타일 리셋 */}
      <Box sx={{ minHeight: "100vh", bgcolor: "grey.50", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Paper elevation={3} sx={{ maxWidth: 400, width: "100%", p: 4, mx: "auto", borderRadius: 2 }}>
          <form onSubmit={handleSubmit}>
            <Typography variant="h4" fontWeight={700} color="primary.main" textAlign="center" mb={1}>
              Login
            </Typography>
            <Divider sx={{ my: 2 }} />
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

            <FormControlLabel
              control={<Checkbox color="primary" checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
              label="ID 기억하기"
              sx={{ mb: 2 }}
            />

            <Divider sx={{ my: 2 }} />

            <Stack direction="row" spacing={2}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ borderRadius: theme.shape.borderRadius, fontWeight: 600 }}
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
                sx={{ borderRadius: theme.shape.borderRadius, fontWeight: 600 }}
              >
                회원가입
              </Button>
            </Stack>
          </form>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}

/* ---------------------------------------------------------------
   ⚠️ 아래는 "old 코드" 백업(주석 처리) — 요청대로 기존/옛 코드를 온전하게 보존합니다.
   - 파일 내에 남겨두었으므로 필요 시 쉽게 되돌려 확인 가능
   - 한 줄 한 줄 주석처리되어 있고, '⚠️ old' 표시로 가독성 확보
   --------------------------------------------------------------- */

/*

// ⚠️ old: 기존 간단형 Login.tsx (기능은 유사하나 UI가 리우 것과 다름)
// [원본 경로: src/pages/Login.tsx (구버전)]
// 이 블록은 주석으로 비활성화 되어 있음 — 필요 시 복사/붙여넣기 해서 사용 가능

// [1] React 및 훅 불러오기
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// [2] AuthContext 훅
import { useAuth } from "../auth/useAuth";

// [3] Axios 인스턴스
import api from "../api/axios";

export default function OldLogin() {
  const URL = "/sign-api/sign-in";
  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");
  const { loginHandler } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post(URL, null, {
        params: { userId: memberId, password: password },
      });
      const data = res.data;
      console.log("data:", data);

      if (data && data.token && data.user) {
        loginHandler({ user: data.user, token: data.token });
        navigate("/mypage");
        setMemberId("");
        setPassword("");
      } else {
        alert("로그인 실패: 서버 응답 없음");
      }
    } catch (err: any) {
      console.error("login error:", err);
      const msg = err?.response?.data?.message || "서버 오류";
      alert(msg);
    }
  };

  return (
    <main className="wrapper">
      <form className="container" onSubmit={handleSubmit}>
        <h1 className="title login">로그인</h1>
        <input
          type="text"
          placeholder="아이디"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="btn login">로그인</button>
      </form>
    </main>
  );
}

*/

