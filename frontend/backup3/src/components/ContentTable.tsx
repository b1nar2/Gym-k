import React from "react";

/**
 * 📌 ContentTable 컴포넌트
 * - "최신 콘텐츠" 목록을 테이블 형태로 출력
 * - 현재는 더미 데이터 배열을 사용 (추후 API 연동 가능)
 */
const ContentTable: React.FC = () => {
  // ✅ 더미 데이터 (실제로는 서버에서 가져올 예정)
  const data = [
    { id: 3, title: "9월 신청", date: "2025-09-01" },
    { id: 2, title: "8월 신청", date: "2025-08-01" },
    { id: 1, title: "7월 신청", date: "2025-07-30" },
  ];

  return (
    <div>
      {/* 테이블 제목 */}
      <h2 className="font-bold mb-2">최신 콘텐츠</h2>

      {/* ============================== */}
      {/* 테이블 시작 */}
      {/* ============================== */}
      <table className="w-full border text-sm">
        {/* 테이블 헤더 */}
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">번호</th>
            <th className="border px-2 py-1">제목</th>
            <th className="border px-2 py-1">등록일</th>
          </tr>
        </thead>

        {/* 테이블 본문 */}
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              {/* 번호 */}
              <td className="border px-2 py-1 text-center">{row.id}</td>

              {/* 제목 (파란색 + 밑줄 → 클릭 가능하게 보이도록 스타일링) */}
              <td className="border px-2 py-1 text-blue-600 underline cursor-pointer">
                {row.title}
              </td>

              {/* 등록일 */}
              <td className="border px-2 py-1 text-center">{row.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ContentTable;
