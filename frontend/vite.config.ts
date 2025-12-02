// Vite 및 React 플러그인 불러오기
import { defineConfig } from 'vite' // Vite 설정 함수
import react from '@vitejs/plugin-react'  // React JSX/TSX 지원 플러그인

// https://vite.dev/config/
// Vite 설정 시작
export default defineConfig({
  plugins: [react()], // React 환경을 Vite에 연결

  // Draft.js 관련 버그 패치
  define: {
    global: {}, // ⚠️ Node.js 환경의 global 객체를 가짜로 정의 (리치에디터 내부 의존성 때문)
    'global.setImmediate': 'setTimeout',   //! [251013] setImmediate 오류 방지: Vite 런타임에서는 setImmediate 미지원이므로 setTimeout으로 대체
    /*
    ! 리치에디터는 내부적으로 setImmediate, global 객체를 사용하는데, 
    ! Vite(특히 Node 22 환경)에서는 이 값들이 기본적으로 정의되어 있지 않아서 런타임 오류가 발생할 수 있음
    */
  },

  // 반드시 추가 : https://ko.vite.dev/config/server-options
  // 개발 서버 설정
  server: {
    proxy: {
      // 백엔드 API 프록시 설정
      "/api": {
        target: 'http://localhost:8181/',  // ⚙️ 백엔드(Spring Boot) 서버 주소
        changeOrigin: true, // 요청 헤더의 Origin을 백엔드 기준으로 변경
        rewrite: (path) => path.replace(/^\/api/, ''), // "/api" 프리픽스 제거 후 전달
      },
      // 이미지 요청 프록시 설정 (예: 업로드 이미지 접근)
      "/images": {
      target: "http://localhost:8181/",   // ✅ 백엔드 서버로 연결
      changeOrigin: true,                 // ✅ 호스트 헤더도 백엔드 기준으로 변경
      },
    },
  },

  // [250929] 추가: React Router 새로고침 대응
   // 경로 alias 설정 (선택적)
  resolve: {
    alias: {}, // ⚙️ 필요 시 경로 단축(alias) 지정 가능 (예: '@components': '/src/components')
  },
  build: {
    rollupOptions: {
      input: "index.html", // ⚙️ Vite 빌드 진입점 지정
    },
  }
})