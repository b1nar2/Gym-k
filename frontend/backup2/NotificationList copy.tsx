import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

// 메시지 데이터 타입 정의, 읽음 여부 표시를 위한 readStatus 포함
interface Message {
  messageId: number;
  memberId: string;
  memberName: string;
  resvId: number | null;
  closedId: number | null;
  messageType: string;
  messageContent: string;
  messageDate: string;
  readStatus?: 'Y' | 'N'; // 메시지 읽음 상태(Y: 읽음, N: 안읽음)
}

// 알림 목록 컴포넌트에 전달될 props 타입
interface NotificationListProps {
  onClose?: () => void; // 알림창 닫기 등 선택적 콜백 함수
}

const NotificationList: React.FC<NotificationListProps> = ({ onClose }) => {
  // 알림 메시지 리스트 상태
  const [messages, setMessages] = useState<Message[]>([]);
  // 읽지 않은 메시지 개수를 저장하는 상태(알림 아이콘 뱃지용)
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // 로그인 사용자 정보 가져오기
  const { authState } = useAuth();
  const user = authState;
  // 페이지 이동용 내비게이트 함수
  const navigate = useNavigate();

  // 사용자 ID 변경 시 메시지 목록과 읽지 않은 개수 초기 조회
  useEffect(() => {
    async function fetchData() {
      try {
        // 백엔드 API에서 해당 회원 최근 5개 메시지 조회
        const resMessages = await api.get("/messages/member", {
          params: { memberId: user.memberId, limit: 5 },
        });
        setMessages(resMessages.data);

        // 백엔드 API에서 해당 회원 읽지 않은 메시지 개수 조회
        const resUnreadCount = await api.get("/messages/unreadCount", {
          params: { memberId: user.memberId },
        });
        setUnreadCount(resUnreadCount.data);
      } catch (error) {
        console.error("메시지 로드 실패", error);
      }
    }
    if (user?.memberId) fetchData();
  }, [user?.memberId]);

  // 알림 클릭 시 호출되는 함수, 메시지 읽음 처리 및 상태 업데이트
  const markAsRead = async (messageId: number, resvId: number | null) => {
    try {
      // 읽음 처리 API 호출 (서버에 읽음 상태 저장)
      await api.post(`/messages/${messageId}/read`);

      // 프론트 상태 내 해당 메시지 읽음 상태 변경(Y로 업데이트)
      setMessages((msgs) =>
        msgs.map((msg) =>
          msg.messageId === messageId ? { ...msg, readStatus: "Y" } : msg
        )
      );

      // 읽지 않은 메시지 개수 다시 조회해 뱃지 갱신
      const resUnreadCount = await api.get("/messages/unreadCount", {
        params: { memberId: user.memberId },
      });
      setUnreadCount(resUnreadCount.data);

      // 예약 ID가 있으면 해당 예약 페이지로 내비게이션
      if (resvId) {
        navigate(`/reservation/${resvId}`);
      }

      // 알림창 닫기 콜백 호출(있는 경우)
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("읽음 처리 실패", error);
    }
  };

  // 메시지 배열이 비어있을 때 표시할 메시지
  if (messages.length === 0) {
    return <div style={{ padding: 16 }}>새 알림이 없습니다.</div>;
  }

  return (
    <div>
      {/* 알림 제목과 읽지 않은 개수 뱃지 */}
      <div
        style={{
          padding: 12,
          fontWeight: "bold",
          borderBottom: "1px solid #ddd",
          display: "flex",
          alignItems: "center",
        }}
      >
        알림
        {unreadCount > 0 && (
          <span
            style={{
              marginLeft: 8,
              backgroundColor: "red",
              color: "white",
              borderRadius: "50%",
              padding: "2px 8px",
              fontSize: 12,
              fontWeight: "bold",
              minWidth: 20,
              textAlign: "center",
            }}
          >
            {unreadCount}
          </span>
        )}
      </div>

      {/* 메시지 목록 렌더링 */}
      {messages.map((msg) => (
        <div
          key={msg.messageId}
          onClick={() => markAsRead(msg.messageId, msg.resvId)}
          style={{
            cursor: "pointer",
            display: "flex",
            gap: 12,
            padding: 10,
            borderBottom: "1px solid #eee",
            alignItems: "center",
            backgroundColor: msg.readStatus === "N" ? "#f9f9f9" : "white", // 안읽음 메시지는 배경 회색 처리
            fontWeight: msg.readStatus === "N" ? "bold" : "normal", // 안읽음 메시지는 글꼴 굵게
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            // 키보드 접근성: 엔터키 또는 스페이스키로도 클릭 지원
            if (e.key === "Enter" || e.key === " ") {
              markAsRead(msg.messageId, msg.resvId);
            }
          }}
        >
          {/* 메시지 내용 및 날짜 표시 */}
          <div>
            <div>{msg.messageContent}</div>
            <div style={{ fontSize: 12, color: "#666" }}>{msg.messageDate}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationList;
