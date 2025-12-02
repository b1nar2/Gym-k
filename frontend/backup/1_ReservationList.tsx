import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../../context/AuthContext";


// 재사용 가능한 버튼 컴포넌트 타입 및 구현
type ButtonSize = "sm" | "md" | "lg";
type ButtonVariant = "primary" | "neutral" | "danger" | "outline";

type ButtonProps = {
  onClick: () => void;
  label: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  className?: string;
  disabled?: boolean;
};
function Button({ onClick, label, size = "md", variant = "neutral", className = "", disabled = false }: ButtonProps) {
  const cls = ["btn", `btn-${variant}`, `btn-${size}`, className].filter(Boolean).join(" ");
  return (
    <button className={cls} onClick={onClick} type="button" disabled={disabled}>
      {label}
    </button>
  );
}


// 검색창 컴포넌트 타입 및 구현
type SearchBarProps = {
  keyword: string;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
};
function SearchBar({ keyword, onKeywordChange, onSearch, placeholder = "검색어를 입력하세요" }: SearchBarProps) {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onKeywordChange(e.target.value);
  };
  const onkeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSearch();
  };
  return (
    <div className="search-bar">
      <input type="text" placeholder={placeholder} value={keyword} onChange={onChange} onKeyDown={onkeydown} />
      <Button onClick={onSearch} label="검색" />
    </div>
  );
}


// 페이지네이션 컴포넌트 타입 및 구현
type PaginationProps = {
  pageIndex: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};
function Pagination({ pageIndex, totalPages, onPageChange }: PaginationProps) {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);
  return (
    <div className="pagination">
      <Button onClick={() => onPageChange(pageIndex - 1)} label="이전" disabled={pageIndex === 1} variant="outline" />
      {pages.map((page) => (
        <Button key={page} onClick={() => onPageChange(page)} label={page.toString()} variant={page === pageIndex ? "primary" : "neutral"} />
      ))}
      <Button onClick={() => onPageChange(pageIndex + 1)} label="다음" disabled={pageIndex === totalPages} variant="outline" />
    </div>
  );
}


// 예약 데이터 타입 정의
export type ReservationRow = {
  resvId: number;
  memberLogin: string;
  memberName: string;
  facilityName: string;
  useDate: string;
  timeRange: string;
  requestedAt: string;
  amount: number;
  payMethod: "카드" | "계좌";
  status: "승인" | "취소" | "완료" | "대기";
};


// 시설 데이터 타입 정의
type Facility = {
  id: number;
  name: string;
};


// 회원 데이터 타입 예시 (필요 시 맞게 조정)
type MemberRow = {
  id: number;
  memberLogin: string;
  memberName: string;
};


// 예약 API 호출 함수
const ReservationsAPI = {
  // 예약 리스트 가져오기 (필터 가능)
  list: async (params?: { keyword?: string; facilityType?: string }) => {
    const response = await axios.get("/api/reservations", { params });
    return response.data;
  },
  // 예약 취소
  cancel: async (resvId: number) => {
    await axios.post(`/api/reservations/${resvId}/cancel`);
  },
  // 예약 완료
  complete: async (resvId: number) => {
    await axios.post(`/api/reservations/${resvId}/complete`);
  },
};


// 시설 API 호출 함수
console.log("FacilitesAPI")
const FacilitiesAPI = {
  list: async () => {
    const response = await axios.get("/api/facilities");
    return response.data;
  },
};


// 회원정보 API 호출 함수
const MembersAPI = {
  list: async () => {
    const response = await axios.get("/api/cms/members");
    return response.data;
  },
};


// 예약 리스트 페이지 컴포넌트
function ReservationList() {
  // 인증 상태 컨텍스트 가져오기
  const authContext = useContext(AuthContext);
  if (!authContext) return <p>로딩 중...</p>;

  // 예약 데이터 상태 (예약 데이터 전용)
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  // 회원 데이터 상태 (회원 데이터 전용)
  const [members, setMembers] = useState<MemberRow[]>([]);
  // 검색어 상태
  const [keyword, setKeyword] = useState("");
  // 로딩 상태
  const [loading, setLoading] = useState(false);
  // 에러 메시지 상태
  const [error, setError] = useState<string | null>(null);
  // 현재 페이지 인덱스
  const [pageIndex, setPageIndex] = useState(1);
  // 페이지당 표시할 데이터 수
  const [pageSize] = useState(10);
  // 현재 선택된 시설 탭 이름
  const [facilityTab, setFacilityTab] = useState<string>("");
  // 시설 목록 상태
  const [facilities, setFacilities] = useState<Facility[]>([]);

  // 페이지 이동용 navigate 함수
  const navigate = useNavigate();

  // 시설 목록 가져오기 함수
  const fetchFacilities = async () => {
    try {
      const data = await FacilitiesAPI.list();
      if (Array.isArray(data)) {
        setFacilities(data);
        if (data.length > 0) setFacilityTab(data[0].name);
        else setFacilityTab("신청인"); // 시설이 없으면 기본 탭 신청인으로 설정
      }
    } catch {
      setFacilities([]);
      setFacilityTab("신청인");
    }
  };

  // 예약 리스트 가져오기 함수
  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { keyword?: string; facilityType?: string } = {};
      if (keyword) params.keyword = keyword;
      if (facilityTab !== "신청인" && facilityTab) params.facilityType = facilityTab;

      const data = await ReservationsAPI.list(params);
      if (!Array.isArray(data)) throw new Error("예약 리스트가 배열이 아닙니다.");
      setReservations(data);
      setPageIndex(1);
    } catch {
      setReservations([]);
      setError("예약 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 회원 리스트 가져오기 함수 (facilityTab이 "신청인"일 때 호출)
  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await MembersAPI.list();
      setMembers(data);
      setPageIndex(1);
    } catch {
      setMembers([]);
      setError("회원 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 시설 목록 먼저 불러오기
  useEffect(() => {
    fetchFacilities();
  }, []);

  // 시설탭 변경 시 예약 또는 회원 리스트 불러오도록 분기 처리
  useEffect(() => {
    if (facilityTab === "신청인") {
      fetchMembers();
    } else {
      fetchList();
    }
  }, [facilityTab]);

  // 현재 탭에 따른 총 페이지 수 계산
  const totalPages =
    facilityTab === "신청인"
      ? Math.max(1, Math.ceil(members.length / pageSize))
      : Math.max(1, Math.ceil(reservations.length / pageSize));

  // 현재 페이지에 보여줄 예약 데이터 계산
  const pagedReservations = useMemo(() => {
    return reservations.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);
  }, [reservations, pageIndex, pageSize]);

  // 현재 페이지에 보여줄 회원 데이터 계산
  const pagedMembers = useMemo(() => {
    return members.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);
  }, [members, pageIndex, pageSize]);

  // 예약 취소 처리 및 리스트 갱신
  const onCancel = async (row: ReservationRow) => {
    await ReservationsAPI.cancel(row.resvId);
    fetchList();
  };

  // 예약 완료 처리 및 리스트 갱신
  const onComplete = async (row: ReservationRow) => {
    await ReservationsAPI.complete(row.resvId);
    fetchList();
  };

  // 회원 상세 페이지 이동
  const onViewMember = (login: string) => navigate(`/CMS/members/${login}`);

  // JSX 렌더링
  return (
    <div className="cms-reservation-status">
      <h2>신청 현황</h2>

      {/* 시설별 탭 UI */}
      <div className="facility-tabs">
        {facilities.map((facility) => (
          <button
            key={facility.id}
            type="button"
            className={facilityTab === facility.name ? "tab active" : "tab"}
            onClick={() => setFacilityTab(facility.name)}
          >
            {facility.name}
          </button>
        ))}
        <button
          type="button"
          className={facilityTab === "신청인" ? "tab active" : "tab"}
          onClick={() => setFacilityTab("신청인")}
        >
          신청인
        </button>
      </div>

      {/* 검색창 */}
      <SearchBar
        keyword={keyword}
        onKeywordChange={setKeyword}
        onSearch={facilityTab === "신청인" ? fetchMembers : fetchList} // 탭별 검색시 함수 호출 분기
      />

      {/* 총 데이터 개수 표시 */}
      <p>총 {facilityTab === "신청인" ? members.length : reservations.length}개</p>

      {/* 로딩 상태 및 에러 메시지 */}
      {loading && <p>로딩 중...</p>}
      {error && <p className="error">{error}</p>}

      {/* 탭에 따른 데이터 렌더링 분기 */}
      {facilityTab === "신청인" ? (
        // 회원 목록 UI (간단 리스트 형태)
        <ul className="member-list">
          {pagedMembers.map((member) => (
            <li key={member.id ?? member.memberLogin}>
              <button className="link-btn" type="button" onClick={() => onViewMember(member.memberLogin ?? "")}>
                {member.memberName ?? member.memberLogin}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        // 예약 목록 테이블 UI
        <table className="reservation-table">
          <thead>
            <tr>
              <th>신청번호</th>
              <th>신청인(아이디)</th>
              <th>신청인(이름)</th>
              <th>시설명</th>
              <th>이용일</th>
              <th>이용시간대</th>
              <th>신청일</th>
              <th>금액</th>
              <th>결제수단</th>
              <th>신청상태</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {pagedReservations.map((r) => (
              <tr key={r.resvId}>
                <td>{r.resvId}</td>
                <td>
                  <button className="link-btn" type="button" onClick={() => onViewMember(r.memberLogin)}>
                    {r.memberLogin}
                  </button>
                </td>
                <td>{r.memberName}</td>
                <td>{r.facilityName}</td>
                <td>{r.useDate}</td>
                <td>{r.timeRange}</td>
                <td>{r.requestedAt}</td>
                <td>{r.amount.toLocaleString()}</td>
                <td>{r.payMethod}</td>
                <td>{r.status}</td>
                <td>
                  {r.status !== "완료" && (
                    <Button label="완료" variant="primary" size="sm" onClick={() => onComplete(r)} />
                  )}
                  {r.status !== "취소" && (
                    <Button label="취소" variant="danger" size="sm" onClick={() => onCancel(r)} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 페이지 네비게이션 */}
      <Pagination pageIndex={pageIndex} totalPages={totalPages} onPageChange={setPageIndex} />
    </div>
  );
}

export default ReservationList;
