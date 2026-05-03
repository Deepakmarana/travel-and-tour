import { auth } from "@travel-and-tour/auth";
import type { IncomingHttpHeaders } from "node:http";
import type { NextFunction, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

function toWebHeaders(nodeHeaders: IncomingHttpHeaders): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(nodeHeaders)) {
    if (v !== undefined) h.set(k, Array.isArray(v) ? v.join(", ") : v);
  }
  return h;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({ headers: toWebHeaders(req.headers) });
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = session.user.id;
  next();
}
