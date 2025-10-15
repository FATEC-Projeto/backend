import jwt, { SignOptions } from "jsonwebtoken";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET não definido");

  const expiresIn = (process.env.JWT_ACCESS_EXPIRES || "15m") as SignOptions["expiresIn"];

  return jwt.sign(payload, secret, { expiresIn });
};

export const generateRefreshToken = (payload: { sub: string }): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET não definido");

  const expiresIn = (process.env.JWT_REFRESH_EXPIRES || "7d") as SignOptions["expiresIn"];

  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET não definido");

  return jwt.verify(token, secret) as JwtPayload;
};
