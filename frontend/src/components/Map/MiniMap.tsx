// src/components/Map/MiniMap.tsx
import React, { useEffect } from "react";

declare global {
  interface Window {
    kakao: any; // 카카오 지도 전역 객체
  }
}

interface MiniMapProps {
  onClick: () => void; // 부모에서 클릭 이벤트 받음 (모달 열기 용도)
}

const MiniMap: React.FC<MiniMapProps> = ({ onClick }) => {
  useEffect(() => {
    if (window.kakao && window.kakao.maps) {
      const container = document.getElementById("miniMap");
      if (!container) return;

      // 📍 체육관 좌표 (성남 분당, 돌마로 46)
      const fixedLatLng = { lat: 37.378606, lng: 127.112739 };
      const center = new window.kakao.maps.LatLng(fixedLatLng.lat, fixedLatLng.lng);

      // 지도 옵션
      const options = {
        center,
        level: 3, // 숫자 작을수록 확대
      };

      // ✅ 지도 생성
      const map = new window.kakao.maps.Map(container, options);

      // ✅ 마커 생성 + 지도에 표시
      const marker = new window.kakao.maps.Marker({ position: center });
      marker.setMap(map);
    } else {
      console.error("❌ Kakao 지도 SDK가 로드되지 않았습니다.");
    }
  }, []);

  return (
    <div
      id="miniMap"
      style={{
        width: "350px",
        height: "250px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        cursor: "pointer",
      }}
      onClick={onClick} // 클릭 시 부모에서 모달 열림
    />
  );
};

export default MiniMap;
