// [1] axios 불러오기
import api from "./axios"; // [1-1] 공통 axios 인스턴스 (baseURL, 토큰 자동 설정 포함)

// [2] 결제 요청에 필요한 데이터 구조 정의 (프론트 → 백엔드 전송 DTO)
export interface PaymentRequest {
  resvId: number;             // [2-1] 예약 ID (PK, 결제는 특정 예약에 연결됨)
  paymentMethod: string;      // [2-2] 결제 방식 ('계좌' 또는 '카드')
  accountId?: number;         // [2-3] 계좌 결제 시 필요 (카드면 null)
  cardId?: number;            // [2-4] 카드 결제 시 필요 (계좌면 null)
  cardInstallment?: number;   //![2-5] ✅ [251004] 카드 할부 기능 추가
}

// [3] 결제 응답 데이터 구조 정의 (백엔드 → 프론트 반환 DTO)
export interface PaymentResponse {
  paymentId: number;          // [3-1] 생성된 결제 PK (시퀀스 값)
  paymentStatus: string;      // [3-2] 결제 상태 ('예약','완료','취소')
  paymentMoney: number;       // [3-3] 최종 결제 금액 (서버 계산 결과)
  paymentMethod: string;      // [3-4] 결제 방식 ('계좌' 또는 '카드')
  resvId: number;             // [3-5] 연결된 예약 ID
}

//! [카드/계좌 목록] ----------------------------------------------------------
// 계좌 목록 조회
export async function fetchAccounts(memberId: string) {
  const response = await api.get(`/api/members/${memberId}/accounts`);
  return response.data.data; // ApiResponse<List<AccountResponse>>
}

// 카드 목록 조회
export async function fetchCards(memberId: string) {
  const response = await api.get(`/api/members/${memberId}/cards`);
  return response.data.data; // ApiResponse<List<CardResponse>>
}
//! --------------------------------------------------------------------------

// [4] 결제 등록 API 함수
// ⚠️ 백엔드 UserPaymentController는 @RequestParam 방식만 허용하기 때문에
//    반드시 application/x-www-form-urlencoded 형식으로 보내야 함
export async function createPayment(data: PaymentRequest): Promise<PaymentResponse> {
  console.log("[paymentApi] 결제 요청 데이터:", data); // [4-1] 요청 전 데이터 확인 (디버깅용 로그)

  // [4-2] axios.post 호출
  const response = await api.post<PaymentResponse>(
    "/api/payments", // [4-2-1] 요청 경로 (백엔드 UserPaymentController @PostMapping("/api/payments"))

    // [4-2-2] new URLSearchParams() → JSON 객체를 폼 데이터로 변환
    //         Form 방식 전송 시 key=value&key=value... 형태가 됨
    new URLSearchParams({
      resvId: String(data.resvId),                 // 예약 ID (필수)
      paymentMethod: data.paymentMethod,           // 결제수단 (필수, '계좌'/'카드')
      accountId: data.accountId ? String(data.accountId) : "", // 계좌일 때만 값 전달
      cardId: data.cardId ? String(data.cardId) : "",           // 카드일 때만 값 전달
      cardInstallment: String(data.cardInstallment ?? 0), //! ✅ 카드 할부 기본값 0(일시불)
    }),

    // [4-2-3] axios 옵션: Content-Type을 form-urlencoded로 강제 지정
    // ⚠️ axios.ts 기본값은 application/json → 여기서는 오버라이드 필요
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  console.log("[paymentApi] 서버 응답:", response.data); // [4-3] 서버 응답 확인 (디버깅용 로그)
  return response.data; // [4-4] PaymentResponse 타입 데이터 반환
}
