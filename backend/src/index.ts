import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { attachRole } from "./middleware/roleCheck";
import patientRouter from "./routes/patient";
import notesRouter from "./routes/notes";
import auditRouter from "./routes/audit";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "x-user-role"],
  })
);

app.use(express.json());
app.use(attachRole);

app.use("/api/patient", patientRouter);
app.use("/api/notes", notesRouter);
app.use("/api/audit", auditRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "NotFound", message: "Route not found" });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({
    error: "InternalError",
    message: "Something went wrong",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
