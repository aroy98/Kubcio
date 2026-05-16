import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      userRole?: string;
    }
  }
}

export function attachRole(req: Request, _res: Response, next: NextFunction) {
  req.userRole = req.header("x-user-role") ?? undefined;
  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.userRole;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Insufficient role to perform this action",
      });
    }
    next();
  };
}
