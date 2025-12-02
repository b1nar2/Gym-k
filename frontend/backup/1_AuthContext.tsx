import axios from "axios";
import React, { createContext, useReducer, useEffect } from "react";
import type { ReactNode } from "react";


// [2] User 타입 정의 (member_tbl 전체 구조 반영)
// ⚠️ 서버에서 내려주는 회원정보 + JWT 토큰을 저장하는 타입
interface User {
  memberId: string | null;           // [2-1] 회원ID (PK)
  memberPw?: string | null;          // [2-2] 비밀번호(백엔드 검증용)
  memberName: string | null;         // [2-3] 이름
  memberGender?: string | null;      // [2-4] 성별 (m/f)
  memberEmail: string | null;        // [2-5] 이메일
  memberMobile?: string | null;      // [2-6] 휴대폰 번호
  memberPhone?: string | null;       // [2-7] 일반 전화번호
  zip?: string | null;               // [2-8] 우편번호
  roadAddress?: string | null;       // [2-9] 도로명 주소
  jibunAddress?: string | null;      // [2-10] 지번 주소
  detailAddress?: string | null;     // [2-11] 상세 주소
  memberBirthday?: string | null;    // [2-12] 생년월일
  memberManipay?: string | null;     // [2-13] 주요 결제수단
  memberJoindate?: string | null;    // [2-14] 가입일
  memberRole: string | null;         // [2-15] 권한 (user/admin)
  adminType?: string | null;         // [2-16] 관리자 유형(책임자/관리자/강사)
  token: string | null;              // [2-17] JWT 토큰 (로그인 인증용)
}

// Context에서 제공할 값의 타입 정의
interface AuthContextType {
  authState: User;
  loginHandler: (data: { user: User; token: string }) => void;
  logoutHandler: () => void;
}

// 초기 상태 값
const initialUser: User = {
  memberId: null,
  memberName: null,
  memberEmail: null,
  memberRole: null,
  token: localStorage.getItem("token"),
};

// Context 생성. 초기값은 null (로딩 중일 때 대비)
const AuthContext = createContext<AuthContextType | null>(null);

// Reducer 함수 정의 - 로그인/로그아웃 액션 처리
function authReducer(state: User, action: any): User {
  switch (action.type) {
    case "login":
      return { ...action.payload.user, token: action.payload.token };
    case "logout":
      return initialUser;
    default:
      return state;
  }
}

// Provider 컴포넌트
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, dispatch] = useReducer(authReducer, initialUser);

  // 페이지 로드 시 토큰 기반으로 사용자 정보 복원
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // 백엔드 호출 예시
      axios.get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(response => {
          const user = response.data;
          dispatch({ type: "login", payload: { user, token } });
        })
        .catch(() => {
          // 실패 시 token 삭제 및 상태 초기화
          localStorage.removeItem("token");
          dispatch({ type: "logout" });
        });
    }
  }, []);

  // 로그인 시 토큰 저장 및 상태 변경 함수
const loginHandler = (data: { user: User; token: string }) => {
  localStorage.setItem("token", data.token);
  dispatch({ type: "login", payload: data }); // user와 token 전부 저장
};

  // 로그아웃 시 토큰 삭제 및 상태 초기화 함수
  const logoutHandler = () => {
    localStorage.removeItem("token");
    dispatch({ type: "logout" });
  };

  // Context.Provider로 authState, loginHandler, logoutHandler 공급
  return (
    <AuthContext.Provider value={{ authState, loginHandler, logoutHandler }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
