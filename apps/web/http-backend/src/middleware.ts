import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../../../packages/backend-common/index.js";
type AuthenticatedRequest = Request & {
  userId?: number;
};

export function middleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const token = authHeader.slice(7);

  const decoded = jwt.verify(token, JWT_SECRET);

  if (typeof decoded === "string" || typeof decoded.userId !== "number") {
    return res.status(403).json({ message: "Forbidden" });
  }

  req.userId = decoded.userId;
  next();
}