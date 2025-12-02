import React from "react";

/**
 * 📌 Footer 컴포넌트
 * - 페이지 하단 공통 영역
 * - 저작권, 회사 정보 등 표시 가능
 */
const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white text-center py-4 mt-6">
      <p className="text-sm">© 2025 체육관 예약 시스템 | All rights reserved.</p>
    </footer>
  );
};

export default Footer;
