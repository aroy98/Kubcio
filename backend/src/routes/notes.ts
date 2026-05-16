import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { requireRole } from "../middleware/roleCheck";
import { generateSoapNote } from "../services/aiService";
import {
  visits,
  auditLog,
  VisitNote,
  PATIENT,
} from "../store/inMemoryStore";

const router = Router();

router.post(
  "/generate",
  requireRole(["doctor"]),
  [
    body("transcript")
      .isString()
      .isLength({ min: 10, max: 5000 })
      .withMessage("transcript must be 10-5000 characters"),
    body("patientId")
      .equals("pt-001")
      .withMessage("patientId must be pt-001"),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Validation",
        message: errors.array()[0]?.msg || "Invalid request",
      });
    }

    const { transcript, patientId } = req.body as {
      transcript: string;
      patientId: string;
    };

    try {
      const soap = await generateSoapNote(transcript);
      const visitId = `visit-${Date.now()}`;
      const now = new Date().toISOString();

      auditLog.push({
        id: `audit-${Date.now()}`,
        eventType: "NOTE_GENERATED",
        patientId,
        visitId,
        userRole: req.userRole!,
        timestamp: now,
        description: `SOAP note generated for patient ${PATIENT.name}`,
      });

      return res.json({ visitId, soap });
    } catch (err) {
      console.error("[AI Error]", err);
      if (err instanceof SyntaxError || (err as Error).message === "Invalid SOAP structure") {
        return res.status(502).json({
          error: "AIError",
          message: "Failed to parse AI response. Please try again.",
        });
      }
      return res.status(502).json({
        error: "AIError",
        message: "AI generation failed. Please check your API key.",
        detail: (err as Error).message,
      });
    }
  }
);

router.post(
  "/",
  requireRole(["doctor"]),
  async (req: Request, res: Response) => {
    const {
      visitId,
      patientId,
      transcript,
      subjective,
      objective,
      assessment,
      plan,
    } = req.body as Record<string, string>;

    const fields = [
      visitId,
      patientId,
      transcript,
      subjective,
      objective,
      assessment,
      plan,
    ];
    if (fields.some((f) => typeof f !== "string" || f.trim() === "")) {
      return res.status(400).json({
        error: "Validation",
        message: "All SOAP fields are required",
      });
    }

    const now = new Date().toISOString();
    const existingIdx = visits.findIndex((v) => v.id === visitId);

    let note: VisitNote;
    if (existingIdx >= 0) {
      note = {
        ...visits[existingIdx],
        subjective,
        objective,
        assessment,
        plan,
        transcript,
        updatedAt: now,
        savedBy: req.userRole!,
      };
      visits[existingIdx] = note;
    } else {
      note = {
        id: visitId,
        patientId,
        createdAt: now,
        updatedAt: now,
        subjective,
        objective,
        assessment,
        plan,
        savedBy: req.userRole!,
        transcript,
      };
      visits.push(note);
    }

    auditLog.push({
      id: `audit-${Date.now()}`,
      eventType: "NOTE_SAVED",
      patientId,
      visitId,
      userRole: req.userRole!,
      timestamp: now,
      description: `Visit note saved for patient ${PATIENT.name}`,
    });

    res.json({ note });
  }
);

router.get("/", (req, res) => {
  const patientId = req.query.patientId as string;
  const notes = visits
    .filter((v) => v.patientId === patientId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  res.json({ notes });
});

export default router;
