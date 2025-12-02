//! [파일명] CmsUserList.tsx 2차
//! [설명] CMS 회원 목록 화면 (책임자 전용)
//! [작성일] [251007-통합]
//! [특징] 등록/수정은 CmsUserForm.tsx로 통합됨

import React, { useEffect, useState } from "react"; // [1] React 기본 훅 불러오기
import { useNavigate } from "react-router-dom";     // [2] 페이지 이동용 네비게이터 훅
import api from "../../../api/axiosCms";            // [3] CMS 전용 Axios 인스턴스 (cmsToken 자동 첨부)

// [4] Member 타입 정의 (백엔드 MemberResponse DTO와 동일하게 구성)
interface Member {
  memberId: string;        // 회원 ID (PK)
  memberName: string;      // 이름
  memberEmail: string;     // 이메일
  memberMobile: string;    // 휴대폰번호
  memberRole?: string;     // 권한(user/admin)
  adminType?: string;      // 관리자유형(책임자/관리자/강사)
  memberJoindate: string;  // 가입일
}

// [5] 컴포넌트 정의 시작
export default function CmsUserList() {
  const navigate = useNavigate(); // [6] 페이지 이동 기능 생성

  // [7] 회원 목록 관련 상태 정의
  const [members, setMembers] = useState<Member[]>([]); // 전체 회원 리스트
  const [loading, setLoading] = useState(true);         // 로딩 중 여부
  const [error, setError] = useState<string | null>(null); // 오류 메시지

  // 🔍[검색 키워드 기능] 검색·필터링 관련 상태
  const [keyword, setKeyword] = useState("");       // [🔍] 검색 키워드 (ID, 이름, 이메일)
  const [roleFilter, setRoleFilter] = useState(""); // [🔍] 권한 필터(user/admin)

  // 📅[날짜 검색 기능] 가입일 검색 구간 상태
  const [startDate, setStartDate] = useState("");   // 시작일
  const [endDate, setEndDate] = useState("");       // 종료일

  // 📄[페이지 기능] 페이지네이션 관련 상태
  const [page, setPage] = useState(1);              // 현재 페이지 번호
  const [size] = useState(10);                      // 한 페이지당 표시할 수
  const [totalCount, setTotalCount] = useState(0);  // 총 회원 수

  // [10] 첫 렌더링 시 실행 — 책임자 권한 체크 및 회원목록 로드
  useEffect(() => {
    const role = localStorage.getItem("adminRole"); // [10-1] 로컬스토리지에서 로그인 관리자 권한 확인
    if (role !== "책임자") {                        // [10-2] 책임자가 아닐 경우
      alert("책임자 전용 메뉴입니다.");             // [10-3] 접근 제한 알림
      navigate("/cms/home");                        // [10-4] 홈으로 이동
      return;
    }
    fetchMembers();                                 // [10-5] 권한 확인 통과 시 목록 로드
  }, []);

  // [11] 회원 목록 불러오기 함수
  const fetchMembers = async () => {
    try {
      setLoading(true); // [11-1] 로딩 시작
      const res = await api.get("/api/cms/members"); // [11-2] 백엔드 API 호출
      let list = res.data.data || res.data;          // [11-3] 실제 회원 리스트 추출

      // 🔍[검색 키워드 기능] 키워드 필터
      if (keyword.trim()) {
        const lower = keyword.toLowerCase();
        list = list.filter(
          (m: Member) =>
            m.memberId.toLowerCase().includes(lower) ||
            m.memberName.toLowerCase().includes(lower) ||
            m.memberEmail.toLowerCase().includes(lower)
        );
      }

      // 🔍[검색 키워드 기능] 권한 필터 (user/admin)
      if (roleFilter) {
        list = list.filter((m: Member) => m.memberRole === roleFilter);
      }

      // 📅[날짜 검색 기능] 가입일 범위 필터
      if (startDate || endDate) {
        list = list.filter((m: Member) => {
          const join = new Date(m.memberJoindate).getTime();
          const start = startDate ? new Date(startDate).getTime() : -Infinity;
          const end = endDate ? new Date(endDate).getTime() : Infinity;
          return join >= start && join <= end;
        });
      }

      // 📅[날짜 검색 기능] 내림차순 정렬 (최신 가입일이 위로)
      list.sort(
        (a: Member, b: Member) =>
          new Date(b.memberJoindate).getTime() - new Date(a.memberJoindate).getTime()
      );

      // 📄[페이지 기능] 결과 저장
      setMembers(list);           // [화면] 목록 데이터
      setTotalCount(list.length); // [통계] 총 회원 수
    } catch (err) {
      console.error("회원 목록 조회 실패:", err);
      setError("회원 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 🔍[검색 키워드 기능] 검색 버튼 클릭 시
  const handleSearch = () => {
    setPage(1);       // 📄[페이지 기능] 첫 페이지로 이동
    fetchMembers();   // 🔍 새 목록 불러오기
  };

  // 📄[페이지 기능] 현재 페이지 계산
  const startIdx = (page - 1) * size; // 시작 인덱스
  const endIdx = startIdx + size;     // 끝 인덱스
  const pagedMembers = members.slice(startIdx, endIdx); // 잘라내기

  // [14] 행 클릭 시 → 수정 페이지로 이동
  const handleRowClick = (id: string) => navigate(`/cms/user/form?edit=${id}`);

  // [15] 신규등록 버튼 클릭 시 → 등록 페이지로 이동
  const handleCreate = () => navigate("/cms/user/form");

  // [16] 로딩/에러 처리
  if (loading) return <div className="p-6 text-gray-600">회원 목록을 불러오는 중...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  // [17] 실제 화면 렌더링
  return (
    <div className="p-6">
      {/* [17-1] 상단 타이틀 + 등록 버튼 */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-800">
          회원 관리 ({totalCount}명)
        </h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          회원 등록
        </button>
      </div>

      {/* [17-2] 🔍📅 검색 및 필터 영역 */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
        <label>가입일</label>
        {/* 📅[날짜 검색 기능] 시작~종료일 */}
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <span>~</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border rounded px-2 py-1"
        />

        {/* 🔍[검색 키워드 기능] 회원명, ID, 이메일 입력 */}
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="회원명, 회원ID 입력"
          className="border rounded px-3 py-1"
        />

        {/* 🔍[검색 키워드 기능] 권한 필터 */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="">전체 역할</option>
          <option value="user">회원</option>
          <option value="admin">관리자</option>
        </select>

        {/* 🔍[검색 키워드 기능] 검색 버튼 */}
        <button
          onClick={handleSearch}
          className="bg-gray-700 text-white px-4 py-1 rounded hover:bg-gray-800"
        >
          검색
        </button>
      </div>

      {/* [17-3] 회원 목록 테이블 */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full table-auto text-sm text-gray-700">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">번호</th>
              <th className="px-4 py-2 text-left">회원ID</th>
              <th className="px-4 py-2 text-left">회원명</th>
              <th className="px-4 py-2 text-left">권한</th>
              <th className="px-4 py-2 text-left">휴대폰번호</th>
              <th className="px-4 py-2 text-left">가입일</th>
            </tr>
          </thead>
          <tbody>
            {pagedMembers.map((m, idx) => (
              <tr
                key={m.memberId}
                onClick={() => handleRowClick(m.memberId)}
                className="hover:bg-blue-50 cursor-pointer border-b"
              >
                <td className="px-4 py-2">{startIdx + idx + 1}</td>  {/* 📄[페이지 기능] 표시 순번 */}
                <td className="px-4 py-2">{m.memberId}</td>
                <td className="px-4 py-2">{m.memberName}</td>
                <td className="px-4 py-2">
                  {m.memberRole === "user"
                    ? "회원"
                    : m.adminType || "관리자"}
                </td>
                <td className="px-4 py-2">{m.memberMobile}</td>
                <td className="px-4 py-2">{m.memberJoindate?.substring(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 📄[페이지 기능] 하단 페이지 이동 */}
      <div className="flex justify-center items-center mt-4 space-x-2">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          이전
        </button>
        <span>
          {page} / {Math.ceil(totalCount / size)} 페이지
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= Math.ceil(totalCount / size)}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </div>
  );
}
