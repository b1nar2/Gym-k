// [1] Context를 가져오기 위한 React 훅 불러오기
import { useContext } from "react";

// [2] AuthContext 불러오기 (context 폴더에서 export한 것)
import AuthContext from "../context/AuthContext.tsx";

// [3] useAuth 훅 정의 (Context 사용을 더 편하게)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider"); // [3-1] Provider 범위 체크
  }
  return context; // [3-2] { authState, loginHandler, logoutHandler }
};
