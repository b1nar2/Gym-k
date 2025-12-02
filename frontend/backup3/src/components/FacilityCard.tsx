import React from "react";
import { Link } from "react-router-dom"; // ✅ 페이지 이동용 Link 추가

/**
 * 📌 FacilityCard 컴포넌트
 * - 체육관 내 특정 시설(수영장, 볼링장 등)을 카드 형태로 표시
 * - 이름(name) props로 받아서 출력
 */
interface FacilityCardProps {
  name: string; // 시설 이름 (예: 수영장, 농구장 등)
}

const FacilityCard: React.FC<FacilityCardProps> = ({ name }) => {
  return (
    <div className="border rounded p-4 text-center bg-white shadow">
      {/* 시설 이미지 클릭 시 시설 목록(/facilities)로 이동 */}
      <Link to="/facilities">
        <div className="h-32 bg-gray-300 flex items-center justify-center hover:bg-gray-400">
          시설 이미지
        </div>
      </Link>

      {/* 시설명 출력 */}
      <p className="mt-2 text-sm font-medium">({name})</p>

      {/* 시설 이용 신청 버튼 (클릭 시 /facilities 이동) */}
      <Link
        to="/facilities"
        className="mt-2 inline-block px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
      >
        시설 이용 신청
      </Link>
    </div>
  );
};

export default FacilityCard;
