import { Router } from "express";
import upload from "../config/multer.js";
import { uploadAvatar } from "../controllers/upload.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// upload.single("image") — Multer middleware runs first
// "image" must match the field name in the multipart form
// authenticate — user must be logged in to upload
router.post("/:id/avatar", authenticate, upload.single("image"), uploadAvatar);

export default router;