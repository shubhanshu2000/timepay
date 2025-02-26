import { WebSocket, Server as WebSocketServer } from "ws";
import { Server } from "http";
import { NotificationType } from "../types";

let wss: WebSocketServer;

export const initializeWebSocket = (server: Server) => {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log(`Client connected (Total connections: ${wss.clients.size})`);

    ws.on("message", (message) => {
      console.log("Received message:", message.toString());
    });

    ws.on("close", () => {
      console.log(
        `Client disconnected (Remaining connections: ${wss.clients.size})`
      );
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    // Send initial ping to keep connection alive
    ws.send(JSON.stringify({ type: "PING" }));
  });
};

const broadcastMessage = (type: string, data: any) => {
  if (!wss) {
    console.error("WebSocket server not initialized");
    return;
  }

  const message = JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString(),
  });

  let sentCount = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sentCount++;
    }
  });

  console.log(`Notification sent to ${sentCount} clients: ${type}`, data);
};

export const notifyPaymentReceived = (paymentData: any) => {
  broadcastMessage("PAYMENT_RECEIVED", {
    ...paymentData,
    message: `Payment of $${paymentData.amount} received from ${paymentData.customerName}`,
  });
};

export const notifyPaymentOverdue = (customerData: any) => {
  broadcastMessage("PAYMENT_OVERDUE", {
    ...customerData,
    message: `Payment for ${customerData.customerName} is overdue`,
  });
};

export const notifyPaymentUpdate = (
  customerId: string,
  paymentStatus: string
) => {
  broadcastMessage("PAYMENT_UPDATE", {
    customerId,
    paymentStatus,
    message: `Payment status updated to ${paymentStatus}`,
  });
};

export const notifyNewCustomer = (customerData: any) => {
  broadcastMessage("CUSTOMER_ADDED", {
    ...customerData,
    message: `New customer ${customerData.name} added`,
  });
};

export const notifyClients = (type: string, data: any) => {
  broadcastMessage(type, data);
};
