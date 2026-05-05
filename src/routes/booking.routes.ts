import express from "express";
import { getAllBookings, getBookingById, createBooking, deleteBooking, updateBooking } from "../controllers/booking.controller.js";
import { strictLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         checkIn:
 *           type: string
 *           example: "2025-08-01"
 *         checkOut:
 *           type: string
 *           example: "2025-08-05"
 *         totalPrice:
 *           type: number
 *           example: 480
 *         guests:
 *           type: integer
 *           example: 2
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, CANCELLED]
 *           example: PENDING
 *         guestId:
 *           type: integer
 *           example: 1
 *         listingId:
 *           type: integer
 *           example: 1
 *     BookingInput:
 *       type: object
 *       required: [checkIn, checkOut, guestId, listingId, guests]
 *       properties:
 *         checkIn:
 *           type: string
 *           example: "2025-08-01"
 *         checkOut:
 *           type: string
 *           example: "2025-08-05"
 *         guestId:
 *           type: integer
 *           example: 1
 *         listingId:
 *           type: integer
 *           example: 1
 *         guests:
 *           type: integer
 *           example: 2
 */

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Get all bookings (paginated)
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of bookings
 */
router.get("/", getAllBookings);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Booking found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       404:
 *         description: Booking not found
 */
router.get("/:id", getBookingById);

/**
 * @swagger
 * /bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingInput'
 *     responses:
 *       201:
 *         description: Booking created with calculated total
 *       400:
 *         description: Missing fields or invalid dates
 *       404:
 *         description: User or listing not found
 */
router.post("/", strictLimiter, createBooking);

/**
 * @swagger
 * /bookings/{id}:
 *   put:
 *     summary: Update a booking
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, CANCELLED]
 *     responses:
 *       200:
 *         description: Booking updated successfully
 */
router.put("/:id", strictLimiter, updateBooking);

/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       404:
 *         description: Booking not found
 */
router.delete("/:id", deleteBooking);

export default router;
