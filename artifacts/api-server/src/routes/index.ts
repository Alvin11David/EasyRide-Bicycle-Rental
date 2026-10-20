import { Router, type IRouter } from "express";
import healthRouter from "./health";
import easyRideRouter from "./easyride";

const router: IRouter = Router();

router.use(healthRouter);
router.use(easyRideRouter);

export default router;
