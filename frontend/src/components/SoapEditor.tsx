import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { saveNote } from "@/api/client";
import type { SoapNote } from "@/api/client";
import { AlertTriangle, ClipboardList, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";

interface SoapEditorProps {
  soap: SoapNote;
  onSoapChange: (soap: SoapNote) => void;
  visitId: string;
  patientId: string;
  transcript: string;
  role: "doctor" | "nurse";
  saving: boolean;
  onSavingChange: (v: boolean) => void;
  lastSaved: Date | null;
  onSaved: (savedAt: Date) => void;
  onRefresh: () => void;
}

const FIELDS: {
  key: keyof SoapNote;
  label: string;
  bar: string;
  text: string;
}[] = [
  { key: "subjective", label: "Subjective", bar: "bg-blue-600", text: "text-blue-700" },
  { key: "objective", label: "Objective", bar: "bg-emerald-600", text: "text-green-700" },
  { key: "assessment", label: "Assessment", bar: "bg-amber-500", text: "text-amber-700" },
  { key: "plan", label: "Plan", bar: "bg-violet-600", text: "text-violet-700" },
];

export function SoapEditor({
  soap,
  onSoapChange,
  visitId,
  patientId,
  transcript,
  role,
  saving,
  onSavingChange,
  lastSaved,
  onSaved,
  onRefresh,
}: SoapEditorProps) {
  const allFilled = Object.values(soap).every((v) => v.trim() !== "");

  const handleSave = async () => {
    onSavingChange(true);
    try {
      await saveNote({
        visitId,
        patientId,
        transcript,
        ...soap,
      });
      const now = new Date();
      onSaved(now);
      onRefresh();
      toast.success("Note saved to visit record.");
    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e.status === 403) {
        toast.error("Access denied: Doctor role required.");
      } else {
        toast.error("Failed to save note.");
      }
    } finally {
      onSavingChange(false);
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-4 w-4 text-gray-600" />
          SOAP Note
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-xs font-medium text-amber-800">
            AI-generated content — clinician review and editing required before
            saving to patient record.
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {FIELDS.map(({ key, label, bar, text }) => (
            <div key={key}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className={`h-3 w-[3px] rounded ${bar}`} />
                <span className={`text-xs font-semibold uppercase ${text}`}>
                  {label}
                </span>
              </div>
              <Textarea
                value={soap[key]}
                onChange={(e) =>
                  onSoapChange({ ...soap, [key]: e.target.value })
                }
                className="min-h-[100px] resize-y font-mono text-xs"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <span className="text-xs text-gray-400">
            {lastSaved
              ? `💾 Last saved: ${formatTime(lastSaved)}`
              : "💾 Last saved: never"}
          </span>
          <Button
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={!allFilled || role !== "doctor" || saving}
            onClick={handleSave}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Note
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
