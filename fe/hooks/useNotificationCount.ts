// src/hooks/useNotificationCount.ts
import { useState, useEffect } from "react";
import { apiCall, endpoints } from "@/lib/api";

export function useNotificationCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const response = await apiCall(
        endpoints.notifications.list,
        "GET",
        null,
        {
          params: {
            read: false,
            limit: 1,
          },
        }
      );
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  return {
    unreadCount,
    refreshUnreadCount: fetchUnreadCount,
  };
}
