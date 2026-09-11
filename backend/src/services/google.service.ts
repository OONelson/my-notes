import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import prisma from "../config/prisma";

interface GoogleTokenInfo {
	aud: string;
	expires_in: number;
	scope: string;
}

interface GoogleUserInfo {
	sub: string;
	email?: string;
	email_verified?: boolean;
	name?: string;
}

export const googleSignIn = async (accessToken: string) => {
	const googleClientId = process.env.GOOGLE_CLIENT_ID;

	if (!googleClientId) {
		throw new Error("Google sign-in is not configured");
	}

	const tokenInfoRes = await fetch(
		`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
	);

	if (!tokenInfoRes.ok) {
		throw new Error("Invalid Google token");
	}

	const tokenInfo = (await tokenInfoRes.json()) as GoogleTokenInfo;

	if (tokenInfo.aud !== googleClientId) {
		throw new Error("Invalid Google token audience");
	}

	const userInfoRes = await fetch(
		"https://www.googleapis.com/oauth2/v3/userinfo",
		{ headers: { Authorization: `Bearer ${accessToken}` } },
	);

	if (!userInfoRes.ok) {
		throw new Error("Invalid Google token");
	}

	const profile = (await userInfoRes.json()) as GoogleUserInfo;

	if (!profile.email || !profile.email_verified) {
		throw new Error("Invalid Google account");
	}

	const { email, sub: googleId, name } = profile;

	let user = await prisma.user.findUnique({ where: { email } });

	if (!user) {
		const placeholderPassword = await bcrypt.hash(
			randomBytes(32).toString("hex"),
			12,
		);

		user = await prisma.user.create({
			data: {
				email,
				password: placeholderPassword,
				googleId,
			},
		});
	} else if (!user.googleId) {
		user = await prisma.user.update({
			where: { email },
			data: { googleId },
		});
	}

	const token = jwt.sign(
		{ id: user.id, email: user.email },
		process.env.JWT_SECRET!,
		{
			expiresIn: (process.env.JWT_EXPIRES_IN ??
				"7d") as jwt.SignOptions["expiresIn"],
		},
	);

	const { password: _password, ...safeUser } = user;

	return { user: safeUser, token, name };
};
