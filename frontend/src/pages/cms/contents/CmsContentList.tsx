//! [파일명] CmsContentList.tsx
//! [설명] CMS 콘텐츠 목록 화면 (책임자 전용)
//! [작성일] [251012]
//! [특징] 🔍 검색 키워드 기능, 📅 날짜 검색 기능, 📄 페이지 기능 통합
//! [연동 API] GET /api/cms/contents
//! [호출 위치] CmsApp.tsx → <Route path="contents" element={<CmsContentList />} />

import React, { useEffect, useState } from "react"; // React 훅(useState, useEffect) 사용
import { useNavigate } from "react-router-dom";     // 페이지 이동을 위한 라우터 훅
import api from "../../../api/axiosCms";            // CMS 전용 axios 인스턴스 (토큰 자동 포함)
import "../../../css/all/form.css";
import "../../../css/cms/list.css";

// [1] 콘텐츠 데이터 구조 정의 (백엔드 DTO(ContentResponse)와 동일)
interface Content {
  contentId: number;       // 콘텐츠 식별번호(PK)
  contentTitle: string;    // 콘텐츠 제목
  contentType: string;     // 콘텐츠 상위 메뉴(이용안내 / 상품·시설안내)
  contentUse: string;      // 사용 여부(Y/N)
  contentRegDate: string;  // 등록일
  contentModDate: string;  // 수정일
  memberId: string;        // 작성자 ID
}

// [2] CMS 콘텐츠 목록 컴포넌트 시작
export default function CmsContentList() {
  const navigate = useNavigate(); // 페이지 이동 함수 정의

  const [contents, setContents] = useState<Content[]>([]);  // 콘텐츠 목록 상태값
  const [loading, setLoading] = useState(true);             // 데이터 로딩 여부
  const [error, setError] = useState<string | null>(null);  // 에러 메시지 상태

  // 🔍 검색 키워드 관련 상태값
  const [keyword, setKeyword] = useState("");       // 콘텐츠명, 작성자, 메뉴명 등 검색어
  const [typeFilter, setTypeFilter] = useState(""); // 상위 메뉴(이용안내/상품·시설안내) 필터

  // 📅 날짜 검색 관련 상태값
  const [startDate, setStartDate] = useState("");   // 검색 시작일
  const [endDate, setEndDate] = useState("");       // 검색 종료일

  // 📄 페이지 관련 상태값
  const [page, setPage] = useState(1);              // 현재 페이지 번호
  const [size] = useState(10);                      // 한 페이지에 표시할 항목 수
  const [totalCount, setTotalCount] = useState(0);  // 전체 콘텐츠 개수

  // [3] 페이지 로드 시 실행 (최초 1회)
  useEffect(() => {
    fetchContents(); // 초기 콘텐츠 목록 조회
  }, []);

  // [4] 콘텐츠 목록 조회 함수
  const fetchContents = async () => {
    try {
      setLoading(true); // 로딩 상태 활성화

      // 백엔드 API 호출 + ?page=0&size=50 : 한 번에 최대 50개 항목 조회
      const res = await api.get("/api/cms/contents?page=0&size=50");

      let list = res.data.data.items || []; // 응답 데이터에서 목록(items) 추출

      // 🔍 검색어 필터링 (제목, 작성자, 메뉴명)
      if (keyword.trim()) {
        const lower = keyword.toLowerCase(); // 대소문자 구분 제거
        list = list.filter(
          (c: Content) =>
            c.contentTitle.toLowerCase().includes(lower) || // 제목 일치
            c.memberId.toLowerCase().includes(lower) ||     // 작성자 ID 일치
            c.contentType.toLowerCase().includes(lower)     // 상위메뉴 일치
        );
      }

      // 🔍 상위 메뉴 필터 (이용안내 / 상품·시설안내)
      if (typeFilter) {
        list = list.filter((c: Content) => c.contentType === typeFilter);
      }

      // 📅 등록일 기준 필터링 (시작일 ~ 종료일)
      if (startDate || endDate) {
        list = list.filter((c: Content) => {
          const reg = new Date(c.contentRegDate).getTime(); // 등록일을 숫자로 변환
          const start = startDate ? new Date(startDate).getTime() : -Infinity; // 시작 범위
          const end = endDate ? new Date(endDate).getTime() : Infinity;       // 종료 범위
          return reg >= start && reg <= end; // 지정된 기간 내 데이터만 포함
        });
      }

      // 📅 등록일 내림차순 정렬 (최신순)
      list.sort(
        (a: Content, b: Content) =>
          new Date(b.contentRegDate).getTime() - new Date(a.contentRegDate).getTime()
      );

      // 📄 목록 및 통계 상태 갱신
      setContents(list);           // 화면에 표시할 데이터 저장
      setTotalCount(list.length);  // 총 콘텐츠 개수 저장
    } catch (err) {
      console.error("콘텐츠 목록 조회 실패:", err); // 오류 로그 출력
      setError("콘텐츠 목록을 불러오지 못했습니다."); // 사용자용 에러 메시지 설정
    } finally {
      setLoading(false); // 로딩 종료
    }
  };

  // 🔍 검색 버튼 클릭 시 실행 (검색 필터 초기화 후 재조회)
  const handleSearch = () => {
    setPage(1);       // 현재 페이지를 1로 초기화
    fetchContents();  // 조건에 맞는 목록 다시 조회
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/api/cms/contents/${id}`);
      fetchContents();
      alert("삭제되었습니다.");
    } catch (err) {
      console.error(err);
      alert("삭제 실패");
    }
  };

  // 📄 현재 페이지에 맞는 데이터 계산
  const startIdx = (page - 1) * size;               // 현재 페이지 시작 인덱스 계산
  const endIdx = startIdx + size;                   // 현재 페이지 끝 인덱스 계산
  const pagedList = contents.slice(startIdx, endIdx); // 현재 페이지 데이터만 분리

  // 📄 콘텐츠 제목 클릭 시 상세페이지 이동
  const goDetail = (id: number) => navigate(`/cms/contents/${id}`);

  // 📄 신규 등록 버튼 클릭 시 등록 폼으로 이동
  const goForm = () => navigate("/cms/contents/form");

  // [5] 로딩 또는 오류 상태 처리
  if (loading) return <div className="p-6 text-gray-600">콘텐츠 목록을 불러오는 중...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  // [6] 실제 화면 렌더링
  return (
    <div className="p-8 bg-gray-50 min-h-screen rounded-xl">
      {/* 상단 제목과 등록 버튼 영역 */}
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          📚 콘텐츠 관리
          <span className="ml-2 text-sm text-gray-500">
            (총 {totalCount}건)
          </span>
        </h2>
      </div>


      {/* 검색 및 필터 영역 */}
      <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm mb-5">
        <div className="filter-search-row">

          {/* 등록일 필터 그룹 */}
          <div className="filter-group">
            <label className="text-gray-700">등록일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input filter-input w-auto"
            />
            <span className="text-gray-500">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input filter-input w-auto"
            />
          </div>

          {/* 상위메뉴 필터 */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-input filter-select"
          >
            <option value="">전체 메뉴</option>
            <option value="이용안내">이용안내</option>
            <option value="상품/시설안내">상품·시설안내</option>
          </select>

          {/* 검색 입력창 */}
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="콘텐츠명, 작성자 검색"
            className="form-input filter-input w-full"
          />

          {/* 검색 버튼 */}
          <button
            onClick={handleSearch}
            className="common-button-style"
          >
            검색
          </button>
        </div>
      </div>

      {/* 콘텐츠 등록 버튼 영역 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button
          onClick={goForm}
          className="primary-button-style"
        >
          + 콘텐츠 등록
        </button>
      </div>

      {/* 📄 콘텐츠 목록 테이블 */}
      <div className="table-wrap">
        <table className="table-fixed">
          <thead>
            <tr>
              <th>번호</th>
              <th>상위메뉴</th>
              <th>콘텐츠 제목</th>
              <th>작성자</th>
              <th>사용여부</th>
              <th>등록일</th>
              <th>수정일</th>
              <th>동작</th>
            </tr>
          </thead>
          <tbody>
            {pagedList.length > 0 ? (
              pagedList.map((c, idx) => (
                <tr key={c.contentId}>
                  <td>{startIdx + idx + 1}</td>
                  <td>{c.contentType}</td>
                  <td className="text-blue-600 underline cursor-pointer" onClick={() => goDetail(c.contentId)}>{c.contentTitle}</td>
                  <td>{c.memberId}</td>
                  <td>{c.contentUse === "Y" ? "사용" : "미사용"}</td>
                  <td>{c.contentRegDate?.substring(0, 10)}</td>
                  <td>{c.contentModDate?.substring(0, 10) || "-"}</td>
                  <td>
                    <div className="table-actions" style={{ textAlign: 'right' }}>
                      <button className="edit" onClick={(e) => { e.stopPropagation(); navigate(`/cms/contents/form?contentId=${c.contentId}`); }}>수정</button>
                      <button className="delete" onClick={(e) => { e.stopPropagation(); handleDelete(c.contentId); }} style={{ marginLeft: 8 }}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-gray-500">
                  등록된 콘텐츠가 없습니다. {/* 데이터 없을 때 표시 */}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 📄 페이지 이동 버튼 */}
      <div className="pagination-container">
        <button
          onClick={() => setPage(page - 1)}              // 이전 페이지로 이동
          disabled={page === 1}                          // 첫 페이지에서 비활성화
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          이전
        </button>
        <span>
          {page} / {Math.ceil(totalCount / size)} 페이지 {/* 현재 페이지 표시 */}
        </span>
        <button
          onClick={() => setPage(page + 1)}              // 다음 페이지로 이동
          disabled={page >= Math.ceil(totalCount / size)} // 마지막 페이지일 때 비활성화
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </div>
  );
}
