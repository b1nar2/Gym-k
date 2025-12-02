import React, { useState } from "react"; // useState: 메뉴 클릭 시 펼침 상태 관리용
import { Link } from "react-router-dom"; // Link: 페이지 이동용 컴포넌트
import api from "../api/axios";       //! [251012] 사용자 전용 axios 인스턴스 (2depthn 펼치려면 토큰 기록 필요함)


/**
 * 홈페이지 상단 네비게이션 바
 * - 일반 사용자 메뉴 (시설 이용 신청, 상품안내, 게시판, 교육강좌, 이용안내)
 */
/*
const Navbar: React.FC = () => {
  return (
    <nav className="bg-white border-b flex justify-center shadow-sm">
      <Link to="/facilities" className="px-6 py-3 hover:bg-gray-100">
        시설 이용 신청
      </Link>
      <Link to="/products" className="px-6 py-3 hover:bg-gray-100">
        상품안내
      </Link>
      <Link to="/board" className="px-6 py-3 hover:bg-gray-100">
        게시판
      </Link>
      <Link to="/education" className="px-6 py-3 hover:bg-gray-100">
        교육강좌
      </Link>
      <Link to="/guide" className="px-6 py-3 hover:bg-gray-100">
        이용안내
      </Link>
    </nav>
  );
};
*/
// [2] 콘텐츠 데이터 타입 정의
interface ContentItem {
  contentId: number; // [2-1] 콘텐츠 고유 ID (PK)
  contentTitle: string; // [2-2] 콘텐츠 제목
  contentType: string; // [2-3] 콘텐츠 상위 메뉴명(이용안내, 상품/시설안내)
  contentNum: number; // [2-4] 정렬 순서 번호(2depth)
}

// [3] Navbar 컴포넌트 정의 시작
const Navbar: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null); // [3-1] 현재 펼쳐진 1depth 메뉴명 저장
  const [contentMap, setContentMap] = useState<Record<string, ContentItem[]>>({}); // [3-2] 1depth별 콘텐츠 목록 캐시(불필요한 재요청 방지)

  // [4] 메뉴 클릭 시 실행되는 함수
  const toggleMenu = async (type: string) => {
    // [4-1] 이미 열린 메뉴 클릭 시 → 닫기
    if (activeMenu === type) {
      setActiveMenu(null);
      return;
    }

    // [4-2] 새 메뉴 클릭 시 → 활성화
    setActiveMenu(type);

    // [4-3] 이미 데이터가 있다면 API 재요청 방지
    if (contentMap[type]) return;

    try {
      // [4-4] 백엔드 API 호출 → 해당 1depth(type)의 콘텐츠 목록 불러오기
      const res = await api.get(`/api/contents?type=${type}`);

      // [4-5] 응답 데이터 중 실제 콘텐츠 목록 추출
      const list: ContentItem[] = res.data.data || [];

      // [4-6] contentNum 기준 오름차순 정렬 (번호순 정렬)
      list.sort((a, b) => a.contentNum - b.contentNum);

      // [4-7] 기존 목록에 병합하여 캐시 저장
      setContentMap((prev) => ({ ...prev, [type]: list }));

      console.log(`[Navbar] ${type} 콘텐츠 ${list.length}건 불러옴`);
    } catch (err) {
      // [4-8] 오류 발생 시 콘솔 출력
      console.error(`[Navbar] ${type} 콘텐츠 목록 조회 실패:`, err);
    }
  };

  // [5] 실제 화면 렌더링 부분
  return (
    <nav className="bg-white border-b flex justify-center shadow-sm">
      {/* [5-1] 시설 이용 신청 메뉴 (단일 이동형) */}
      <Link to="/facilities" className="px-6 py-3 hover:bg-gray-100">
        시설 이용 신청
      </Link>

      {/* [5-2] 상품/시설안내 메뉴 (2depth 펼침형) */}
      <div className="relative flex flex-col items-start">
        <button
          onClick={() => toggleMenu("상품/시설안내")} // [5-2-1] 클릭 시 toggleMenu 함수 호출
          className="px-6 py-3 hover:bg-gray-100"
        >
          상품/시설안내 {activeMenu === "상품/시설안내" ? "▼" : "▶"} {/* [5-2-2] 현재 열림 여부 표시 */}
        </button>

        {/* [5-2-3] 펼침 상태일 때만 하위 목록 표시 */}
        {activeMenu === "상품/시설안내" && (
          <div
            className="
              absolute left-0 mt-1
              bg-white border shadow-md rounded-md
              w-64 z-50
              flex flex-col   /* 세로로 한 줄씩 표시 */
              !block    /* ✅ display:block 강제 (flex 충돌 회피) */
            "
          >
            {contentMap["상품/시설안내"]?.map((item) => (
              <Link
                key={item.contentId} // [5-2-4] 고유 key 설정
                to={`/contents/${item.contentType}/${item.contentNum}`} // [5-2-5] 상세 페이지 이동 경로
                className="block px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
              >
                {/* {item.contentNum}.  */}
                {"■ " + item.contentTitle} {/* [5-2-6] 제목 표시 */}
              </Link>
            ))}

            {/* [5-2-7] 콘텐츠가 없을 경우 안내 문구 표시 */}
            {(!contentMap["상품/시설안내"] ||
              contentMap["상품/시설안내"].length === 0) && (
                <p className="px-4 py-2 text-gray-400 text-sm">
                  등록된 콘텐츠 없음
                </p>
              )}
          </div>
        )}
      </div>

      {/* [5-3] 게시판 메뉴 (단일 이동형) */}
      <Link to="/board" className="px-6 py-3 hover:bg-gray-100">
        게시판 ▶
      </Link>

      {/* [5-4] 교육강좌 메뉴 (단일 이동형) */}
      <Link to="/education" className="px-6 py-3 hover:bg-gray-100">
        교육강좌 ▶
      </Link>

      {/* [5-5] 이용안내 메뉴 (2depth 펼침형) */}
      <div className="relative flex flex-col items-start">
        <button
          onClick={() => toggleMenu("이용안내")} // [5-5-1] 클릭 시 해당 type의 목록 요청
          className="px-6 py-3 hover:bg-gray-100"
        >
          이용안내 {activeMenu === "이용안내" ? "▼" : "▶"} {/* [5-5-2] 현재 열림 여부 표시 */}
        </button>

        {/* [5-5-3] 해당 메뉴가 활성화된 경우 하위 목록 표시 */}
        {activeMenu === "이용안내" && (
          <div
            className="
              absolute left-0 mt-1
              bg-white border shadow-md rounded-md
              w-64 z-50
              flex flex-col   /* 세로로 한 줄씩 표시 */
              !block    /* ✅ display:block 강제 (flex 충돌 회피) */
            "
          >
            {contentMap["이용안내"]?.map((item) => (
              <Link
                key={item.contentId} // [5-5-4] 각 콘텐츠별 고유 key
                to={`/contents/${item.contentType}/${item.contentNum}`} // [5-5-5] 상세 페이지 이동 경로
                className="block px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
              >
                {/* {item.contentNum}.  */}
                {"■ " + item.contentTitle} {/* [5-5-6] 제목 */}
              </Link>
            ))}

            {/* [5-5-7] 등록된 콘텐츠가 없는 경우 안내 */}
            {(!contentMap["이용안내"] ||
              contentMap["이용안내"].length === 0) && (
                <p className="px-4 py-2 text-gray-400 text-sm">
                  등록된 콘텐츠 없음
                </p>
              )}
          </div>
        )}
      </div>
    </nav>
  );
};
export default Navbar;
