import type { Request, Response } from "express";
import prisma from "../config/prisma.js";
import { getCache, setCache } from "../config/cache.js";

export const getListingStats = async (req: Request, res: Response) => {
  const cacheKey = "stats:listings";
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const [totalListings, avgPrice, byLocation, byType] = await Promise.all([
    prisma.listing.count(),
    prisma.listing.aggregate({ _avg: { pricePerNight: true } }),
    prisma.listing.groupBy({ by: ["location"], _count: { location: true } }),
    prisma.listing.groupBy({ by: ["type"], _count: { type: true } }),
  ]);

  const result = {
    totalListings,
    averagePrice: avgPrice._avg.pricePerNight ?? 0,
    byLocation,
    byType,
  };

  setCache(cacheKey, result, 300);
  res.json(result);
};

export const getUserStats = async (req: Request, res: Response) => {
  const cacheKey = "stats:users";
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const [totalUsers, byRole] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ["role"], _count: { role: true } }),
  ]);

  const result = { totalUsers, byRole };
  setCache(cacheKey, result, 300);
  res.json(result);
};
