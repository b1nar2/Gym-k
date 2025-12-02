//! [파일명] CmsFacilityList.tsx
//! [설명] CMS 시설 목록 조회 화면 (강사·책임자 전용)
//! [백엔드] CmsFacilityController.java → GET /api/cms/facilities
//! [작성일] [251007-수정: 총개수·페이징 추가]

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axiosCms"; // CMS 전용 axios 인스턴스 (cmsToken 자동 첨부)

interface Facility {
  facilityId: number;
  facilityName: string;
  facilityType: string;
  facilityUse: boolean;
  regDate: string;
  facilityRegDate: string; //! 백엔드에선 LocalDateTime이었지만 프론트에선 문자로 받아와야 함
}

export default function CmsFacilityList() {
  const navigate = useNavigate();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [keyword, setKeyword] = useState(""); // 🔍[검색 키워드 기능]
  const [category, setCategory] = useState(""); //! [251008 추가] 🏷️[카테고리 검색 기능] 
  const [loading, setLoading] = useState(true);

  // 📄[페이지 기능]
  const [page, setPage] = useState(0); // 현재 페이지(0부터 시작)
  const [size, setSize] = useState(10); // 한 페이지당 표시 개수
  const [total, setTotal] = useState(0); // 총 시설 수

  // [1] 시설 목록 조회
  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/cms/facilities", {
        params: {
          name: keyword || undefined, // 🔍[검색 키워드 기능]
          type: category || undefined, //! [251008 추가] 🏷️[카테고리 검색 기능]
          page,
          size,
        },
      });

      const payload = res.data?.data || {};
      setFacilities(payload.items || []);
      setTotal(payload.total || 0); // 📄[페이지 기능]
    } catch (err) {
      console.error("시설 목록 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [page]); // 페이지 변경 시 자동 조회

  const handleSearch = () => {
    setPage(0); // 검색 시 첫 페이지로 초기화
    fetchFacilities();
  };

  const handleCreate = () => navigate("/cms/facility/create");
  const handleEdit = (id: number) => navigate(`/cms/facility/create?edit=${id}`);

  // 📄[페이지 기능] 총 페이지 계산
  const totalPages = Math.ceil(total / size);

  if (loading) return <div className="p-6">시설 목록을 불러오는 중...</div>;

  return (
    <div className="p-6">
      {/* 상단 타이틀 + 등록 버튼 */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-800">
          시설 관리{" "}
          <span className="text-sm text-gray-500 ml-2">
            (총 {total.toLocaleString()}건)
          </span>
        </h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          시설 등록
        </button>
      </div>

      {/* 🔍[검색 키워드 기능] */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="시설명 검색"
          className="border rounded px-3 py-2 w-48"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded px-3 py-2 w-40"
        >
          <option value="">전체</option>
          <option value="수영장">수영장</option>
          <option value="농구장">농구장</option>
          <option value="풋살장">풋살장</option>
          <option value="배드민턴장">배드민턴장</option>
          <option value="볼링장">볼링장</option>
        </select>

        <button
          onClick={handleSearch}
          className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          검색
        </button>
      </div>

      {/* 목록 테이블 */}
      <table className="w-full bg-white shadow rounded text-sm text-gray-700">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left w-16">번호</th>
            <th className="px-4 py-2 text-left">시설명</th>
            <th className="px-4 py-2 text-left">유형</th>
            <th className="px-4 py-2 text-left w-24">사용여부</th>
            <th className="px-4 py-2 text-left w-32">등록일</th>
          </tr>
        </thead>
        <tbody>
          {facilities.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-6 text-gray-500">
                등록된 시설이 없습니다.
              </td>
            </tr>
          ) : (
            facilities.map((f, i) => (
              <tr
                key={f.facilityId}
                onClick={() => handleEdit(f.facilityId)}
                className="hover:bg-blue-50 cursor-pointer border-b"
              >
                <td className="px-4 py-2">{page * size + i + 1}</td>
                <td className="px-4 py-2">{f.facilityName}</td>
                <td className="px-4 py-2">{f.facilityType}</td>
                <td className="px-4 py-2">
                  {f.facilityUse ? "사용중" : "미사용"}
                </td>
                <td className="px-4 py-2">
                  {f.facilityRegDate ? f.facilityRegDate.substring(0, 10) : "-"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 📄[페이지 기능] 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page === 0}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            이전
          </button>

          <span className="text-gray-700 text-sm">
            {page + 1} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
            disabled={page + 1 >= totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
