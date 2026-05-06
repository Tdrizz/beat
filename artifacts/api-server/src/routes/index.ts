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

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiTryonRouter);
router.use(storageRouter);
router.use(profilesRouter);
router.use(postsRouter);
router.use(socialRouter);
router.use(messagesRouter);
router.use(brandsRouter);
router.use(affiliateRouter);

export default router;
