import express from "express";
import { getReviews, createReview, deleteReview } from "../controllers/reviews.controller.js";
import { strictLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         rating:
 *           type: integer
 *           example: 5
 *         comment:
 *           type: string
 *           example: Amazing place!
 *         userId:
 *           type: integer
 *           example: 1
 *         listingId:
 *           type: integer
 *           example: 1
 *         createdAt:
 *           type: string
 *           example: "2025-01-01T00:00:00.000Z"
 *     ReviewInput:
 *       type: object
 *       required: [userId, rating, comment]
 *       properties:
 *         userId:
 *           type: integer
 *           example: 1
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 5
 *         comment:
 *           type: string
 *           example: Amazing place!
 */

/**
 * @swagger
 * /listings/{id}/reviews:
 *   get:
 *     summary: Get all reviews for a listing (paginated)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
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
 *         description: Paginated reviews
 *       404:
 *         description: Listing not found
 */
router.get("/:id/reviews", getReviews);

/**
 * @swagger
 * /listings/{id}/reviews:
 *   post:
 *     summary: Add a review to a listing
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewInput'
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Missing fields or rating out of range
 *       404:
 *         description: Listing not found
 */
router.post("/:id/reviews", strictLimiter, createReview);

/**
 * @swagger
 * /listings/reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 */
router.delete("/reviews/:id", deleteReview);

export default router;
