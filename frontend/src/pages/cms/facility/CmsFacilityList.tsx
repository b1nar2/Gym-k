//! =============================================================
//! [파일명] CmsFacilityList.tsx (Hybrid CMS UI Ver.)
//! [설명] CMS 시설 목록 화면 — 표형 + 카드 인터랙션 하이브리드 UI
//! [작성일] 2025-10-23
//! [특징] 관리자용 UI 일관성 / hover 강조 / UX 시각적 개선
//! =============================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axiosCms";
import "../../../css/all/form.css";
import "../../../css/cms/list.css";

interface Facility {
  facilityId: number;
  facilityName: string;
  facilityType: string;
  facilityUse: boolean;
  regDate: string;
  facilityRegDate: string;
}

export default function CmsFacilityList() {
  const navigate = useNavigate();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [total, setTotal] = useState(0);

  // =============================================================
  // 📡 시설 목록 조회
  // =============================================================
  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/cms/facilities", {
        params: {
          name: keyword || undefined,
          type: category || undefined,
          page,
          size,
        },
      });

      const payload = res.data?.data || {};
      setFacilities(payload.items || []);
      setTotal(payload.total || 0);
    } catch (err) {
      console.error("시설 목록 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [page]);

  const handleSearch = () => {
    setPage(0);
    fetchFacilities();
  };

  const handleCreate = () => navigate("/cms/facility/create");
  const handleEdit = (id: number) => navigate(`/cms/facility/create?edit=${id}`);
  const handleDelete = async (id: number) => {
    if (!confirm(`${id} 시설을 삭제하시겠습니까?`)) return;
    try {
      await api.delete(`/api/cms/facilities/${id}`);
      fetchFacilities();
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const totalPages = Math.ceil(total / size);

  if (loading)
    return (
      <div className="p-6 text-gray-600 text-center animate-pulse">
        ⏳ 시설 목록을 불러오는 중입니다...
      </div>
    );

  // =============================================================
  // 🧭 UI 렌더링
  // =============================================================
  return (
    <div className="p-8 bg-gray-50 min-h-screen rounded-xl">
      {/* ===================================================== */}
      {/* 상단 타이틀 영역 */}
      {/* ===================================================== */}
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            🏟️ 시설 관리
            <span className="ml-2 text-sm text-gray-500">
              (총 {total.toLocaleString()}건)
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            강사·책임자 전용 시설 관리 페이지입니다.
          </p>
        </div>

        {/* <button
          onClick={handleCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow transition"
        >
          + 시설 등록
        </button> */}

      </div>

      {/* ===================================================== */}
      {/* 🔍 검색 필터 영역 */}
      {/* ===================================================== */}
      <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm mb-5">
        {/* <div className="flex flex-wrap gap-3 items-center text-sm"> */}
        <div className="filter-search-row">  

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            //className="form-input w-40"
            className="form-input filter-select"
          >
            <option value="">전체</option>
            <option value="수영장">수영장</option>
            <option value="농구장">농구장</option>
            <option value="풋살장">풋살장</option>
            <option value="배드민턴장">배드민턴장</option>
            <option value="볼링장">볼링장</option>
          </select>

          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="시설명 검색"
            //className="form-input w-60"
            className="form-input filter-input w-full"
          />


          <button
            onClick={handleSearch}
            //className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-md transition"
            className="common-button-style"
          >
            검색
          </button>
        </div>
      </div>

      <br/>
      
      {/* //! ===================================================== */}
      {/* //! 버튼 영역 (CmsUserList와 동일한 레이아웃) */}
      {/* //! ===================================================== */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleCreate}
          className="primary-button-style"  //* ✅ CmsUserList의 primary-button-style 적용
        >
          시설 등록
        </button>
      </div>

      <br/>

      {/* ===================================================== */}
      {/* 📋 시설 목록 (하이브리드형 테이블) */}
      {/* ===================================================== */}
      <div className="mt-6 table-wrap">
        <table className="table-fixed table-fixed border-collapse text-sm text-gray-700">
          <thead className="bg-slate-100 text-gray-800">
            <tr>
              <th className="px-5 py-3 text-left w-16">No</th>
              <th className="px-5 py-3 text-left">시설명</th>
              <th className="px-5 py-3 text-left w-32">유형</th>
              <th className="px-5 py-3 text-center w-32">사용여부</th>
              <th className="px-5 py-3 text-left w-40">등록일</th>
              <th className="px-5 py-3 text-right w-40">관리</th>
            </tr>
          </thead>

          <tbody>
            {facilities.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  ⚠️ 등록된 시설이 없습니다.
                </td>
              </tr>
            ) : (
              facilities.map((f, i) => (
                <tr
                  key={f.facilityId}
                  className="group border-b hover:bg-indigo-50 transition-all duration-150"
                >
                  <td className="px-5 py-3 font-medium text-gray-700">
                    {page * size + i + 1}
                  </td>
                  <td className="px-5 py-3 font-semibold text-gray-800 group-hover:text-indigo-700">
                    {f.facilityName}
                    <div className="text-xs text-gray-500">
                      {f.facilityType || "-"}
                    </div>
                  </td>
                  <td className="px-5 py-3">{f.facilityType}</td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${f.facilityUse
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {f.facilityUse ? "사용중" : "미사용"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {f.facilityRegDate
                      ? f.facilityRegDate.substring(0, 10)
                      : "-"}
                  </td>
                  <td className="px-5 py-3 text-right table-actions">
                    <button onClick={() => handleEdit(f.facilityId)} className="edit">수정</button>
                    <button onClick={() => handleDelete(f.facilityId)} className="delete">삭제</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===================================================== */}
      {/* 📄 페이지 네비게이션 */}
      {/* ===================================================== */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
            disabled={page === 0}
            className="px-3 py-1.5 border rounded-md disabled:opacity-40 hover:bg-slate-100 transition"
          >
            이전
          </button>
          <span className="text-gray-700 font-medium">
            {page + 1} / {totalPages} 페이지
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
            disabled={page + 1 >= totalPages}
            className="px-3 py-1.5 border rounded-md disabled:opacity-40 hover:bg-slate-100 transition"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
