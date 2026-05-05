import type { Request, Response } from "express";
import prisma from "../config/prisma.js";
import { getCache, setCache, clearCache } from "../config/cache.js";

export const getAllListings = async (req: Request, res: Response) => {
  const page = parseInt(req.query["page"] as string) || 1;
  const limit = parseInt(req.query["limit"] as string) || 10;
  const skip = (page - 1) * limit;

  const cacheKey = `listings:all:${page}:${limit}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({ skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.listing.count(),
  ]);

  const result = { data: listings, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  setCache(cacheKey, result, 60);
  res.json(result);
};

export const searchListings = async (req: Request, res: Response) => {
  const { location, type, minPrice, maxPrice, guests } = req.query;
  const page = parseInt(req.query["page"] as string) || 1;
  const limit = parseInt(req.query["limit"] as string) || 10;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (location) where.location = { contains: location as string, mode: "insensitive" };
  if (type) where.type = type as string;
  if (minPrice || maxPrice) {
    where.pricePerNight = {};
    if (minPrice) where.pricePerNight.gte = parseFloat(minPrice as string);
    if (maxPrice) where.pricePerNight.lte = parseFloat(maxPrice as string);
  }
  if (guests) where.guest = { gte: parseInt(guests as string) };

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take: limit,
      include: { host: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.listing.count({ where }),
  ]);

  res.json({ data: listings, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
};

export const getListingById = async (req: Request, res: Response) => {
  const id = parseInt(req.params["id"] as string);
  try {
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    res.json(listing);
  } catch (error) {
    res.status(500).json({ message: "Error fetching listing" });
  }
};

export const createListing = async (req: Request, res: Response) => {
  const { title, location, pricePerNight, guest, type, amenities } = req.body;

  if (!title || !location || !pricePerNight || !guest) {
    return res.status(400).json({ message: "Title, location, pricePerNight and guest are required" });
  }
  if (pricePerNight <= 0 || guest <= 0) {
    return res.status(400).json({ message: "pricePerNight and guest must be positive" });
  }

  try {
    const newListing = await prisma.listing.create({
      data: { title, location, pricePerNight, type, guest, amenities, hostId: 1 },
    });
    clearCache("stats:listings");
    clearCache("listings:all:1:10");
    res.status(201).json(newListing);
  } catch (error) {
    res.status(500).json({ message: "Error creating listing" });
  }
};

export const updateListing = async (req: Request, res: Response) => {
  const id = parseInt(req.params["id"] as string);
  try {
    const updated = await prisma.listing.update({ where: { id }, data: req.body });
    clearCache("stats:listings");
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating listing" });
  }
};

export const deleteListing = async (req: Request, res: Response) => {
  const id = parseInt(req.params["id"] as string);
  try {
    await prisma.listing.delete({ where: { id } });
    clearCache("stats:listings");
    res.json({ message: "Listing deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting listing" });
  }
};
