//! [0] CMS 홈 대시보드 컴포넌트
//! - 전체 통계(회원, 시설, 게시글, 예약 등) 및 시설별 예약 상태를 시각화

import React, { useEffect, useState } from "react"; // React에서 컴포넌트를 만들고 상태관리(useState), 생명주기(useEffect) 기능을 불러옴
import api from "../../api/axiosCms"; // CMS 전용 axios 인스턴스를 불러옴 (토큰 자동 포함됨)
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, Tooltip, Legend } from "recharts"; // Recharts: 막대그래프, 원형그래프 시각화용 라이브러리
import "../../css/cms/cmsDashboard.css"; // Codersbite 기반 대시보드 스타일 (main__cards, charts__left/right 등 클래스 정의됨)

// [1] CMS 전체 통계 데이터 구조 정의
interface CmsStatsResponse {
  memberCount: number; // 회원 수
  facilityCount: number; // 시설 수
  postCount: number; // 게시글 수
  contentCount: number; // 콘텐츠 수
  reservationCount: number; // 예약 전체 건수
  reservationDoneCount: number; // 완료된 예약 수
  reservationPendingCount: number; // 대기 중 예약 수
  reservationCancelCount: number; // 취소된 예약 수
}

// [2] 시설별 등록 현황 데이터 구조 정의
interface FacilityStats {
  facilityType: string; // 시설 이름 (ex: 수영장, 농구장)
  facilityCount: number; // 시설 개수
}

// [3] 시설별 예약 상태 비율 데이터 구조 정의
interface FacilityStatusStats {
  facilityType: string; // 시설 이름
  resvStatus: string; // 예약 상태명 (완료/대기/취소)
  cnt: number; // 상태별 예약 건수
}

// [4] CmsHome 컴포넌트 선언
export default function CmsHome() {
  // [5] CMS 전체 통계(state) 초기화 — 서버에서 데이터를 가져오기 전 기본값은 0으로 설정
  const [stats, setStats] = useState<CmsStatsResponse>({
    memberCount: 0, // 초기 회원 수
    facilityCount: 0, // 초기 시설 수
    postCount: 0, // 초기 게시글 수
    contentCount: 0, // 초기 콘텐츠 수
    reservationCount: 0, // 초기 예약 수
    reservationDoneCount: 0, // 초기 완료 예약 수
    reservationPendingCount: 0, // 초기 대기 예약 수
    reservationCancelCount: 0, // 초기 취소 예약 수
  });

  // [6] 시설별 등록 현황 데이터(state)
  const [facilityStats, setFacilityStats] = useState<FacilityStats[]>([]);

  // [7] 시설별 예약 상태 비율(state)
  const [facilityStatusStats, setFacilityStatusStats] = useState<FacilityStatusStats[]>([]);

  // [8] 컴포넌트가 처음 화면에 렌더링될 때 실행 (한 번만 실행됨)
  useEffect(() => {
    // [8-1] CMS 전체 통계 데이터 요청
    api.get("/api/cms/stats").then((res) => {
      const d = res.data || {}; // 응답이 없을 경우 안전하게 빈 객체로 처리
      setStats({
        memberCount: d.memberCount ?? d.MEMBERCOUNT ?? 0, // null 또는 undefined일 경우 0으로 처리
        facilityCount: d.facilityCount ?? d.FACILITYCOUNT ?? 0,
        postCount: d.postCount ?? d.POSTCOUNT ?? 0,
        contentCount: d.contentCount ?? d.CONTENTCOUNT ?? 0,
        reservationCount: d.reservationCount ?? d.RESERVATIONCOUNT ?? 0,
        reservationDoneCount: d.reservationDoneCount ?? d.RESERVATIONDONECOUNT ?? 0,
        reservationPendingCount: d.reservationPendingCount ?? d.RESERVATIONPENDINGCOUNT ?? 0,
        reservationCancelCount: d.reservationCancelCount ?? d.RESERVATIONCANCELCOUNT ?? 0,
      });
    });

    // [8-2] 시설별 등록 현황 요청
    api.get("/api/cms/stats/facilities").then((res) => {
      const mapped = res.data.map((f: any) => ({
        facilityType: f.facilityType ?? f.FACILITYTYPE, // DB 컬럼 대소문자 모두 대응
        facilityCount: f.facilityCount ?? f.FACILITYCOUNT,
      }));
      setFacilityStats(mapped); // 결과를 상태에 반영
    });

    // [8-3] 시설별 예약 상태 비율 요청
    api.get("/api/cms/dashboard/facility-status").then((res) => {
      const mapped = res.data
        .map((f: any) => [
          { facilityType: f.facilityType ?? f.FACILITYTYPE, resvStatus: "완료", cnt: f.doneCount ?? f.DONECOUNT },
          { facilityType: f.facilityType ?? f.FACILITYTYPE, resvStatus: "대기", cnt: f.pendingCount ?? f.PENDINGCOUNT },
          { facilityType: f.facilityType ?? f.FACILITYTYPE, resvStatus: "취소", cnt: f.cancelCount ?? f.CANCELCOUNT },
        ])
        .flat(); // 중첩된 배열을 평평하게 만듦
      setFacilityStatusStats(mapped); // 상태 반영
    });
  }, []); // 의존성 배열을 비워서 컴포넌트 마운트 시 한 번만 실행

  // [9] 막대그래프용 데이터 구성 
  // * ----------- [251021] 시설별 총 신청수 그래프 데이터로 변경 -----------
  /*const barData = [
    { name: "회원", value: stats.memberCount },
    { name: "시설", value: stats.facilityCount },
    { name: "게시글", value: stats.postCount },
    { name: "콘텐츠", value: stats.contentCount },
  ];*/
  const facilityTotalData = ["수영장", "농구장", "풋살장", "배드민턴장", "볼링장"].map((type) => {
    const total = facilityStatusStats
      .filter((d) => d.facilityType === type)
      .reduce((sum, d) => sum + d.cnt, 0);
    return { name: type, value: total };
  });
  // * ----------- [251021] 시설별 총 신청수 그래프 데이터로 변경 -----------

  // [10] 전체 예약 상태별 원형그래프 데이터 구성
  const pieData = [
    { name: "완료", value: stats.reservationDoneCount },
    { name: "대기", value: stats.reservationPendingCount },
    { name: "취소", value: stats.reservationCancelCount },
  ];

  // [11] 색상 배열 정의 (파랑: 완료 / 노랑: 대기 / 빨강: 취소)
  const COLORS = ["#2563EB", "#FBBF24", "#EF4444"];

  // [12] 화면 렌더링 시작
  return (
    <div className="main__container"> {/* Codersbite 레이아웃 wrapper */}

      {/* [13] 상단 인사 및 제목 영역 */}
      <div className="main__title">
        
        <div className="main__greeting">
          
          <p>현재 시스템 주요 현황을 확인하세요.</p> {/* 설명문 */}
        </div>
      </div>

      {/* [14] 통계 카드 영역 */}
      <div className="main__cards">
        {/* 회원수 카드 */}
        <div className="card">
          <i className="fa fa-user-o fa-2x text-lightblue"></i> {/* 사용자 아이콘 */}
          <div className="card_inner">
            <p className="text-primary-p">회원 수</p> {/* 카드 제목 */}
            <span className="font-bold text-title">{stats.memberCount}</span> {/* 수치 표시 */}
          </div>
        </div>

        {/* 시설수 카드 */}
        <div className="card">
          <i className="fa fa-building-o fa-2x text-red"></i> {/* 건물 아이콘 */}
          <div className="card_inner">
            <p className="text-primary-p">시설 수</p>
            <span className="font-bold text-title">{stats.facilityCount}</span>
          </div>
        </div>

        {/* 게시글 카드 */}
        <div className="card">
          <i className="fa fa-archive fa-2x text-yellow"></i> {/* 게시글 아이콘 */}
          <div className="card_inner">
            <p className="text-primary-p">게시글 수</p>
            <span className="font-bold text-title">{stats.postCount}</span>
          </div>
        </div>

        {/* 예약 카드 */}
        <div className="card">
          <i className="fa fa-calendar fa-2x text-green"></i> {/* 달력 아이콘 */}
          <div className="card_inner">
            <p className="text-primary-p">예약 수</p>
            <span className="font-bold text-title">{stats.reservationCount}</span>
          </div>
        </div>
      </div>

      {/* [15] 그래프 영역 시작 */}
      <div className="charts">

        {/* 왼쪽: 막대그래프 */}
        <div className="charts__left">
          <div className="charts__left__title">
            <div>
              <h1>운영 항목별 현황</h1>
              <p>시스템 주요 자원별 건수</p>
            </div>
            <i className="fa fa-bar-chart"></i> {/* 그래프 아이콘 */}
          </div>

          {/* 막대그래프 (회원/시설/게시글/콘텐츠) */}
          {/* <BarChart width={400} height={250} data={barData}> */}
          <BarChart width={400} height={250} data={facilityTotalData}> {/* //* [251021] 시설별 총 신청수 그래프 데이터 사용 */}
            <XAxis dataKey="name" /> {/* X축: 항목 이름 */}
            <YAxis /> {/* Y축: 건수 */}
            <Tooltip formatter={(v) => `${v}건`} /> {/* 마우스 오버 시 건수 표시 */}
            <Bar dataKey="value" fill="#2563EB" radius={[5, 5, 0, 0]} /> {/* 파란 막대 */}
          </BarChart>
        </div>

        {/* 오른쪽: 전체 예약 상태별 원형그래프 */}
        <div className="charts__right">
          <div className="charts__right__title">
            <div>
              <h1>전체 예약 상태 비율</h1>
              <p>완료 / 대기 / 취소 비율</p>
            </div>
            <i className="fa fa-pie-chart"></i> {/* 파이차트 아이콘 */}
          </div>

          {/* 원형그래프 */}
          <PieChart width={350} height={250}>
            <Pie
              data={pieData} // 원형그래프 데이터
              cx="50%" // 중심 X좌표
              cy="50%" // 중심 Y좌표
              outerRadius={80} // 반지름
              dataKey="value" // 값 필드
              label={(props: any) => { // 타입 오류 방지를 위해 any 사용
                const { name, percent } = props; // name: 상태명, percent: 비율(0~1)
                const ratio = percent ? (percent * 100).toFixed(0) : "0"; // 비율 계산
                return `${name} ${ratio}%`; // ex) 완료 60%
              }}
            >
              {pieData.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} /> // 색상 순환 적용
              ))}
            </Pie>
            <Tooltip formatter={(v) => `${v}건`} /> {/* 마우스 오버 시 n건 표시 */}
            <Legend verticalAlign="bottom" /> {/* 하단 범례 표시 */}
          </PieChart>
        </div>
      </div>

      {/* [16] 시설별 예약 상태 비율 (5개 원형그래프) */}
      <div className="charts__right" style={{ marginTop: "50px" }}>
        <div className="charts__right__title">
          <div>
            <h1>시설별 예약 상태 비율</h1>
            <p>시설별 완료/대기/취소 비율</p>
          </div>
          <i className="fa fa-line-chart"></i> {/* 라인차트 아이콘 */}
        </div>

        {/* 시설별 개별 원형그래프 반복 출력 */}
        <div className="charts__right__cards">
          {["수영장", "농구장", "풋살장", "배드민턴장", "볼링장"].map((type) => {
            const data = facilityStatusStats
              .filter((d) => d.facilityType === type) // 시설 이름 일치 항목만 추출
              .map((d) => ({ name: d.resvStatus, value: d.cnt })); // 상태명 + 건수 구성
            const total = data.reduce((a, b) => a + b.value, 0); // 총합 계산

            return (
              <div key={type} className="card4"> {/* 개별 그래프 카드 */}
                <PieChart width={180} height={180}> {/* 그래프 크기 지정 */}
                  <Pie
                    data={data} // 시설별 상태 데이터
                    cx="50%" // 중심 X
                    cy="50%" // 중심 Y
                    outerRadius={60} // 반지름
                    dataKey="value" // 값 필드
                    /*label={(props: any) => { // 비율 라벨 표시
                      const { name, percent } = props;
                      const ratio = percent ? (percent * 100).toFixed(0) : "0";
                      return `${name} ${ratio}%`;
                    }}*/
                   label={false} // ✅ [251021] 시설별 그래프의 완료/대기/취소 텍스트 제거
                  >
                    {data.map((entry, i) => (
                      <Cell
                        key={`cell-${i}`} // 고유 키
                        fill={
                          entry.name === "완료"
                            ? "#2563EB" // 파랑
                            : entry.name === "대기"
                            ? "#FBBF24" // 노랑
                            : "#EF4444" // 빨강
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number, name: string) => {
                      const percent = total ? ((v / total) * 100).toFixed(1) : "0"; // (값 ÷ 총합)×100
                      return [`${v}건 (${percent}%)`, name]; // 예: "5건 (25%)"
                    }}
                  />
                </PieChart>
                <h1>{type}</h1> {/* 시설명 표시 */}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
