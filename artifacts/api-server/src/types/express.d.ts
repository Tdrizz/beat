// Module augmentation: requireAuth attaches the Clerk userId to req.userId.
export {};

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
