const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

let currentRole = "doctor";

export function setRole(role: string) {
  currentRole = role;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  clinicalDetail: string;
}

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

export interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface ApiError {
  error: string;
  message: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-user-role": currentRole,
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = data as ApiError;
    throw { status: res.status, ...err };
  }

  return data as T;
}

export function getPatient() {
  return request<{ patient: Patient }>("/api/patient");
}

export function generateNote(transcript: string, patientId: string) {
  return request<{ visitId: string; soap: SoapNote }>("/api/notes/generate", {
    method: "POST",
    body: JSON.stringify({ transcript, patientId }),
  });
}

export function saveNote(payload: {
  visitId: string;
  patientId: string;
  transcript: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}) {
  return request<{ note: VisitNote }>("/api/notes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getNotes(patientId: string) {
  return request<{ notes: VisitNote[] }>(
    `/api/notes?patientId=${encodeURIComponent(patientId)}`
  );
}

export function getAudit(patientId: string) {
  return request<{ events: AuditEvent[] }>(
    `/api/audit?patientId=${encodeURIComponent(patientId)}`
  );
}
