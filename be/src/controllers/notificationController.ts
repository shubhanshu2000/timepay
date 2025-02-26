import { Request, Response } from "express";
import * as notificationService from "../services/notificationService";
import { AuthRequest, NotificationType } from "../types";
import { createNotFoundError } from "../types/errors";

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await notificationService.getNotifications(
      req.user!.id,
      req.query
    );

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch notifications",
    });
  }
};

export const markAsRead = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const result = await notificationService.markAsRead(
      req.params.id,
      req.user!.id
    );

    if (!result) {
      throw createNotFoundError("Notification");
    }

    res.json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to mark notification as read",
    });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await notificationService.markAllAsRead(req.user!.id);
    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to mark all notifications as read",
    });
  }
};
