// [1] axios 인스턴스 불러오기
import api from "./axios"; // [1-1] baseURL, 토큰 헤더가 이미 세팅된 axios 인스턴스

// [2] 예약 등록 요청 타입 정의
export interface ReservationCreateRequest {
  facilityId: number;       // [2-1] 시설ID (필수)
  resvContent?: string;     // [2-2] 요구사항 (선택)
  wantDate: string;         // [2-3] 신청일 (yyyy-MM-dd)
  resvPersonCount: number;  // [2-4] 신청 인원수
  startHour: string;        // [2-5] 시작 시각 (예: "09")
  endHour: string;          // [2-6] 종료 시각 (예: "11")
}

// [3] 예약 등록 API 호출 함수
export async function createReservation(
  request: ReservationCreateRequest
): Promise<number> {
  // [3-1] 백엔드 컨트롤러(UserReservationController) 규격에 따라
  //       application/x-www-form-urlencoded 방식으로 전송해야 함
  const params = new URLSearchParams();
  params.append("facilityId", String(request.facilityId));
  if (request.resvContent) params.append("resvContent", request.resvContent);
  params.append("wantDate", request.wantDate);
  params.append("resvPersonCount", String(request.resvPersonCount));
  params.append("startHour", request.startHour);
  params.append("endHour", request.endHour);

  // [3-2] POST 호출 → PK(resvId) 반환
  const res = await api.post("/api/reservations", params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  // [3-3] ApiResponse<Long> 형식이므로 data.data 로 접근
  return res.data.data as number;
}
