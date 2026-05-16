import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { generateNote } from "@/api/client";
import type { SoapNote } from "@/api/client";
import { Loader2, Mic, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface TranscriptCardProps {
  transcript: string;
  onTranscriptChange: (value: string) => void;
  role: "doctor" | "nurse";
  patientId: string;
  generating: boolean;
  onGeneratingChange: (v: boolean) => void;
  onGenerated: (visitId: string, soap: SoapNote) => void;
}

export function TranscriptCard({
  transcript,
  onTranscriptChange,
  role,
  patientId,
  generating,
  onGeneratingChange,
  onGenerated,
}: TranscriptCardProps) {
  const charCount = transcript.length;
  const overLimit = charCount > 4800;

  const handleGenerate = async () => {
    onGeneratingChange(true);
    try {
      const result = await generateNote(transcript, patientId);
      onGenerated(result.visitId, result.soap);
      toast.success("SOAP note generated. Review before saving.");
    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e.status === 403) {
        toast.error("Access denied: Doctor role required.");
      } else if (e.status === 502) {
        toast.error("AI generation failed. Please try again.");
      } else if (e.status) {
        toast.error(
          (err as { message?: string }).message || "Generation failed."
        );
      } else {
        toast.error("Network error. Check your connection.");
      }
    } finally {
      onGeneratingChange(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mic className="h-4 w-4 text-gray-600" />
          Consultation Transcript
        </CardTitle>
        <Badge className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">
          AI-READY INPUT
        </Badge>
      </CardHeader>
      <CardContent>
        <Textarea
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          placeholder="Paste consultation transcript here. The AI will generate a structured SOAP note..."
          className="min-h-[110px] resize-y font-mono text-sm"
          maxLength={5000}
        />
        <div className="mt-3 flex items-center justify-between">
          <span
            className={cn(
              "text-xs text-gray-400",
              overLimit && "text-red-500"
            )}
          >
            {charCount} / 5000 characters
          </span>
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            disabled={
              transcript.length < 10 || role !== "doctor" || generating
            }
            title={
              role !== "doctor" ? "Only doctors can generate notes" : undefined
            }
            onClick={handleGenerate}
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate SOAP Note
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
