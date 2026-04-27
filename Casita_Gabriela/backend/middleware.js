import jwt from "jsonwebtoken";
import { PrismaClient } from "./generated/prisma/client.js";

const prisma = new PrismaClient();

export const authenticate = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || req.headers.Authorization;
    if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });

    const token = auth.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload || !payload.id) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.users.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    req.user = user;
    next();
  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (!(req.user.isAdmin === true || req.user.isAdmin === 1)) return res.status(403).json({ error: "Admin role required" });
  return next();
};
