// [1] axios 라이브러리 불러오기
import axios from "axios";
import type { AxiosRequestConfig } from "axios"; // [1-1] 타입 전용 import

// [2] axios 인스턴스 생성 : CMS 전용 API 설정
const api = axios.create({
  baseURL: "/api", // ✅ Vite proxy 사용 중이면 /api로 통일
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
});

// [3] 요청 인터셉터 등록 : 모든 요청 전에 실행됨
api.interceptors.request.use((config: AxiosRequestConfig | any) => {
  // [3-1] CMS용 토큰 가져오기 (⚠️ 일반 토큰 아님)
  const cmsToken = localStorage.getItem("cmsToken");

  // [3-2] cmsToken이 있으면 헤더에 첨부
  if (cmsToken && config.headers) {
    config.headers["X-AUTH-TOKEN"] = cmsToken; // 백엔드 JwtAuthenticationFilter에서 읽는 헤더
    
  }

  return config;
});

/*
//! [251012] 응답 인터셉터 등록 : 409만 명확히 처리
api.interceptors.response.use(
  (response) => response, // 정상 응답은 그대로 통과
  (error) => {
    // ⚠️ 서버가 409(CONFLICT) 응답을 준 경우만 별도 처리
    if (error.response?.status === 409) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "⚠️ 정렬번호가 중복됩니다. 다른 번호를 입력하세요.";

      // 콘솔에 명확히 남기기
      console.warn("409 Conflict 발생:", msg);

      // alert로 사용자에게 즉시 알림
      alert(msg);

      // 그대로 에러를 throw 해서 페이지 catch에서도 접근 가능하게 유지
      return Promise.reject(error);
    }

    // ⚠️ 409 외 에러는 원래 흐름대로 throw
    return Promise.reject(error);
  }
);
*/

// [4] export
export default api;
