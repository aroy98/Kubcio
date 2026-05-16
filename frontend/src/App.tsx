import { useCallback, useEffect, useState } from "react";
import {
  getPatient,
  getNotes,
  getAudit,
  type Patient,
  type VisitNote,
  type AuditEvent,
  type SoapNote,
} from "@/api/client";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { TranscriptCard } from "@/components/TranscriptCard";
import { SoapEditor } from "@/components/SoapEditor";
import { VisitHistory } from "@/components/VisitHistory";

const PATIENT_ID = "pt-001";

function App() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [role, setRole] = useState<"doctor" | "nurse">("doctor");
  const [transcript, setTranscript] = useState("");
  const [visitId, setVisitId] = useState<string | null>(null);
  const [soap, setSoap] = useState<SoapNote | null>(null);
  const [notes, setNotes] = useState<VisitNote[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const loadNotesAndAudit = useCallback(async () => {
    try {
      const [notesRes, auditRes] = await Promise.all([
        getNotes(PATIENT_ID),
        getAudit(PATIENT_ID),
      ]);
      setNotes(notesRes.notes);
      setAuditEvents(auditRes.events);
    } catch {
      /* ignore refresh errors */
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [patientRes, notesRes, auditRes] = await Promise.all([
          getPatient(),
          getNotes(PATIENT_ID),
          getAudit(PATIENT_ID),
        ]);
        setPatient(patientRes.patient);
        setNotes(notesRes.notes);
        setAuditEvents(auditRes.events);
      } catch {
        setGlobalError("Failed to load application data.");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar patient={patient} role={role} onRoleChange={setRole} />
      <main className="ml-[240px] min-h-screen p-6">
        {globalError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {globalError}
          </div>
        )}
        <Topbar visitId={visitId} />
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <TranscriptCard
              transcript={transcript}
              onTranscriptChange={setTranscript}
              role={role}
              patientId={PATIENT_ID}
              generating={generating}
              onGeneratingChange={setGenerating}
              onGenerated={(id, generatedSoap) => {
                setVisitId(id);
                setSoap(generatedSoap);
                loadNotesAndAudit();
              }}
            />
            {soap && visitId && (
              <SoapEditor
                soap={soap}
                onSoapChange={setSoap}
                visitId={visitId}
                patientId={PATIENT_ID}
                transcript={transcript}
                role={role}
                saving={saving}
                onSavingChange={setSaving}
                lastSaved={lastSaved}
                onSaved={setLastSaved}
                onRefresh={loadNotesAndAudit}
              />
            )}
          </div>
          <VisitHistory notes={notes} auditEvents={auditEvents} />
        </div>
      </main>
    </div>
  );
}

export default App;
