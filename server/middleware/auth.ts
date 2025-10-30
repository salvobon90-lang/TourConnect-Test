import type { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

export async function isPartner(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    if (!user?.claims?.sub) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = user.claims.sub;
    const partner = await storage.getPartnerByOwner(userId);
    
    if (!partner) {
      return res.status(403).json({ message: "Partner profile required. Please register as a partner first." });
    }
    
    // Attach partner to request for use in handlers
    (req as any).partner = partner;
    next();
  } catch (error) {
    console.error('isPartner middleware error:', error);
    res.status(500).json({ message: "Authorization check failed" });
  }
}
