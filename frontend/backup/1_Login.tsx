// 화면ID: U_LOGIN_00
// 파일경로: src/pages/user/Login.tsx
// 설명: 리우 UI의 로그인 폼 레이아웃을 그대로 사용하되,
//       로그인 요청(axios) 및 AuthContext 연동은 기존 우리 로직을 적용한 통합본입니다.

// [1] React 및 훅 불러오기
import React, { useState } from "react";                           // React 기본
import { useNavigate } from "react-router-dom";                    // 라우터 이동 훅

// [2] AuthContext 훅 (우리 프로젝트용)
import { useAuth } from "../../auth/useAuth";                      // [2-1] 로그인/로그아웃 상태 접근

// [3] Axios 인스턴스 (공통)
import api from "../../api/axios";                                 // [3-1] baseURL 및 인터셉터 설정된 axios

// [4] Login 컴포넌트 정의
export default function Login(): React.ReactElement {
  // [4-1] 입력 상태 관리
  const [memberId, setMemberId] = useState<string>("");            // 회원ID 입력값
  const [password, setPassword] = useState<string>("");            // 비밀번호 입력값
  const [remember, setRemember] = useState<boolean>(false);        // ID 기억 체크박스
  const [loading, setLoading] = useState<boolean>(false);          // 로딩 플래그

  // [4-2] AuthContext의 로그인 핸들러 가져오기
  const { loginHandler } = useAuth();                              // loginHandler: { user, token } 저장

  // [4-3] 페이지 이동 훅
  const navigate = useNavigate();

  // [4-4] 폼 제출(로그인) 처리 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();                                            // 폼 기본 동작 방지
    if (!memberId || !password) {
      alert("아이디와 비밀번호를 입력해주세요.");                   // 간단 유효성 체크
      return;
    }

    try {
      setLoading(true);                                            // 로딩 시작
      // [5] 백엔드 로그인 API 호출
      // - SignController.signIn(@RequestParam userId, @RequestParam password) 와 연동
      const res = await api.post("/sign-api/sign-in", null, {
        params: { userId: memberId, password: password },         // 백엔드는 RequestParam으로 받음
      });

      const data = res.data;
      console.log("login response:", data);

      // [6] 정상 응답 처리: token + user 둘 다 있어야 성공으로 간주
      if (data && data.token && data.user) {
        //! 251002 : 보완 패치 ProtectedRoute.authContext의 Context미전달 버그 패치
        localStorage.setItem("token", data.token);    // 토큰 값 저장 
        localStorage.setItem("memberId", memberId);
        localStorage.setItem("memberRole", data.user.memberRole);

        // [6-1] 로컬 저장소에 ID 기억 여부 반영 (remember 로그인 옆 ID 저장 체크박스)
        console.log("remember 확인:", remember)
        if (remember) {
          localStorage.setItem("rememberId", memberId);           // ID 기억(간단 구현)

        } else {
          localStorage.removeItem("rememberId");
        }

        // [6-2] AuthContext에 유저+토큰 저장 (loginHandler가 localStorage token 저장도 담당)
        loginHandler({ user: data.user, token: data.token });
        console.log("data.user.memberRole 확인:", data.user.memberRole )
        console.log("loginHandler 확인:" , loginHandler)

        // [6-3] 로그인 성공 시 역할에 따라 이동
        if (data.user.memberRole === "admin") {
          navigate("/admin");
        } else {
          navigate("/mypage");
        }

        // [6-4] 입력 초기화(보안상 비밀번호는 클리어)
        setMemberId("");
        setPassword("");
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
      setLoading(false);                                           // 로딩 종료
    }
  };

  // [7] 컴포넌트 렌더링 (리우 UI 카드 스타일을 반영한 마크업)
  return (
    <main className="wrapper">                                      {/* 전역 레이아웃 클래스(리우 CSS 기준) */}
      <form className="container login-card" onSubmit={handleSubmit}>
        {/* 카드 타이틀 */}
        <h2 className="login-title">Login</h2>

        {/* 구분선(디자인용) */}
        <hr className="login-divider" />

        {/* 입력영역 */}
        <div className="field-row">
          <label className="field-label">ID :</label>
          <input
            className="field-input"
            type="text"
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            placeholder="아이디를 입력하세요"
            autoComplete="username"
            aria-label="아이디"
          />
        </div>

        <div className="field-row">
          <label className="field-label">PW :</label>
          <input
            className="field-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            autoComplete="current-password"
            aria-label="비밀번호"
          />
        </div>

        {/* ID 기억하기 */}
        <div className="remember-row">
          <label>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />{" "}
            ID 기억하기
          </label>
        </div>

        <hr className="login-divider" />

        {/* 액션 버튼들 (리우 UI: 굵은 rounded 버튼 두 개) */}
        <div className="action-row">
          <button
            type="submit"
            className="btn btn-primary full"
            disabled={loading}
            aria-disabled={loading}
          >
            {loading ? "로그인 중..." : "Login"}
          </button>

          <button
            type="button"
            className="btn btn-secondary full"
            onClick={() => navigate("/join")}
            disabled={loading}
          >
            회원가입
          </button>
        </div>
      </form>
    </main>
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

