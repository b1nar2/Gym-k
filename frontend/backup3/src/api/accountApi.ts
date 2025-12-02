// [1] axios 불러오기
import api from "./axios";

// [2] 계좌 타입 정의
export interface Account {
  accountId: number; // 계좌 PK
  accountBank: string; // 은행명
  accountNumber: string; // 계좌번호 (마스킹 필요)
  accountMain: "Y" | "N";  // 메인계좌 정보
}

// [3] 계좌 목록 API (로그인한 사용자 본인 계좌만 반환)
/*
export async function fetchAccounts(): Promise<Account[]> {
  const res = await api.get("/api/accounts"); // 백엔드 UserAccountController GET 매핑 기준
  return res.data.data; // ApiResponse<List<AccountResponse>> 구조 → .data.data
}
*/
// 로그인한 회원의 계좌 목록 조회
export async function fetchAccounts(memberId: string): Promise<Account[]> {
  const response = await api.get(`/api/members/${memberId}/accounts`);
  return response.data.data; 
} 