import api from "./axios";

// 메시지 데이터 타입 정의
export interface Message {
  messageId: number;
  memberId: string;
  memberName: string;
  resvId: number | null;
  closedId: number | null;
  messageType: string;
  messageContent: string;
  messageDate: string;
  readStatus?: 'Y' | 'N';
}

// 특정 회원의 최근 메시지 목록 조회
export async function fetchMessages(memberId: string, limit: number = 5): Promise<Message[]> {
  const response = await api.get("/api/messages/member", { params: { memberId, limit } });
  return response.data;
}

// 특정 회원의 읽지 않은 메시지 개수 조회
export async function fetchUnreadCount(memberId: string): Promise<number> {
  const response = await api.get("/api/messages/unreadCount", { params: { memberId } });
  return response.data;
}

// 메시지 읽음 처리 API 호출
export async function markMessageAsRead(messageId: number): Promise<void> {
  await api.post(`/api/messages/${messageId}/read`);
}
