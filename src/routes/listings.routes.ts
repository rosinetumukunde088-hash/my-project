import express from "express";
import { getAllListings, getListingById, createListing, updateListing, deleteListing, searchListings } from "../controllers/listings.controller.js";
import { getListingStats } from "../controllers/stats.controller.js";
import { strictLimiter } from "../middleware/rateLimiter.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Listing:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: Cozy apartment in downtown
 *         location:
 *           type: string
 *           example: New York, NY
 *         pricePerNight:
 *           type: number
 *           example: 120
 *         guest:
 *           type: integer
 *           example: 2
 *         type:
 *           type: string
 *           enum: [APARTMENT, HOUSE, VILLA, CABIN]
 *           example: APARTMENT
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           example: ["WiFi", "Kitchen"]
 *         hostId:
 *           type: integer
 *           example: 1
 *         createdAt:
 *           type: string
 *           example: "2025-01-01T00:00:00.000Z"
 *     ListingInput:
 *       type: object
 *       required: [title, location, pricePerNight, guest]
 *       properties:
 *         title:
 *           type: string
 *           example: Cozy apartment in downtown
 *         location:
 *           type: string
 *           example: New York, NY
 *         pricePerNight:
 *           type: number
 *           example: 120
 *         guest:
 *           type: integer
 *           example: 2
 *         type:
 *           type: string
 *           enum: [APARTMENT, HOUSE, VILLA, CABIN]
 *           example: APARTMENT
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           example: ["WiFi", "Kitchen"]
 */

/**
 * @swagger
 * /listings/search:
 *   get:
 *     summary: Search listings by filters
 *     tags: [Listings]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         example: New York
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [APARTMENT, HOUSE, VILLA, CABIN]
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         example: 50
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         example: 200
 *       - in: query
 *         name: guests
 *         schema:
 *           type: integer
 *         example: 2
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
 *         description: Paginated search results
 */
router.get("/search", searchListings);

/**
 * @swagger
 * /listings/stats:
 *   get:
 *     summary: Get listing statistics
 *     tags: [Listings]
 *     responses:
 *       200:
 *         description: Listing stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalListings:
 *                   type: integer
 *                   example: 120
 *                 averagePrice:
 *                   type: number
 *                   example: 145.50
 *                 byLocation:
 *                   type: array
 *                   items:
 *                     type: object
 *                 byType:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/stats", getListingStats);

/**
 * @swagger
 * /listings:
 *   get:
 *     summary: Get all listings (paginated)
 *     tags: [Listings]
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
 *         description: Paginated list of listings
 */
router.get("/", getAllListings);

/**
 * @swagger
 * /listings/{id}:
 *   get:
 *     summary: Get listing by ID
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Listing found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Listing'
 *       404:
 *         description: Listing not found
 */
router.get("/:id", getListingById);

/**
 * @swagger
 * /listings:
 *   post:
 *     summary: Create a new listing
 *     tags: [Listings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ListingInput'
 *     responses:
 *       201:
 *         description: Listing created successfully
 *       400:
 *         description: Missing required fields
 */
router.post("/", authenticate, strictLimiter, createListing);

/**
 * @swagger
 * /listings/{id}:
 *   put:
 *     summary: Update a listing
 *     tags: [Listings]
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
 *             $ref: '#/components/schemas/ListingInput'
 *     responses:
 *       200:
 *         description: Listing updated successfully
 */
router.put("/:id", strictLimiter, updateListing);

/**
 * @swagger
 * /listings/{id}:
 *   delete:
 *     summary: Delete a listing
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Listing deleted successfully
 */
router.delete("/:id", deleteListing);

export default router;
