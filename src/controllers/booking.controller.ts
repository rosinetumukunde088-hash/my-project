import type { Request, Response } from "express";
import prisma from "../config/prisma.js";

export const getAllBookings = async (req: Request, res: Response) => {
  const page = parseInt(req.query["page"] as string) || 1;
  const limit = parseInt(req.query["limit"] as string) || 10;
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      skip,
      take: limit,
      include: {
        guest: { select: { name: true } },
        listing: { select: { title: true, location: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.count(),
  ]);

  res.json({ data: bookings, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
};

export const getBookingById = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { guest: true, listing: true },
  });
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  res.json(booking);
};

export const getUserBookings = async (req: Request, res: Response) => {
  const guestId = req.params["id"] as string;
  const page = parseInt(req.query["page"] as string) || 1;
  const limit = parseInt(req.query["limit"] as string) || 10;
  const skip = (page - 1) * limit;

  const user = await prisma.user.findUnique({ where: { id: guestId } });
  if (!user) return res.status(404).json({ message: "User not found" });

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where: { guestId },
      skip,
      take: limit,
      include: { listing: { select: { title: true, location: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.count({ where: { guestId } }),
  ]);

  res.json({ data: bookings, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
};

export const createBooking = async (req: Request, res: Response) => {
  const { checkIn, checkOut, guestId, listingId } = req.body;
  const guests = parseInt(req.body.guests);

  if (!checkIn || !checkOut || !guestId || !listingId || isNaN(guests)) {
    return res.status(400).json({ message: "checkIn, checkOut, guestId, listingId and guests are required" });
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
    return res.status(400).json({ message: "checkIn and checkOut must be valid dates" });
  }

  const [user, listing] = await Promise.all([
    prisma.user.findUnique({ where: { id: guestId } }),
    prisma.listing.findUnique({ where: { id: listingId } }),
  ]);

  if (!user) return res.status(404).json({ message: "User not found" });
  if (!listing) return res.status(404).json({ message: "Listing not found" });

  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalPrice = nights * listing.pricePerNight;

  const booking = await prisma.booking.create({
    data: { checkIn: checkInDate, checkOut: checkOutDate, guestId, listingId, guests, totalPrice },
  });

  res.status(201).json(booking);
};

export const deleteBooking = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const existing = await prisma.booking.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ message: "Booking not found" });

  await prisma.booking.delete({ where: { id } });
  res.json({ message: "Booking cancelled successfully" });
};

export const updateBooking = async (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const { checkIn, guestId, totalPrice, listingId, status } = req.body;
  const data: any = {};
  if (checkIn) {
    const checkInDate = new Date(checkIn);
    if (isNaN(checkInDate.getTime())) {
      return res.status(400).json({ message: "checkIn must be a valid date" });
    }
    data.checkIn = checkInDate;
  }
  if (guestId) data.guestId = guestId;
  if (totalPrice) data.totalPrice = totalPrice;
  if (listingId) data.listingId = listingId;
  if (status) data.status = status;

  try {
    const updated = await prisma.booking.update({ where: { id }, data });
    res.json({ message: "Booking updated successfully", updated });
  } catch (error) {
    res.status(500).json({ message: "Error updating booking" });
  }
};
