import { Router } from "express";
import { auditLog } from "../store/inMemoryStore";

const router = Router();

router.get("/", (req, res) => {
  const patientId = req.query.patientId as string;
  const events = auditLog
    .filter((e) => e.patientId === patientId)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  res.json({ events });
});

export default router;
