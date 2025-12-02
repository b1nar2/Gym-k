import api from "./axios"; // [1] axios 인스턴스 import (공통 API 설정)

// [2] 시설 목록 조회 API
export const fetchFacilities = async (params: {
  name?: string;        // 시설명 검색 키워드
  facilityType?: string; // 시설 종류
  page?: number;        // 페이지 번호
  size?: number;        // 페이지 크기
  facilityUse?: boolean;
}) => {
  // [3] GET 요청: 서버의 /api/facilities/list 엔드포인트 호출
  const res = await api.get("/api/facilities/list", { params });
  console.log("시설목록조회 total: ",res); // 서버 응답 확인 로그
  return res.data.data; // [4] 실제 응답 데이터 반환 (items, total, page, size)
};

// [5] 시설 단건 조회 API
export const fetchFacilityById = async (facilityId: number) => {
  // [6] GET 요청: 서버의 /api/facilities/{id} 엔드포인트 호출
  const res = await api.get(`/api/facilities/${facilityId}`);
  return res.data.data; // [7] 단건 FacilityResponse 객체 반환
};
