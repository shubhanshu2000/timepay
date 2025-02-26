import { NextFunction, Router } from "express";
import { auth } from "../middlewares/auth";
import * as customerController from "../controllers/customerController";
import { AuthRequest } from "../types";
import multer from "multer";
import { handleFileUploadError } from "../middlewares/fileHandler";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/search", auth, customerController.searchCustomers);
router.post("/", auth, customerController.createCustomer);
router.put("/:id", auth, customerController.updateCustomer);
router.delete("/:id", auth, customerController.deleteCustomer);
router.post(
  "/bulk-upload",
  auth,
  upload.single("file"),
  handleFileUploadError,
  customerController.bulkUpload
);

export default router;
