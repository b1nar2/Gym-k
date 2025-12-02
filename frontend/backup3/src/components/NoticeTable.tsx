import React from "react";

/**
 * 📌 NoticeTable 컴포넌트
 * - "최신 공지사항" 목록을 테이블 형태로 출력
 * - 현재는 더미 데이터 배열을 사용 (추후 API 연동 가능)
 */
const NoticeTable: React.FC = () => {
  // ✅ 더미 데이터
  const data = [
    { id: 3, title: "칭찬해줄게요", writer: "홍길동5", views: 150, date: "2025-09-01" },
    { id: 2, title: "칭찬해줄게요", writer: "홍길동2", views: 10, date: "2025-08-01" },
    { id: 1, title: "칭찬해줄게요", writer: "홍길동1", views: 12, date: "2025-07-30" },
  ];

  return (
    <div>
      {/* 테이블 제목 */}
      <h2 className="font-bold mb-2">최신 공지사항</h2>

      {/* ============================== */}
      {/* 테이블 */}
      {/* ============================== */}
      <table className="w-full border text-sm">
        {/* 테이블 헤더 */}
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-1">번호</th>
            <th className="border px-2 py-1">게시판명</th>
            <th className="border px-2 py-1">작성자</th>
            <th className="border px-2 py-1">조회수</th>
            <th className="border px-2 py-1">등록일</th>
          </tr>
        </thead>

        {/* 테이블 본문 */}
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              {/* 번호 */}
              <td className="border px-2 py-1 text-center">{row.id}</td>

              {/* 게시판명 (파란색 밑줄로 강조) */}
              <td className="border px-2 py-1 text-blue-600 underline cursor-pointer">
                {row.title}
              </td>

              {/* 작성자 */}
              <td className="border px-2 py-1 text-center">{row.writer}</td>

              {/* 조회수 */}
              <td className="border px-2 py-1 text-center">{row.views}</td>

              {/* 등록일 */}
              <td className="border px-2 py-1 text-center">{row.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NoticeTable;
