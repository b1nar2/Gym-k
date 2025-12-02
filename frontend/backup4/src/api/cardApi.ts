// [1] axios 불러오기
import api from "./axios";

// [2] 카드 타입 정의
export interface Card {
  cardId: number;     // 카드 PK
  cardBank: string; // 카드사명
  cardNumber: string;  // 카드번호 (마스킹 필요)
  cardMain: "Y" | "N"; // 대표카드 여부
}

// [3] 카드 목록 API (로그인한 사용자 본인 카드만 반환)
/*
export async function fetchCards(): Promise<Card[]> {
  const res = await api.get("/api/cards"); // 백엔드 UserCardController GET 매핑 기준
  return res.data.data;
}
*/
export async function fetchCards(memberId: string): Promise<Card[]> {
  const response = await api.get(`/api/members/${memberId}/cards`);
  return response.data.data;
}