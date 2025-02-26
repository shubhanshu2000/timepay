"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Notification, NotificationType } from "@/types";
import { apiCall, endpoints } from "@/lib/api";
import { toast } from "sonner";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<{
    type?: NotificationType;
    read?: boolean;
  }>({});

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiCall(endpoints.notifications.list, "GET", null);
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiCall(endpoints.notifications.markRead(id), "PUT");
      toast.success("Notification marked as read");
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiCall(endpoints.notifications.markAllRead, "PUT");
      toast.success("All notifications marked as read");
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to mark all notifications as read");
    }
  };

  useWebSocket(fetchNotifications);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Notifications
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {unreadCount} unread
            </Badge>
          )}
        </h1>
        <div className="flex gap-4">
          {/* <Select
            value={filter.type}
            onValueChange={(value) =>
              setFilter((prev) => ({
                ...prev,
                type: value as NotificationType,
              }))
            }
          >
            <option value="">All Types</option>
            {Object.values(NotificationType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
          <Select
            value={String(filter.read)}
            onValueChange={(value) =>
              setFilter((prev) => ({
                ...prev,
                read: value === "" ? undefined : value === "true",
              }))
            }
          >
            <option value="">All Status</option>
            <option value="true">Read</option>
            <option value="false">Unread</option>
          </Select> */}
          <Button disabled={!unreadCount} onClick={handleMarkAllAsRead}>
            Mark All as Read
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No notifications found
            </Card>
          ) : (
            notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function NotificationCard({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) {
  return (
    <Card
      className={`p-4 ${
        notification.read ? "bg-background" : "bg-secondary/20"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{notification.type}</span>
            {!notification.read && <Badge variant="default">New</Badge>}
          </div>
          <p className="mt-1">{notification.message}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {new Date(notification.createdAt).toLocaleDateString()}
          </p>
        </div>
        {!notification.read && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMarkAsRead(notification.id)}
          >
            Mark as Read
          </Button>
        )}
      </div>
    </Card>
  );
}
