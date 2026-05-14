import type { Request, Response } from "express";
import prisma from "../config/prisma.js";
import { getCache, setCache, clearCacheByPrefix } from "../config/cache.js";

export const getReviews = async (req: Request, res: Response) => {
  const listingId = req.params["id"] as string;
  const page = parseInt(req.query["page"] as string) || 1;
  const limit = parseInt(req.query["limit"] as string) || 10;
  const skip = (page - 1) * limit;

  const cacheKey = `reviews:${listingId}:${page}:${limit}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return res.status(404).json({ message: "Listing not found" });

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { listingId },
      skip,
      take: limit,
      include: { user: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.count({ where: { listingId } }),
  ]);

  const result = { data: reviews, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  setCache(cacheKey, result, 30);
  res.json(result);
};

export const createReview = async (req: Request, res: Response) => {
  const listingId = req.params["id"] as string;
  const { userId, rating, comment } = req.body;

  if (!userId || !rating || !comment) {
    return res.status(400).json({ message: "userId, rating and comment are required" });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return res.status(404).json({ message: "Listing not found" });

  const review = await prisma.review.create({
    data: { userId, listingId, rating, comment },
  });

  clearCacheByPrefix(`reviews:${listingId}`);
  res.status(201).json(review);
};

export const deleteReview = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ message: "Review not found" });

  await prisma.review.delete({ where: { id } });
  clearCacheByPrefix(`reviews:${existing.listingId}`);
  res.json({ message: "Review deleted successfully" });
};
