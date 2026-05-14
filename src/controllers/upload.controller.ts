import type { Request, Response } from "express";
import { uploadToCloudinary } from "../config/cloudinary.js";
import prisma from "../config/prisma.js";

// POST /users/:id/avatar
// Uploads a profile picture for a user
// Multer middleware runs first and puts the file on req.file
// Then we upload the buffer to Cloudinary and save the URL to the database

export async function uploadAvatar(req: Request, res: Response) {
  const id = req.params["id"] as string;

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const { url } = await uploadToCloudinary(req.file.buffer, "airbnb/avatars");

  await prisma.user.update({ where: { id }, data: { avatar: url } });

  res.json({ message: "Avatar uploaded successfully", avatar: url });
}

export async function uploadListingPhoto(req: Request, res: Response) {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const { url } = await uploadToCloudinary(req.file.buffer, "airbnb/listings");
  res.json({ url });
}