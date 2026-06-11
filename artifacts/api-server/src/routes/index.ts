import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiTryonRouter from "./aiTryon";
import storageRouter from "./storage";
import profilesRouter from "./profiles";
import postsRouter from "./posts";
import socialRouter from "./social";
import messagesRouter from "./messages";
import brandsRouter from "./brands";
import affiliateRouter from "./affiliate";
import notificationsRouter from "./notifications";
import tutorialsRouter from "./tutorials";
import classesRouter from "./classes";
import premiumRouter from "./premium";
import chatRouter from "./chat";
import wigsRouter from "./wigs";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiTryonRouter);
router.use(storageRouter);
// socialRouter must be mounted *before* profilesRouter because the latter
// has a catch-all `/profiles/:handle` route that would otherwise swallow
// the new specific paths `/profiles/featured`, `/profiles/search`, and
// `/profiles/me/friends` (treating "featured" / "search" / "me" as handles).
router.use(socialRouter);
router.use(profilesRouter);
router.use(postsRouter);
router.use(messagesRouter);
router.use(brandsRouter);
router.use(affiliateRouter);
router.use(notificationsRouter);
router.use(tutorialsRouter);
router.use(classesRouter);
router.use(premiumRouter);
router.use(chatRouter);
router.use(wigsRouter);

export default router;
