import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VisitNote, AuditEvent } from "@/api/client";
import { AuditLog } from "./AuditLog";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface VisitHistoryProps {
  notes: VisitNote[];
  auditEvents: AuditEvent[];
}

function getVisitType(note: VisitNote): {
  label: string;
  className: string;
} {
  const planStart = note.plan.slice(0, 30).toLowerCase();
  if (
    planStart.includes("follow-up") ||
    planStart.includes("follow up") ||
    planStart.includes("routine")
  ) {
    return {
      label: "Routine Follow-up",
      className: "bg-green-50 text-green-700 border-green-200",
    };
  }
  if (planStart.includes("acute") || planStart.includes("urgent")) {
    return {
      label: "Acute Care",
      className: "bg-red-50 text-red-700 border-red-200",
    };
  }
  if (planStart.includes("specialist") || planStart.includes("referral")) {
    return {
      label: "Specialist Consult",
      className: "bg-violet-50 text-violet-700 border-violet-200",
    };
  }
  return {
    label: "Visit Note",
    className: "bg-gray-50 text-gray-700 border-gray-200",
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function VisitHistory({ notes, auditEvents }: VisitHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-gray-600" />
          Visit History
        </CardTitle>
        <span className="text-xs text-gray-400">{notes.length} notes</span>
      </CardHeader>
      <CardContent className="p-0">
        {notes.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No visit notes yet.
          </p>
        ) : (
          notes.map((note) => {
            const type = getVisitType(note);
            const expanded = expandedId === note.id;
            return (
              <div key={note.id} className="border-b last:border-0">
                <div className="flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50">
                  <div className="min-w-[80px]">
                    <p className="text-xs text-gray-500">
                      {formatDate(note.createdAt)}
                    </p>
                    <Badge
                      className={cn(
                        "mt-1 border text-[10px]",
                        type.className
                      )}
                    >
                      {type.label}
                    </Badge>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-gray-600">
                      {note.subjective.length > 90
                        ? `${note.subjective.slice(0, 90)}…`
                        : note.subjective}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Dr. Sarah Adams · Medical Office Visit
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600"
                    onClick={() =>
                      setExpandedId(expanded ? null : note.id)
                    }
                  >
                    View Full Note
                  </Button>
                </div>
                {expanded && (
                  <div className="mx-4 mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
                    <p className="mb-2 font-semibold text-blue-700">
                      SUBJECTIVE
                    </p>
                    <p className="mb-3 whitespace-pre-wrap text-gray-600">
                      {note.subjective}
                    </p>
                    <p className="mb-2 font-semibold text-green-700">
                      OBJECTIVE
                    </p>
                    <p className="mb-3 whitespace-pre-wrap text-gray-600">
                      {note.objective}
                    </p>
                    <p className="mb-2 font-semibold text-amber-700">
                      ASSESSMENT
                    </p>
                    <p className="mb-3 whitespace-pre-wrap text-gray-600">
                      {note.assessment}
                    </p>
                    <p className="mb-2 font-semibold text-violet-700">PLAN</p>
                    <p className="whitespace-pre-wrap text-gray-600">
                      {note.plan}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
        <AuditLog events={auditEvents} />
      </CardContent>
    </Card>
  );
}
