import { Router, type IRouter } from "express";
import healthRouter from "./health";
import aiTryonRouter from "./aiTryon";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiTryonRouter);

export default router;
