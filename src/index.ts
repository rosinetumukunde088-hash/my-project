import "dotenv/config";
import express from "express";
import cors from "cors";
import compression from "compression";
import listingsRouter from "./routes/listings.routes.js";
import usersRouter from "./routes/users.routes.js";
import bookingRouter from "./routes/booking.routes.js";
import authRoutes from "./routes/auth.routes.js";
import uploadRouter from "./routes/upload.routes.js";
import listingUploadRouter from "./routes/listingUpload.routes.js";
import reviewsRouter from "./routes/reviews.routes.js";
import { connectDB } from "./config/prisma.js";
import { setupSwagger } from "./config/swagger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { generalLimiter } from "./middleware/rateLimiter.js";

const app = express();
const PORT = process.env["PORT"] || 5000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(compression());
app.use(express.json());
app.use(generalLimiter);

app.use("/listings", listingsRouter);
app.use("/listings", reviewsRouter);
app.use("/users", usersRouter);
app.use("/bookings", bookingRouter);
app.use("/auth", authRoutes);
app.use("/users", uploadRouter);
app.use("/upload", listingUploadRouter);

setupSwagger(app);
app.use(errorHandler);

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
  }
}

startServer();
