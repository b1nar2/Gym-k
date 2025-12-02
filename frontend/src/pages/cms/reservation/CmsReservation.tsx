//! =============================================================
//! [파일명] CmsReservation.tsx (Hybrid CMS UI Ver.)
//! [설명] CMS 신청현황 관리 화면 — 관리자용 UI 개선 (표 + 카드 하이브리드)
//! [작성일] 2025-10-23
//! [수정일] 2025-10-25 (UI 개선 + 승인/취소 기능 유지)
//! =============================================================

import React, { useEffect, useState } from "react";
import api from "../../../api/axiosCms";
import { useNavigate } from "react-router-dom";
import "../../../css/all/form.css";
import "../../../css/cms/list.css";

// =============================================================
// 📦 예약 데이터 구조 정의
// =============================================================
interface Reservation {
  resvId: number;
  memberId: string;
  memberName: string;
  facilityName: string;
  resvStatus: string;
  wantDate: string;
  resvDate: string;
  resvStartTime: string;
  resvEndTime: string;
}

// =============================================================
// 🧩 메인 컴포넌트
// =============================================================
export default function CmsReservation() {
  const navigate = useNavigate();

  // ✅ 상태 배지
  const StatusBadge = ({ status }: { status: string }) => {
    const base = "inline-block px-2 py-1 rounded text-xs font-semibold";
    if (status === "대기")
      return <span className={`${base} bg-amber-100 text-amber-800`}>{status}</span>;
    if (status === "완료")
      return <span className={`${base} bg-green-100 text-green-700`}>{status}</span>;
    if (status === "취소")
      return <span className={`${base} bg-red-100 text-red-700`}>{status}</span>;
    return <span className={`${base} bg-gray-100 text-gray-600`}>{status}</span>;
  };

  // -------------------------------------------------------------
  // 📊 상태 정의
  // -------------------------------------------------------------
  const [list, setList] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [facilityFilter, setFacilityFilter] = useState("");
  const [resvStartDate, setResvStartDate] = useState("");
  const [resvEndDate, setResvEndDate] = useState("");
  const [wantStartDate, setWantStartDate] = useState("");
  const [wantEndDate, setWantEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchType, setSearchType] = useState("facilityName");
  const [keyword, setKeyword] = useState("");

  // -------------------------------------------------------------
  // 📡 데이터 조회
  // -------------------------------------------------------------
  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/cms/reservations", {
        params: {
          facilityType: facilityFilter || undefined,
          resvStartDate: resvStartDate || undefined,
          resvEndDate: resvEndDate || undefined,
          wantStartDate: wantStartDate || undefined,
          wantEndDate: wantEndDate || undefined,
          searchType: searchType || undefined,
          keyword: keyword || undefined,
          page: page - 1,
          size: 20,
        },
      });

      const items = res.data?.data?.items ?? [];
      const totalCount = res.data?.data?.total ?? 0;
      setList(items);
      setTotalPages(Math.ceil(totalCount / 20));
    } catch (err) {
      console.error("예약 목록 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // ⚡️ 예약 상태 변경 핸들러 (POST 메서드 + 즉시 반영)
  // -------------------------------------------------------------
  const handleStatusChange = async (resvId: number, newStatus: "완료" | "취소") => {
    if (!window.confirm(`정말로 예약 ID ${resvId}를 [${newStatus}] 처리하시겠습니까?`)) return;

    try {
      setLoading(true);
      await api.post(`/api/cms/reservations/${resvId}/status`, null, {
        params: { resvStatus: newStatus },
      });

      alert(`${resvId}번 예약이 [${newStatus}] 처리되었습니다.`);
      fetchReservations(); // 즉시 반영
    } catch (err: any) {
      console.error("예약 상태 변경 실패:", err.response || err);
      let errorMsg = "서버 오류로 변경에 실패했습니다.";
      if (err.response?.data?.message) errorMsg = err.response.data.message;
      else if (err.message) errorMsg = err.message;
      alert(`예약 상태 변경 실패: ${errorMsg}`);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [facilityFilter, resvStartDate, resvEndDate, wantStartDate, wantEndDate, page]);

  const handleSearch = () => {
    setPage(1);
    fetchReservations();
  };

  const handleRowClick = (id: string) => navigate(`/cms/user/form?edit=${id}`);

  // ✅ 시간 추출 함수
  const formatTime = (datetime: string): string => {
    if (!datetime) return "";
    const date = new Date(datetime);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  // -------------------------------------------------------------
  // 🎨 UI 렌더링
  // -------------------------------------------------------------
  return (
    <div className="p-8 bg-gray-50 min-h-screen rounded-xl">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">📋 신청 현황 관리</h2>
        <p className="text-sm text-gray-500">승인 / 취소 / 검색 기능 포함</p>
      </div>

      {/* 필터 영역 */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 mb-6">
        <div className="filter-search-row">
          <select
            className="form-input filter-select"
            value={facilityFilter}
            onChange={(e) => setFacilityFilter(e.target.value)}
          >
            <option value="">전체 시설</option>
            <option value="풋살장">풋살장</option>
            <option value="농구장">농구장</option>
            <option value="수영장">수영장</option>
            <option value="배드민턴장">배드민턴장</option>
            <option value="볼링장">볼링장</option>
          </select>

          <div className="filter-group">
            <label className="text-gray-700">요청일</label>
            <input
              type="date"
              className="form-input filter-input w-auto"
              value={resvStartDate}
              onChange={(e) => setResvStartDate(e.target.value)}
            />
            <span className="text-gray-500">~</span>
            <input
              type="date"
              className="form-input filter-input w-auto"
              value={resvEndDate}
              onChange={(e) => setResvEndDate(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label className="text-gray-700">희망일</label>
            <input
              type="date"
              className="form-input filter-input w-auto"
              value={wantStartDate}
              onChange={(e) => setWantStartDate(e.target.value)}
            />
            <span className="text-gray-500">~</span>
            <input
              type="date"
              className="form-input filter-input w-auto"
              value={wantEndDate}
              onChange={(e) => setWantEndDate(e.target.value)}
            />
          </div>

          <select
            className="form-input filter-select"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="memberId">회원ID</option>
            <option value="memberName">회원명</option>
            <option value="facilityName">시설명</option>
          </select>

          <input
            type="text"
            className="form-input filter-input w-full"
            placeholder="검색어를 입력하세요"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />

          <button onClick={handleSearch} className="common-button-style">
            검색
          </button>
        </div>
      </div>

      <br/>
      
      {/* 목록 테이블 */}
      <div className="table-wrap">
        {loading ? (
          <p className="p-6 text-gray-600 animate-pulse text-center">데이터 불러오는 중...</p>
        ) : (
          <table className="table-fixed">
            <thead>
              <tr>
                <th>신청ID</th>
                <th>신청인(대표)</th>
                <th>시설명</th>
                <th>요청일</th>
                <th>희망일</th>
                <th className="text-center">시작</th>
                <th className="text-center">종료</th>
                <th className="text-center">상태</th>
                <th className="text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {list.length > 0 ? (
                list.map((r) => (
                  <tr key={r.resvId}>
                    <td>{r.resvId}</td>
                    <td onClick={() => handleRowClick(r.memberId)} style={{ cursor: "pointer" }}>
                      <div style={{ color: "#4f46e5", fontWeight: 600 }}>{r.memberName}</div>
                      <div className="text-xs text-gray-500">{r.memberId}</div>
                    </td>
                    <td>{r.facilityName}</td>
                    <td>{r.resvDate}</td>
                    <td>{r.wantDate}</td>
                    <td className="text-center">{formatTime(r.resvStartTime)}</td>
                    <td className="text-center">{formatTime(r.resvEndTime)}</td>
                    <td className="text-center">
                      <StatusBadge status={r.resvStatus} />
                    </td>
                    <td className="text-center">
                      <div className="table-actions">
                        <button
                          className={`edit`}
                          onClick={() => handleStatusChange(r.resvId, "완료")}
                          disabled={r.resvStatus !== "대기"}
                        >
                          승인
                        </button>
                        <button
                          className={`delete`}
                          onClick={() => handleStatusChange(r.resvId, "취소")}
                          disabled={r.resvStatus === "취소"}
                        >
                          취소
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500">
                    📭 신청 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이징 */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="page-button"
          >
            이전
          </button>
          <span className="page-info">
            {page} / {totalPages} 페이지
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages}
            className="page-button"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
