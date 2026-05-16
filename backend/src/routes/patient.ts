import { Router } from "express";
import { PATIENT } from "../store/inMemoryStore";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ patient: PATIENT });
});

export default router;
