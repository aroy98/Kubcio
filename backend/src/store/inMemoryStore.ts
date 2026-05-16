export const PATIENT = {
  id: "pt-001",
  name: "Margaret Chen",
  age: 58,
  gender: "Female",
  clinicalDetail: "Type 2 Diabetes (diagnosed 2018), Penicillin allergy",
};

export interface VisitNote {
  id: string;
  patientId: string;
  createdAt: string;
  updatedAt: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  savedBy: string;
  transcript: string;
}

export interface AuditEvent {
  id: string;
  eventType: "NOTE_GENERATED" | "NOTE_SAVED";
  patientId: string;
  visitId: string;
  userRole: string;
  timestamp: string;
  description: string;
}

export const visits: VisitNote[] = [];
export const auditLog: AuditEvent[] = [];
