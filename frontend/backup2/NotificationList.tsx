import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface Message {
  messageId: number;
  memberId: string;
  memberName: string;
  resvId: number | null;
  closedId: number | null;
  messageType: string;
  messageContent: string;
  messageDate: string;
  imageUrl?: string;
}

interface NotificationListProps {
  onClose?: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { authState } = useAuth();
  const user = authState;
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchMessages() {
      try {
        const response = await api.get("/api/messages", {
          params: { memberId: user.memberId, limit: 5 }
        });
        setMessages(response.data);
      } catch (error) {
        console.error("Failed to load messages", error);
      }
    }
    if (user?.memberId) fetchMessages();
  }, [user?.memberId]);

  const markAsRead = async (messageId: number, resvId: number | null) => {
    try {
      await api.post(`/api/messages/${messageId}/read`);
      setMessages((msgs) => msgs.filter((msg) => msg.messageId !== messageId));
      if (resvId) {
        navigate(`/reservation/${resvId}`);
      }
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Failed to mark message as read", error);
    }
  };

  if (messages.length === 0) {
    return <div style={{ padding: 16 }}>새 알림이 없습니다.</div>;
  }

  return (
    <div>
      <div style={{ padding: 12, fontWeight: "bold", borderBottom: "1px solid #ddd" }}>알림</div>
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
          }}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              markAsRead(msg.messageId, msg.resvId);
            }
          }}
        >
          {msg.imageUrl && (
            <img
              src={msg.imageUrl}
              alt="알림 이미지"
              style={{ width: 48, height: 48, borderRadius: 6, objectFit: "cover" }}
            />
          )}
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
