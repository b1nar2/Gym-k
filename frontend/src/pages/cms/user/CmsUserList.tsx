//! =============================================================
//! [파일명] CmsUserList.tsx (Final CMS UI Ver. - Hybrid)
//! [설명] CMS 관리자 전용 회원 목록 화면 (책임자 전용)
//! [작성일] 2025-10-23
//! [특징] 표 기반 + 카드형 인터랙션 결합 (하이브리드형)
//! [수정] 2025-10-24: 신규 등록 및 검색 버튼 스타일 통일, 필터/검색 영역 레이아웃 개선
//! =============================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axiosCms";
import "../../../css/all/form.css";
import "../../../css/cms/list.css";

interface Member {
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberMobile: string;
  memberRole?: string;
  adminType?: string;
  memberJoindate: string;
}

export default function CmsUserList() {
  const navigate = useNavigate();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // =============================================================
  // 🚀 초기 실행
  // =============================================================
  useEffect(() => {
    const role = localStorage.getItem("adminRole");
    if (role !== "책임자") {
      alert("책임자 전용 메뉴입니다.");
      navigate("/cms/home");
      return;
    }
    fetchMembers();
  }, []);

  // =============================================================
  // 📡 회원 목록 조회
  // =============================================================
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/cms/members");
      let list = res.data.data || res.data;

      // 필터링 로직
      if (keyword.trim()) {
        const lower = keyword.toLowerCase();
        list = list.filter(
          (m: Member) =>
            m.memberId.toLowerCase().includes(lower) ||
            m.memberName.toLowerCase().includes(lower) ||
            m.memberEmail.toLowerCase().includes(lower)
        );
      }

      if (roleFilter) list = list.filter((m: Member) => m.memberRole === roleFilter);

      if (startDate || endDate) {
        list = list.filter((m: Member) => {
          const join = new Date(m.memberJoindate).getTime();
          const start = startDate ? new Date(startDate).getTime() : -Infinity;
          const end = endDate ? new Date(endDate).getTime() : Infinity;
          // 날짜 검색 시, 끝 날짜는 해당 날짜의 23:59:59까지 포함하도록 조정
          const adjustedEnd = endDate ? new Date(endDate).getTime() + 86399999 : Infinity;
          return join >= start && join <= adjustedEnd;
        });
      }

      // 정렬 (최신 가입일 순)
      list.sort(
        (a: Member, b: Member) =>
          new Date(b.memberJoindate).getTime() - new Date(a.memberJoindate).getTime()
      );

      setMembers(list);
      setTotalCount(list.length);
    } catch (err) {
      console.error("회원 목록 조회 실패:", err);
      setError("회원 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchMembers();
  };

  const handleRowClick = (id: string) => navigate(`/cms/user/form?edit=${id}`);
  const handleCreate = () => navigate("/cms/user/form");

  const handleDelete = async (memberId: string) => {
    if (!confirm(`${memberId} 사용자를 삭제하시겠습니까?`)) return;
    try {
      await api.delete(`/api/cms/members/${memberId}`);
      fetchMembers();
    } catch (err) {
      console.error(err);
      setError("삭제 중 오류가 발생했습니다.");
    }
  };

  const startIdx = (page - 1) * size;
  const endIdx = startIdx + size;
  const pagedMembers = members.slice(startIdx, endIdx);

  // =============================================================
  // 🧭 UI 렌더링
  // =============================================================
  if (loading)
    return (
      <div className="p-6 text-gray-600 animate-pulse text-center">
        ⏳ 회원 목록을 불러오는 중...
      </div>
    );
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-8 min-h-screen bg-gray-50 rounded-xl">
      {/* ===================================================== */}
      {/* 🧱 상단 헤더 */}
      {/* ===================================================== */}
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            👥 회원 관리
            <span className="ml-2 text-gray-500 text-sm">총 {totalCount}명</span>
          </h1>
          <p className="text-gray-500 text-xs mt-1">CMS 관리자 전용 회원 목록입니다.</p>
        </div>
      </div>

      {/* ===================================================== */}
      {/* 🔍 검색 / 필터 영역 */}
      {/* ===================================================== */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200">
        <div className="filter-search-row"> {/* ✅ 레이아웃 및 간격 개선 클래스 적용 */}
          <div className="filter-group">
            <label className="font-medium text-gray-700">가입일</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="form-input filter-input w-auto" />
            <span>~</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-input filter-input w-auto" />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">전체</option>
            <option value="user">회원</option>
            <option value="admin">관리자</option>
          </select>

          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="회원명, ID, 이메일 검색"
            className="form-input filter-input w-full"
          />

          <button
            onClick={handleSearch}
            className="common-button-style" // ✅ 검색 버튼 스타일 통일
          >
            검색
          </button>
        </div>
      </div>
      
      <br/> {/* 높이 조절용 */}

      {/* //! ===================================================== */}
      {/* //! 버튼  영역 */}
      {/* //! 참고 사이트 https://cssreference.io/flexbox/#justify-content */}
      {/* //! ===================================================== */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}> 
      {/* //* [251024] 버튼 위치 인라인 양식으로 변경 (상단 링크 참고) */}
        <button
          onClick={handleCreate}
          className="primary-button-style"  //* [251024] 버튼 디자인 변경
        >
          신규 회원 등록
        </button>
      </div>
      
      <br/> {/* 높이 조절용 */}

      {/* ===================================================== */}
      {/* 🧾 회원 목록 (하이브리드형) */}
      {/* ===================================================== */}
      <div className="mt-6 table-wrap">
        <table className="table-fixed table-fixed border-collapse">
          <thead className="bg-slate-100 text-gray-700 text-sm">
            <tr>
              <th className="px-5 py-3 text-left w-16">No</th>
              <th className="px-5 py-3 text-left w-40">회원ID</th>
              <th className="px-5 py-3 text-left w-36">이름</th>
              <th className="px-5 py-3 text-left w-32">권한</th>
              <th className="px-5 py-3 text-left w-44">휴대폰</th>
              <th className="px-5 py-3 text-left w-44">가입일</th>
              <th className="px-5 py-3 text-right w-44">관리</th>
            </tr>
          </thead>

          <tbody>
            {pagedMembers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  🔍 검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              pagedMembers.map((m, idx) => (
                <tr
                  key={m.memberId}
                  className="group transition-all duration-200 cursor-pointer hover:bg-indigo-50 hover:shadow-sm"
                >
                  <td className="px-5 py-3 text-gray-700 font-medium">
                    {startIdx + idx + 1}
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-semibold text-gray-800 group-hover:text-indigo-700">
                      {m.memberId}
                    </div>
                    <div className="text-xs text-gray-500">{m.memberEmail}</div>
                  </td>
                  <td className="px-5 py-3">{m.memberName}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${m.memberRole === "admin"
                          ? "bg-indigo-100 text-indigo-700"
                          : m.adminType === "책임자"
                            ? "bg-pink-100 text-pink-700"
                            : m.adminType === "강사"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                    >
                      {m.memberRole === "user" ? "회원" : m.adminType || "관리자"}
                    </span>
                  </td>
                  <td className="px-5 py-3">{m.memberMobile}</td>
                  <td className="px-5 py-3">{m.memberJoindate?.substring(0, 10)}</td>
                  <td className="px-5 py-3 text-right table-actions">
                    <button onClick={() => handleRowClick(m.memberId)} className="edit">수정</button>
                    <button onClick={() => handleDelete(m.memberId)} className="delete">삭제</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ===================================================== */}
      {/* //* [251024] 페이지 네비게이션 */}
      {/* ===================================================== */}
      <div className="pagination-container">{/* //* [251024] 페이지 네비게이션 양식 변경 */}
        <button onClick={() => setPage(page - 1)} disabled={page === 1} className="page-button">이전</button>
        <span className="page-info">{page} / {Math.ceil(totalCount / size)} 페이지</span>
        <button onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(totalCount / size)} className="page-button">다음</button>
      </div>
    </div>
  );
}