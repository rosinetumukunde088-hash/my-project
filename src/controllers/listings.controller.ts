import type { Request, Response } from "express";
import prisma from "../config/prisma.js";
import { getCache, setCache, clearCache } from "../config/cache.js";
import type { AuthRequest } from "../middleware/auth.middleware.js";

export const getAllListings = async (req: Request, res: Response) => {
  const page = parseInt(req.query["page"] as string) || 1;
  const limit = parseInt(req.query["limit"] as string) || 10;
  const skip = (page - 1) * limit;

  const cacheKey = `listings:all:${page}:${limit}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json(cached);

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({ skip, take: limit, orderBy: { createdAt: "desc" }, include: { photos: true } }),
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
      where, skip, take: limit,
      include: { host: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.listing.count({ where }),
  ]);

  res.json({ data: listings, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
};

export const getListingById = async (req: Request, res: Response) => {
  // id is a UUID string, not an integer
  const id = req.params["id"] as string;
  try {
    const listing = await prisma.listing.findUnique({ where: { id }, include: { photos: true } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    res.json(listing);
  } catch (error) {
    console.error("getListingById error:", error);
    res.status(500).json({ message: "Error fetching listing" });
  }
};

export const createListing = async (req: AuthRequest, res: Response) => {
  const { title, location, pricePerNight, guest, type, amenities, description } = req.body;
  const hostId = req.user?.id;

  if (!hostId) {
    return res.status(401).json({ message: "Unauthorized — please log in" });
  }
  if (!title || !location || !pricePerNight || !guest || !type) {
    return res.status(400).json({ message: "title, location, pricePerNight, guest and type are required" });
  }
  if (Number(pricePerNight) <= 0 || Number(guest) <= 0) {
    return res.status(400).json({ message: "pricePerNight and guest must be positive" });
  }

  try {
    // Verify the host user exists in the DB
    const hostExists = await prisma.user.findUnique({ where: { id: hostId } });
    if (!hostExists) {
      return res.status(404).json({ message: "Host user not found. Please register an account first." });
    }

    // Validate type enum
    const validTypes = ["APARTMENT", "HOUSE", "VILLA", "CABIN"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: `Invalid type. Must be one of: ${validTypes.join(", ")}` });
    }

    const newListing = await prisma.listing.create({
      data: {
        title: String(title),
        location: String(location),
        pricePerNight: Number(pricePerNight),
        guest: Number(guest),
        type: type as "APARTMENT" | "HOUSE" | "VILLA" | "CABIN",
        amenities: Array.isArray(amenities) ? amenities : [],
        description: description ? String(description) : null,
        hostId: String(hostId),
      },
    });

    clearCache("stats:listings");
    clearCache("listings:all:1:10");
    res.status(201).json(newListing);
  } catch (error: any) {
    console.error("createListing error:", error);
    res.status(500).json({
      message: "Error creating listing",
      detail: error?.message ?? String(error),
    });
  }
};

export const updateListing = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  try {
    const updated = await prisma.listing.update({ where: { id }, data: req.body });
    clearCache("stats:listings");
    res.json(updated);
  } catch (error) {
    console.error("updateListing error:", error);
    res.status(500).json({ message: "Error updating listing" });
  }
};

export const deleteListing = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  try {
    await prisma.listing.delete({ where: { id } });
    clearCache("stats:listings");
    res.json({ message: "Listing deleted successfully" });
  } catch (error) {
    console.error("deleteListing error:", error);
    res.status(500).json({ message: "Error deleting listing" });
  }
};
