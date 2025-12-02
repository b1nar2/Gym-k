import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import NotificationList from "./NotificationList";
import { fetchUnreadCount } from "../../api/messageApi";

interface NotificationBellProps {
  onClick?: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onClick }) => {
  const { authState } = useAuth();
  const user = authState;
  const [unreadCount, setUnreadCount] = useState(0);
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    async function loadUnreadCount() {
      if (!user?.memberId) return;
      try {
        const count = await fetchUnreadCount(user.memberId);
        setUnreadCount(count);
      } catch (error) {
        console.error("Unread count fetch failed", error);
      }
    }
    loadUnreadCount();
    const intervalId = setInterval(loadUnreadCount, 300000);
    return () => clearInterval(intervalId);
  }, [user?.memberId]);

  const handleClick = () => {
    setShowList(!showList);
    if (onClick) onClick();
  };

  return (
    <div style={{ position: "relative" }}>
      <button onClick={handleClick} aria-label="알림" style={{ position: "relative" }}>
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              backgroundColor: "red",
              borderRadius: "50%",
              color: "white",
              padding: "2px 6px",
              fontSize: "12px",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>
      {showList && (
        <div
          style={{
            position: "absolute",
            top: "120%",
            right: 0,
            width: 320,
            maxHeight: 400,
            overflowY: "auto",
            border: "1px solid #ddd",
            borderRadius: 8,
            background: "white",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            zIndex: 100,
          }}
        >
          <NotificationList onClose={() => setShowList(false)} />
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
