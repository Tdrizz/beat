import { Router, type IRouter } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { z } from "zod/v4";
import { requireAuth } from "../middlewares/requireAuth";
import { rateLimit } from "../middlewares/rateLimit";
import { deleteAccountData } from "../lib/accountDeletion";

const router: IRouter = Router();

const DeleteBody = z.object({ confirm: z.literal("DELETE") });

/* ── Delete my account ────────────────────────────────────────────────────
 * Removes the profile and all content, cancels Premium, deletes uploads,
 * then deletes the Clerk user (which signs them out everywhere). Safe to
 * retry: if anything fails part-way, calling again finishes the job. */
router.delete(
  "/me",
  requireAuth,
  rateLimit({ scope: "account-delete", max: 5, windowMs: 60 * 60_000 }),
  async (req, res) => {
    if (!DeleteBody.safeParse(req.body).success) {
      res.status(400).json({ error: 'Send { "confirm": "DELETE" } to delete your account' });
      return;
    }
    // req.userId may be a migrated (external) id; Clerk needs its own id.
    const clerkUserId = getAuth(req)?.userId ?? req.userId!;
    try {
      const summary = await deleteAccountData(req.userId!);
      await clerkClient.users.deleteUser(clerkUserId).catch((err: { status?: number }) => {
        if (err?.status !== 404) throw err;
      });
      req.log.info({ ...summary }, "Account deleted");
      res.status(204).end();
    } catch (err) {
      req.log.error({ err }, "Account deletion failed");
      res.status(500).json({ error: "We couldn't finish deleting your account. Please try again." });
    }
  },
);

export default router;
