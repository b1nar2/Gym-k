//! [파일명] CmsReservation.tsx
//! [설명] CMS 신청현황 관리 화면 (책임자/관리자 전용)
//! [작성일] [251009]
//! [기능] 승인(✅), 취소(❌), 시설 필터(🏛️), 요청일·희망일 필터(📆), 검색(🔍), 페이징(📄)

import React, { useEffect, useState } from "react"; // [1] React 핵심 훅
import api from "../../../api/axiosCms"; // [2] CMS 전용 Axios 인스턴스 (CMS 토큰 자동 포함)
import { useNavigate } from "react-router-dom"; // [3] 페이지 이동용 훅

// [4] 예약 데이터 구조 정의 (서버 응답 DTO 기준)
interface Reservation {
    resvId: number; // 예약 ID (PK)
    memberId: string; // 회원ID
    memberName: string; // 회원 이름
    facilityName: string; // 시설명
    resvStatus: string; // 예약 상태(대기/완료/취소)
    wantDate: string;   // 📆 희망일(이용일)
    resvDate: string;   // 📆 요청일(신청일)
    resvStartTime: string;
    resvEndTime: string;
}

// [5] 메인 컴포넌트
export default function CmsReservation() {
    const navigate = useNavigate();

    // [6] 상태(state)
    const [list, setList] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [facilityFilter, setFacilityFilter] = useState(""); // 🏛️ 시설 필터

    // 📆 요청일(신청일)
    const [resvStartDate, setResvStartDate] = useState("");
    const [resvEndDate, setResvEndDate] = useState("");

    // 📆 희망일(이용일)
    const [wantStartDate, setWantStartDate] = useState("");
    const [wantEndDate, setWantEndDate] = useState("");

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchType, setSearchType] = useState("facilityName");
    const [keyword, setKeyword] = useState("");

    // ! [251009]시간만 추출하는 함수
    // ! 예: "2025-10-09T09:00:00" → "09:00"
    const formatTime = (datetime: string): string => {
    if (!datetime) return "";
    const date = new Date(datetime);
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
    };

    // [7] 예약 목록 불러오기
    const fetchReservations = async () => {
        try {
            setLoading(true);
            const res = await api.get("/cms/reservations", {
                params: {
                    facilityType: facilityFilter || undefined, // 🏛️ 시설 필터
                    resvStartDate: resvStartDate || undefined, // 📆 요청일 시작
                    resvEndDate: resvEndDate || undefined,     // 📆 요청일 종료
                    searchType: searchType || undefined,       // 🔍 검색 기준
                    keyword: keyword || undefined,             // 🔍 검색어
                    page: page - 1,
                    size: 20,
                },
            });

            console.log("📦 예약목록 응답:", res.data);
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

    // [8] useEffect — 필터 변경 시 자동 새로고침
    useEffect(() => {
        fetchReservations();
    }, [facilityFilter, resvStartDate, resvEndDate, wantStartDate, wantEndDate, page]);

    // [9] 🔍 검색 버튼
    const handleSearch = () => {
        setPage(1);
        fetchReservations();
    };

    // [10] 신청인 클릭 → 회원 수정 이동
    const handleRowClick = (id: string) => {
        navigate(`/cms/user/form?edit=${id}`);
    };

    // [11] ✅ 승인 처리
    const handleApprove = async (resvId: number) => {
        try {
            const form = new URLSearchParams();
            form.append("resvStatus", "완료");
            await api.post(`/cms/reservations/${resvId}/status`, form, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });
            alert("예약이 승인되었습니다.");
            fetchReservations();
        } catch (err) {
            console.error("승인 처리 실패:", err);
        }
    };

    // [12] ❌ 취소 처리
    const handleCancel = async (resvId: number) => {
        try {
            const form = new URLSearchParams();
            form.append("resvStatus", "취소");
            await api.post(`/cms/reservations/${resvId}/status`, form, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });
            alert("예약이 취소되었습니다.");
            fetchReservations();
        } catch (err) {
            console.error("취소 처리 실패:", err);
        }
    };

    // [13] 렌더링
    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">신청 현황 관리</h2>

            {/* [13-1] 필터 영역 */}
            <div className="flex flex-wrap justify-between items-center mb-4">
                <div className="flex flex-wrap items-center gap-2">
                    {/* 🏛️ 시설 필터 */}
                    <select
                        className="border p-2 rounded"
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

                    {/* 📆 요청일(신청일) 필터 */}
                    <label className="ml-2 text-sm text-gray-700">요청일</label>
                    <input
                        type="date"
                        className="border p-2 rounded"
                        value={resvStartDate}
                        onChange={(e) => setResvStartDate(e.target.value)}
                    />
                    <span>~</span>
                    <input
                        type="date"
                        className="border p-2 rounded"
                        value={resvEndDate}
                        onChange={(e) => setResvEndDate(e.target.value)}
                    />

                    {/* 📆 희망일(이용일) 필터 */}
                    <label className="ml-2 text-sm text-gray-700">희망일</label>
                    <input
                        type="date"
                        className="border p-2 rounded"
                        value={wantStartDate}
                        onChange={(e) => setWantStartDate(e.target.value)}
                    />
                    <span>~</span>
                    <input
                        type="date"
                        className="border p-2 rounded"
                        value={wantEndDate}
                        onChange={(e) => setWantEndDate(e.target.value)}
                    />
                </div>

                {/* 🔍 검색 */}
                <div className="flex items-center gap-2">
                    <select
                        className="border p-2 rounded"
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                    >
                        <option value="memberId">회원ID</option>
                        <option value="memberName">회원명</option>
                        <option value="facilityName">시설명</option>
                    </select>

                    <input
                        type="text"
                        className="border p-2 rounded w-48"
                        placeholder="검색어를 입력하세요"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />

                    <button
                        onClick={handleSearch}
                        className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
                    >
                        검색
                    </button>
                </div>
            </div>

            {/* [13-2] 목록 테이블 */}
            {loading ? (
                <p>데이터 불러오는 중...</p>
            ) : (
                <table className="min-w-full border text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border p-2">신청ID</th>
                            <th className="border p-2">신청인(대표)</th>
                            <th className="border p-2">시설명</th>
                            <th className="border p-2">요청일</th>
                            <th className="border p-2">희망일</th>
                            <th className="border p-2">시작시간</th>
                            <th className="border p-2">종료시간</th>
                            <th className="border p-2">상태</th>
                            <th className="border p-2">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.length > 0 ? (
                            list.map((r) => (
                                <tr key={r.resvId} className="text-center hover:bg-gray-50">
                                    <td className="border p-2">{r.resvId}</td>
                                    <td
                                        className="border p-2 text-blue-600 cursor-pointer"
                                        onClick={() => handleRowClick(r.memberId)}
                                    >
                                        {r.memberName} ({r.memberId})
                                    </td>
                                    <td className="border p-2">{r.facilityName}</td>
                                    <td className="border p-2">{r.resvDate}</td>
                                    <td className="border p-2">{r.wantDate}</td>
                                    {/* <td className="border p-2">{r.resvStartTime}</td> */}
                                    <td className="border p-2">{formatTime(r.resvStartTime)}</td>{/*//! [251009]시간만 추출하는 함수 적용 */}
                                    {/* <td className="border p-2">{r.resvEndTime}</td> */}
                                    <td className="border p-2">{formatTime(r.resvEndTime)}</td>{/*//! [251009]시간만 추출하는 함수 적용 */}
                                    <td className="border p-2">{r.resvStatus}</td>
                                    <td className="border p-2 flex justify-center gap-2">
                                        <button
                                            className={`px-3 py-1 rounded ${
                                                r.resvStatus === "대기"
                                                    ? "bg-green-500 text-white hover:bg-green-600"
                                                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                                            }`}
                                            onClick={() => handleApprove(r.resvId)}
                                            disabled={r.resvStatus !== "대기"}
                                        >
                                            승인
                                        </button>
                                        <button
                                            className={`px-3 py-1 rounded ${
                                                r.resvStatus === "대기"
                                                    ? "bg-red-500 text-white hover:bg-red-600"
                                                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                                            }`}
                                            onClick={() => handleCancel(r.resvId)}
                                            disabled={r.resvStatus !== "대기"}
                                        >
                                            취소
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={9} className="border p-4 text-center text-gray-500">
                                    신청 내역이 없습니다.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}

            {/* [13-3] 📄 페이징 */}
            <div className="flex justify-center mt-4 gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                    <button
                        key={num}
                        className={`px-3 py-1 rounded ${
                            num === page ? "bg-blue-500 text-white" : "bg-gray-200"
                        }`}
                        onClick={() => setPage(num)}
                    >
                        {num}
                    </button>
                ))}
            </div>
        </div>
    );
}
