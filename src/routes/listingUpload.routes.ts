import { Router } from "express";
import upload from "../config/multer.js";
import { uploadListingPhoto } from "../controllers/upload.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/listing-photo", authenticate, upload.single("image"), uploadListingPhoto);

export default router;
