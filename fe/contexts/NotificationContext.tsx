"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface NotificationContextType {
  unreadCount: number;
  notifications: any[];
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  notifications: [],
  refreshNotifications: () => {},
});

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshNotifications = () => {
    // Get notifications from localStorage
    const storedNotifications = JSON.parse(
      localStorage.getItem("notifications") || "[]"
    );
    setNotifications(storedNotifications);
    setUnreadCount(storedNotifications.filter((n: any) => !n.read).length);
  };

  // Listen for WebSocket updates
  useWebSocket(refreshNotifications);

  // Initial load
  useEffect(() => {
    refreshNotifications();
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
