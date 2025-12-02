//! 251009 신규 파일
//! 사용자화면 로그인 유지를 위해 필요한 aixos

// [1] axios 라이브러리 불러오기
import axios from "axios"; // [1-1] axios 기본 모듈 import

// [2] 로그인 전용 axios 인스턴스 생성
// ⚠️ 주의: 로그인/회원가입 등 비인증 요청 전용
const axiosLogin = axios.create({
  baseURL: "http://localhost:8181", // [2-1] API 기본 주소
  withCredentials: false,           // [2-2] 쿠키·자격정보 미포함 (CORS 단순요청 통과용)
  headers: { "Content-Type": "application/json" }, // [2-3] 기본 요청 헤더(JSON)
});

// [3] export — Login.tsx 전용으로 사용
export default axiosLogin;
