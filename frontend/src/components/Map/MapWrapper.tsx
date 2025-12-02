// src/components/Map/MapWrapper.tsx
import React, { useState } from "react";
import MiniMap from "./MiniMap";
import MapModal from "./MapModal";

/**
 * MapWrapper
 * - 작은 지도(MiniMap)를 보여줌
 * - 클릭 시 큰 지도 모달(MapModal) 열림
 */
const MapWrapper: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false); // 모달 열림 여부

  return (
    <div>
      {/* 작은 지도 */}
      <MiniMap onClick={() => setIsOpen(true)} />

      {/* 큰 지도 모달 */}
      <MapModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
};

export default MapWrapper;
