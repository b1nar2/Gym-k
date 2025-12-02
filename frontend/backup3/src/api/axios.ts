// [1] axios 라이브러리 불러오기
import axios from "axios";
import type { AxiosRequestConfig } from "axios"; // [1-1] 타입 전용 import

// [2] axios 인스턴스 생성 : 공통 API 호출 설정
const api = axios.create({
  baseURL: "http://localhost:8181", // [2-1] API 기본 주소 (Vite proxy 사용 시 "/api"로 대체 가능)
  withCredentials: false,
  headers: { "Content-Type": "application/json" }, // [2-2] 기본 요청 헤더: JSON
});

// [3] 요청 인터셉터 등록 : 모든 요청 전에 실행됨
api.interceptors.request.use((config: AxiosRequestConfig | any) => {
  // [3-1] localStorage에서 토큰 가져오기
  const token = localStorage.getItem("token");

  // [3-2] 토큰이 있고, 헤더 객체가 있으면 헤더에 토큰 추가
  if (token && config.headers) {
    // [3-3] 백엔드 JwtAuthenticationFilter가 읽는 헤더 키 (소문자/대소문자 차이 방지 위해 표준 소문자 사용 권장)
    // config.headers["x-auth-token"] = token; 
    // [251002] 수정사항
    config.headers["X-AUTH-TOKEN"] = token; // JwtAuthenticationFilter가 정상적으로 토큰 스캔을 위해서 만든거
  }

  // [3-4] 변경된 config 반환 → 실제 요청으로 전달됨
  return config;
});

// [4] 설정한 axios 인스턴스를 export 해서 다른 컴포넌트에서 사용할 수 있게 함
export default api;
