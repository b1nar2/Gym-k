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

// [4] export
export default api;
