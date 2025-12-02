// [1] React Context 관련 함수 불러오기
import React, { createContext, useReducer, useEffect } from "react"; // [1-1] createContext: 전역 상태 공유용, useReducer: 상태 변경 로직 정의
import type { ReactNode } from "react"; // [1-2] ReactNode: children 타입을 안전하게 지정하기 위해 필요
import api from "../api/axiosCms"; //! [251002] 추가사항(새로고침 에러 방지): 토큰으로 사용자 정보 조회 위해 axios 인스턴스 불러오기

// [2] User 타입 정의 (member_tbl 전체 구조 반영)
// ⚠️ 서버에서 내려주는 회원정보 + JWT 토큰을 저장하는 타입
interface User {
  memberId: string | null;        // [2-1] 회원ID (PK)
  memberPw?: string | null;       // [2-2] 비밀번호(백엔드 검증용)
  memberName: string | null;      // [2-3] 이름
  memberGender?: string | null;   // [2-4] 성별 (m/f)
  memberEmail: string | null;     // [2-5] 이메일
  memberMobile?: string | null;   // [2-6] 휴대폰 번호
  memberPhone?: string | null;    // [2-7] 일반 전화번호
  zip?: string | null;            // [2-8] 우편번호
  roadAddress?: string | null;    // [2-9] 도로명 주소
  jibunAddress?: string | null;   // [2-10] 지번 주소
  detailAddress?: string | null;  // [2-11] 상세 주소
  memberBirthday?: string | null; // [2-12] 생년월일
  memberManipay?: string | null;  // [2-13] 주요 결제수단
  memberJoindate?: string | null; // [2-14] 가입일
  memberRole: string | null;      // [2-15] 권한 (user/admin)
  adminType?: string | null;      // [2-16] 관리자 유형(책임자/관리자/강사)
  token: string | null;           // [2-17] JWT 토큰 (로그인 인증용)
}

// [3] Context에서 제공할 값 타입 정의
interface AuthContextType {
  authState: User; // [3-1] 현재 로그인된 사용자 상태
  loginHandler: (data: { user: User; token: string }) => void; // [3-2] 로그인 처리 함수 (user+token을 받아 Context에 저장)
  logoutHandler: () => void; // [3-3] 로그아웃 처리 함수 (토큰 제거 및 상태 초기화)
}

// [4] Context 생성 (초기값 null → Provider에서 값 주입 필요)
// ⚠️ Context만 만들면 아직 쓸 수 없고, AuthProvider로 감싸야 작동함
const AuthContext = createContext<AuthContextType | null>(null);

// [5] 초기 상태 정의
// ⚠️ localStorage에서 토큰을 복원 → 새로고침 시에도 로그인 유지
const initialUser: User = {
  memberId: null,   // [5-1] 기본값 null
  memberName: null, // [5-2] 기본값 null
  memberEmail: null,// [5-3] 기본값 null
  memberRole: null, // [5-4] 기본값 null
  token: localStorage.getItem("token"), // [5-5] 저장된 토큰 불러오기
};

// [6] Reducer 정의 (login/logout 액션에 따라 상태 전환)
function authReducer(state: User, action: any): User {
  switch (action.type) {
    case "login": // [6-1] 로그인 시: payload.user + payload.token 저장
      return { ...action.payload.user, token: action.payload.token };
    case "logout": // [6-2] 로그아웃 시: 상태 초기화
      return initialUser;
    default: // [6-3] 정의되지 않은 액션: 변경 없음
      return state;
  }
}

// [7] AuthProvider 컴포넌트 정의 (전역 상태 공급자)
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, dispatch] = useReducer(authReducer, initialUser); // [7-1] Reducer 사용

  // [7-2] 로그인 처리 함수
  const loginHandler = (data: { user: User; token: string }) => {
    localStorage.setItem("token", data.token); // [7-2-1] 토큰을 localStorage에 저장
    dispatch({ type: "login", payload: data }); // [7-2-2] Context 상태 갱신
  };

  // [7-3] 로그아웃 처리 함수
  const logoutHandler = () => {
    localStorage.removeItem("token"); // [7-3-1] localStorage에서 토큰 제거
    dispatch({ type: "logout" });     // [7-3-2] Context 상태 초기화
  };

  //! [251002] 추가사항(새로고침 에러 방지): 
  //! - 새로고침 후 token만 남고 사용자 정보(memberName 등) 사라지는 문제 해결
  //! - token이 있으면 /api/members/me 호출해서 사용자 정보 복원
  useEffect(() => {
  const token = localStorage.getItem("token");
  if (token && !authState.memberName) {
    api.get("/api/members/me")
      .then((res) => {
        const userData: User = res.data.data; //! data 안에 있는 값만 추출 →  회원의 GET정보, /api/members/me를 가져와야 함
        //! ⚠️ res.data를 User 타입으로 단언해줌 (서버 구조 맞추기)
        dispatch({ type: "login", payload: { user: userData, token } });
      })
      .catch(() => {
        localStorage.removeItem("token");
        dispatch({ type: "logout" });
      });
  }
}, [authState.token]);

  // [7-4] Provider 반환 (children에서 authState, loginHandler, logoutHandler 사용 가능)
  return (
    <AuthContext.Provider value={{ authState, loginHandler, logoutHandler }}>
      {children}
    </AuthContext.Provider>
  );
};

// [8] Context export
export default AuthContext;
