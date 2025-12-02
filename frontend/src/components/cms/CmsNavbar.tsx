import React from "react";
import { Link } from "react-router-dom";

/**
 * 📌 CMS(관리자) 전용 네비게이션 바
 * - 관리자 화면에서만 사용
 * - 메뉴 구성:
 *   ▶ 사용자 관리: 로그인, 회원가입, 마이페이지, 정보수정, 결제수단
 *   ▶ CMS 게시판 관리: 게시판 목록, 공통게시판, 글쓰기
 *   ▶ CMS 회원 관리: 회원 목록, 회원 등록
 */
const CmsNavbar: React.FC = () => {
  return (
    // 전체 네비게이션 컨테이너
    // - 배경색: 진한 회색(bg-gray-800)
    // - 글자색: 흰색(text-white)
    // - 내부 패딩: px-6, py-3
    // - 메뉴들 간격: flex gap-4
    // - flex-wrap: 화면이 작을 때 자동 줄바꿈
    <nav className="bg-gray-800 text-white px-6 py-3 flex gap-4 flex-wrap">

      {/* ============================== */}
      {/* ✅ 사용자 관리 메뉴 */}
      {/* ============================== */}
      <Link to="/login" className="hover:underline">로그인</Link>
      <Link to="/register" className="hover:underline">회원가입</Link>
      <Link to="/mypage" className="hover:underline">마이페이지</Link>
      <Link to="/member-edit" className="hover:underline">정보수정</Link>
      <Link to="/payment" className="hover:underline">결제수단</Link>

      {/* ============================== */}
      {/* ✅ CMS 게시판 관리 메뉴 */}
      {/* ============================== */}
      <Link to="/board" className="hover:underline">게시판 목록</Link>
      <Link to="/common-board" className="hover:underline">공통 게시판</Link>
      <Link to="/common-board/form" className="hover:underline">공통 글쓰기</Link>
      <Link to="/board/form" className="hover:underline">글쓰기</Link>

      {/* ============================== */}
      {/* ✅ CMS 회원 관리 메뉴 */}
      {/* ============================== */}
      <Link to="/member/list" className="hover:underline">회원 목록</Link>
      <Link to="/member/form" className="hover:underline">회원 등록</Link>
    </nav>
  );
};

export default CmsNavbar;
