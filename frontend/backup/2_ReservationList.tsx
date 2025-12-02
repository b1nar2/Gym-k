import { useEffect, useMemo, useState } from "react";
import api from "../src/api/axios";

// 예약 행 데이터 타입
type ReservationRow = {
  resvId: number;
  memberLogin: string;
  memberName: string;
  facilityName: string;
  useDate: string;
  timeRange: string;
  requestedAt: string;
  amount: number;
  payMethod: string;
  status: string;
};

function ReservationList() {
  const [tab, setTab] = useState<string>("신청인");
  const [keyword, setKeyword] = useState("");
  const [list, setList] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 5;

  // 인터셉터가 토큰 헤더 자동 추가하므로 직접 넣지 않음
useEffect(() => {
  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { tab, keyword, pageIndex, pageSize };
      const response = await api.get("/cms/reservations", { params });
      const data = response.data?.data ?? response.data;
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setList([]);
      setError("예약 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };
  fetchList();
}, [tab, keyword, pageIndex]);

  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));

  const pagedList = useMemo(() => {
    const start = (pageIndex - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [list, pageIndex]);

  return (
    <div>
      <h2>신청 현황</h2>

      <div style={{ display: "flex", marginBottom: "10px" }}>
        <button
          type="button"
          style={{
            padding: "8px 18px",
            marginRight: "4px",
            background: tab === "신청인" ? "#244785" : "#fff",
            color: tab === "신청인" ? "#fff" : "#333",
            border: "1px solid #ccc",
            borderRadius: "3px",
            fontWeight: tab === "신청인" ? "bold" : "normal",
          }}
          onClick={() => {
            setTab("신청인");
            setPageIndex(1);
          }}
        >
          신청인
        </button>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="검색어 입력"
          style={{ width: "200px", marginRight: "8px", padding: "6px" }}
        />
        <button onClick={() => setPageIndex(1)} style={{ padding: "6px 16px" }}>
          검색
        </button>
      </div>

      <div style={{ marginBottom: "10px", fontWeight: 600, color: "#888" }}>
        총 {list.length}건
      </div>

      {loading && <p>로딩 중...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "15px" }}>
        <thead>
          <tr style={{ background: "#f7f7f7" }}>
            <th>신청번호</th>
            <th>신청인(대표)</th>
            <th>신청인</th>
            <th>시설명</th>
            <th>이용일</th>
            <th>이용시간대</th>
            <th>신청일</th>
            <th>금액</th>
            <th>결제수단</th>
            <th>신청상태</th>
          </tr>
        </thead>
        <tbody>
          {pagedList.length === 0 ? (
            <tr>
              <td colSpan={10} style={{ textAlign: "center", color: "#aaa" }}>
                데이터가 없습니다.
              </td>
            </tr>
          ) : (
            pagedList.map((row) => (
              <tr key={row.resvId}>
                <td>{row.resvId}</td>
                <td>
                  <a href={`/user/${row.memberLogin}`} style={{ color: "#244785", textDecoration: "underline" }}>
                    {row.memberLogin}
                  </a>
                </td>
                <td>{row.memberName}</td>
                <td>{row.facilityName}</td>
                <td>{row.useDate}</td>
                <td>{row.timeRange}</td>
                <td>{row.requestedAt}</td>
                <td>{row.amount.toLocaleString()}원</td>
                <td>{row.payMethod}</td>
                <td>
                  {row.status === "취소" && <span style={{background: "#d22",color: "#fff",padding: "2px 8px",borderRadius: "3px"}}>취소처리</span>}
                  {row.status === "완료" && <span style={{background: "#888",color: "#fff",padding: "2px 8px",borderRadius: "3px"}}>완료</span>}
                  {row.status === "승인" && <span style={{background: "#2b7",color: "#fff",padding: "2px 8px",borderRadius: "3px"}}>승인</span>}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div style={{ textAlign: "center", margin: "22px" }}>
        <button onClick={() => setPageIndex((v) => Math.max(1, v - 1))} disabled={pageIndex <= 1} style={{ marginRight: 8 }}>
          &lt;
        </button>
        <span style={{ fontWeight: 600, margin: "0 10px" }}>{pageIndex}</span>
        <button onClick={() => setPageIndex((v) => Math.min(totalPages, v + 1))} disabled={pageIndex >= totalPages} style={{ marginLeft: 8 }}>
          &gt;
        </button>
      </div>
    </div>
  );
}

export default ReservationList;
