// src/components/Map/MapModal.tsx
import React, { useEffect, useState } from "react";

declare global {
  interface Window {
    kakao: any;
  }
}

interface MapModalProps {
  isOpen: boolean; // 모달 열림 상태
  onClose: () => void; // 닫기 이벤트
}

const MapModal: React.FC<MapModalProps> = ({ isOpen, onClose }) => {
  const [map, setMap] = useState<any>(null);
  const [searchAddress, setSearchAddress] = useState("");

  // 📍 체육관 좌표 (고정 위치)
  const fixedLatLng = { lat: 37.378606, lng: 127.112739 };

  useEffect(() => {
    if (isOpen && window.kakao && window.kakao.maps) {
      const container = document.getElementById("fullMap");
      if (!container) return;

      const center = new window.kakao.maps.LatLng(fixedLatLng.lat, fixedLatLng.lng);
      const options = { center, level: 3 };

      // 지도 생성
      const newMap = new window.kakao.maps.Map(container, options);

      // 마커 표시
      new window.kakao.maps.Marker({
        position: center,
        map: newMap,
      });

      setMap(newMap);
    }
  }, [isOpen]);

  // ✅ 주소 검색 기능
  const handleSearch = () => {
    if (!searchAddress || !map) return;

    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(searchAddress, (result: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
        map.setCenter(coords);
        new window.kakao.maps.Marker({ map, position: coords });
      } else {
        alert("주소를 찾을 수 없습니다.");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0,
        width: "100%", height: "100%",
        background: "rgba(0,0,0,0.6)",
        display: "flex", justifyContent: "center", alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div style={{ position: "relative", width: "80%", height: "80%", background: "#fff", padding: "10px" }}>
        {/* 검색창 */}
        <div style={{ marginBottom: "10px", display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            placeholder="주소를 입력하세요"
            style={{ flex: 1, padding: "6px", border: "1px solid #ccc", borderRadius: 4 }}
          />
          <button
            onClick={handleSearch}
            style={{ padding: "6px 12px", background: "#4CAF50", color: "#fff", border: "none", borderRadius: 4 }}
          >
            검색
          </button>
        </div>

        {/* 큰 지도 영역 */}
        <div id="fullMap" style={{ width: "100%", height: "calc(100% - 50px)" }}></div>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: "10px", right: "10px",
            padding: "6px 12px", background: "red", color: "#fff",
            border: "none", borderRadius: 4, cursor: "pointer",
          }}
        >
          닫기 ✕
        </button>
      </div>
    </div>
  );
};

export default MapModal;
