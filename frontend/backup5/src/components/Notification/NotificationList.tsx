import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { useNavigate } from "react-router-dom";
import { fetchMessages, fetchUnreadCount, markMessageAsRead } from "../../api/messageApi";
import type { Message } from "../../api/messageApi";

interface NotificationListProps {
  onClose?: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const { authState } = useAuth();
  const user = authState;
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        if (!user?.memberId) return;
        const msgs = await fetchMessages(user.memberId);
        setMessages(msgs);
        const count = await fetchUnreadCount(user.memberId);
        setUnreadCount(count);
      } catch (error) {
        console.error("메시지 로드 실패", error);
      }
    }
    fetchData();
  }, [user?.memberId]);

  const markAsRead = async (messageId: number, resvId: number | null) => {
    try {
      await markMessageAsRead(messageId);
      setMessages((msgs) =>
        msgs.map((msg) =>
          msg.messageId === messageId ? { ...msg, readStatus: "Y" } : msg
        )
      );

      if (!user?.memberId) return;
      const count = await fetchUnreadCount(user.memberId);
      
      setUnreadCount(count);
      if (resvId) {
        navigate(`/reservation/${resvId}`);
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("읽음 처리 실패", error);
    }
  };

  if (messages.length === 0) {
    return <div style={{ padding: 16 }}>새 알림이 없습니다.</div>;
  }

  return (
    <div>
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
            backgroundColor: msg.readStatus === "N" ? "#f9f9f9" : "white",
            fontWeight: msg.readStatus === "N" ? "bold" : "normal",
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              markAsRead(msg.messageId, msg.resvId);
            }
          }}
        >
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
