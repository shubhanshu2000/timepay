// src/hooks/useWebSocket.ts
import { useEffect, useRef } from "react";
import { toast } from "sonner";

let globalWs: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let isConnecting = false;
const listeners: Set<(data: any) => void> = new Set();

const connectWebSocket = () => {
  if (globalWs?.readyState === WebSocket.OPEN || isConnecting) return globalWs;

  isConnecting = true;
  console.log("Initializing WebSocket connection");

  globalWs = new WebSocket(
    process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000"
  );

  globalWs.onopen = () => {
    console.log("WebSocket connected");
    isConnecting = false;
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  };

  globalWs.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "PING") return;

      console.log("Received WebSocket message:", data);

      if (data.type === "PAYMENT_RECEIVED") {
        toast.success(data.data.message);
        // Notify all listeners to refresh their data
        listeners.forEach((listener) => listener(data));
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  };

  globalWs.onclose = () => {
    console.log("WebSocket disconnected");
    globalWs = null;
    isConnecting = false;
    if (!reconnectTimeout) {
      reconnectTimeout = setTimeout(connectWebSocket, 5000);
    }
  };

  globalWs.onerror = (error) => {
    console.error("WebSocket error:", error);
    isConnecting = false;
    globalWs?.close();
  };

  return globalWs;
};

export const useWebSocket = (onNotificationUpdate?: () => void) => {
  const listenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (listenerRef.current) {
      listeners.delete(listenerRef.current);
    }

    const listener = () => {
      onNotificationUpdate?.();
    };

    listenerRef.current = listener;
    listeners.add(listener);

    if (!globalWs || globalWs.readyState !== WebSocket.OPEN) {
      connectWebSocket();
    }

    return () => {
      if (listenerRef.current) {
        listeners.delete(listenerRef.current);
      }
    };
  }, [onNotificationUpdate]);
};
