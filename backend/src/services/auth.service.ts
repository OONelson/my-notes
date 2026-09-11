import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
import type { RegisterDTO, LoginDTO } from "../types";
import redisClient from "../config/redis";

export const signupUser = async ({ email, password }: RegisterDTO) => {
	const existing = await prisma.user.findUnique({
		where: { email },
	});

	if (existing) {
		throw new Error("Email already in use");
	}

	const hashedPassword = await bcrypt.hash(password, 12);

	const user = await prisma.user.create({
		data: { email, password: hashedPassword },
		select: { id: true, email: true, createdAt: true },
	});

	const token = jwt.sign(
		{ id: user.id, email: user.email },
		process.env.JWT_SECRET!,
		{
			expiresIn: (process.env.JWT_EXPIRES_IN ||
				"1h") as jwt.SignOptions["expiresIn"],
		},
	);

	return { user, token };
};

export const loginUser = async ({ email, password }: LoginDTO) => {
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user) {
		throw new Error("Invalid, Try signing up instead");
	}

	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		throw new Error("Invalid email or password");
	}

	const token = jwt.sign(
		{ id: user.id, email: user.email },
		process.env.JWT_SECRET!,
		{
			expiresIn: (process.env.JWT_EXPIRES_IN ??
				"7d") as jwt.SignOptions["expiresIn"],
		},
	);

	const { password: _, ...safeUser } = user;

	return { user: safeUser, token };
};

export const getUserById = async (id: string) => {
	const user = await prisma.user.findUnique({
		where: { id },
		select: { id: true, email: true, createdAt: true },
	});

	return user;
};

export const logoutUser = async (token: string) => {
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
			exp: number;
		};
		const ttl = Math.floor(decoded.exp - Date.now() / 1000);
		if (ttl > 0) {
			await redisClient.setEx(`blacklist:${token}`, ttl, "true");
		}
	} catch (err) {
		console.error("Error blacklisting token:", err);
	}
};
