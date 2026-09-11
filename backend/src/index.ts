import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors, { type CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes";
import notesRoutes from "./routes/notes.routes";
import tagsRoutes from "./routes/tags.routes";
import foldersRoutes from "./routes/folders.routes";
import favoritesRoutes from "./routes/favorites.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT || 5000;

const DEFAULT_ALLOWED_ORIGINS = [
	"http://localhost:5173",
	"http://localhost:5176",
	"https://not-lify.vercel.app",
];

const normalizeOrigin = (origin: string) => origin.trim().replace(/\/$/, "");

const configuredOrigins =
	process.env.CORS_ORIGIN?.split(",")
		.map(normalizeOrigin)
		.filter(Boolean) ?? [];

const allowedOrigins = new Set([
	...DEFAULT_ALLOWED_ORIGINS.map(normalizeOrigin),
	...configuredOrigins,
]);

const corsOptions: CorsOptions = {
	origin(origin, callback) {
		if (!origin || allowedOrigins.has(normalizeOrigin(origin))) {
			callback(null, true);
			return;
		}

		callback(new Error(`CORS blocked origin: ${origin}`));
	},
	credentials: true,
};

app.use(compression());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

const globalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 200,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	standardHeaders: true,
	legacyHeaders: false,
	message: { message: "Too many auth attempts, please try again later." },
});

app.use(globalLimiter);

app.get("/", (_req, res) => {
	res.json({ status: "ok", message: "my-notes API is running" });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/tags", tagsRoutes);
app.use("/api/folders", foldersRoutes);
app.use("/api/favorites", favoritesRoutes);

app.use((_req, res) => {
	res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
	app.listen(PORT, () => {
		console.log(`🚀 Server running on port ${PORT}`);
	});
}

export default app;
