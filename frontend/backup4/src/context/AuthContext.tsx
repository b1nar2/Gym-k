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
  token: localStorage.getItem("token"), // [5-5] 저장된 토큰 불러오기 → 토큰 초기값을 그대로 가져옴...이거 잠재적인 문제가 있음
  // token: null
};

// [6] Reducer 정의 (login/logout 액션에 따라 상태 전환)
function authReducer(state: User, action: any): User {
  switch (action.type) {
    case "login": // [6-1] 로그인 시: payload.user + payload.token 저장
      console.log("로그인 모드")
      return { ...action.payload.user, token: action.payload.token };
    case "logout": // [6-2] 로그아웃 시: 상태 초기화
      console.log("로그아웃 모드")
      return initialUser;
    default: // [6-3] 정의되지 않은 액션: 변경 없음
      console.log("기본 모드")
      return state;
  }
}

// [7] AuthProvider 컴포넌트 정의 (전역 상태 공급자)
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, dispatch] = useReducer(authReducer, initialUser); // [7-1] Reducer 사용

  // [7-2] 로그인 처리 함수
  const loginHandler = (data: { user: User; token: string }) => {
    localStorage.setItem("token", data.token); // [7-2-1] 토큰을 localStorage에 저장
    localStorage.setItem("memberName", data.user.memberName == null ? "" : data.user.memberName); //* [251020] 토큰을 localStorage에 저장
    localStorage.setItem("memberId", data.user.memberId == null ? "" : data.user.memberId); //* [251020] ID를 localStorage에 저장

    dispatch({ type: "login", payload: data }); // [7-2-2] Context 상태 갱신
  };

  // [7-3] 로그아웃 처리 함수
  const logoutHandler = () => {
    localStorage.removeItem("token"); // [7-3-1] localStorage에서 토큰 제거
    dispatch({ type: "logout" });     // [7-3-2] Context 상태 초기화
  };

  /* //^ [251021] 해당 방식으로는 React가 값이 바뀐 걸 인식 못함 원인 : authState.memberName가 직접 수정을 해서...새로고침하면 얘는 갱신을 못하는 구조 
  //! [251002] 추가사항(새로고침 에러 방지): 
  //! - 새로고침 후 token만 남고 사용자 정보(memberName 등) 사라지는 문제 해결
  //! - token이 있으면 /api/members/me 호출해서 사용자 정보 복원
  useEffect(() => {
  const token = localStorage.getItem("token");
  //! [251020] 회원명이 null이면서 localStorage에 로그인값이 있을 경우, 
  // if (authState.memberName == null && localStorage.getItem("token") != null) {
  if (authState.memberName == null) {
    console.log("회원명 null값인 상태")
    authState.memberName = localStorage.getItem("memberName")
    authState.memberId = localStorage.getItem("memberId") // * [251020-2] 회원ID 추가
  }
  console.log("회원명: ", authState.memberName);

  if (token && !authState.memberName) {
    console.log("token && !authState.memberName");
  //if (token && authState.memberName != "") {  // [251020] memberName이 초기값 null이 아니라, ""(공백)으로 치환되게끔 해놨음...null로 전달하면 안됨
    //api.get("/api/members/me") //* [251020] 이렇게 하면 api가 2중으로 잡혀서 에러 발생하고, 이중으로 토큰이 전달됨
    api.get("/members/me")
      .then((res) => {
        const userData: User = res.data.data; //! data 안에 있는 값만 추출 →  회원의 GET정보, /api/members/me를 가져와야 함
        //! ⚠️ res.data를 User 타입으로 단언해줌 (서버 구조 맞추기)
        dispatch({ type: "login", payload: { user: userData, token } });
      })
      .catch(() => {
        //localStorage.removeItem("token"); //* 이게 활성화면 새로고침할 때마다 토큰이 날아감, catch에서는 절대 하면 안됨
        //dispatch({ type: "logout" });
      });
  }
}, [authState.token]);
*/
  //^ [251021] 새로고침을 하면 로컬 스토리지에 남아있는걸 Header에 갱신함 
  useEffect(() => {
    // localStorage에 저장된 로그인 관련 정보들을 불러옴 
    // As-is → 사용자가 새로고침할 경우, 메모리 초기화 됨 (단, 로컬 스토리지에는 로그인했던 회원의 값은 남아있음)
    // To-be → 메모리 초기화 되어도 로컬 스토리지에 남아있는걸 가져와서 갱신함 
    const token = localStorage.getItem("token");  // 토큰값
    const storedName = localStorage.getItem("memberName"); // 회원명
    const storedId = localStorage.getItem("memberId"); // 회원ID

    // A조건과 B조건 중 하나 발동
    // [A조건] 토큰과 이름이 둘 다 있으면 바로 상태 갱신
    if (token && storedName && !authState.memberName) {  // 토큰과 이름이 둘 다 있을 경우 
      dispatch({
        type: "login", // 로그인 상태
        payload: {
          user: {
            ...authState, // authState의 상태값
            memberName: storedName, // 회원명
            memberId: storedId, // 회원ID
            memberRole: localStorage.getItem("memberRole"), // 권한도 복원하기
          },
          token, //토큰 전달함
        },
      });
      return; // A조건 완료되면 return
    }

    // [B조건] 토큰은 있는데 이름이 없으면 서버 호출
    if (token && !storedName) { // 토큰은 있고, 이름이 없을 경우 (!를 붙이면 없다는 뜻)
      api.get("/members/me")  // 백엔드에서 회원정보 GET(불러옴)
        .then((res) => {
          const userData: User = res.data.data; // 백엔드의 res.data.data(회원정보) 불러옴
          dispatch({ type: "login", payload: { user: userData, token } }); // 서버에서 받은 정보 → Cotext에 저장하고, 로그인 상태가 됨
        })
        .catch((err) => console.error("회원 복원 실패:", err)); // 백엔드에서 회원 정보 못불러오면 에러 발생
    }
  }, []); // [] : 무한루프 방지함 

  // [7-4] Provider 반환 (children에서 authState, loginHandler, logoutHandler 사용 가능)
  return (
    <AuthContext.Provider value={{ authState, loginHandler, logoutHandler }}>
      {children}
    </AuthContext.Provider>
  );
};

// [8] Context export
export default AuthContext;
