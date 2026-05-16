import { useState } from "react";
import type { AuditEvent } from "@/api/client";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditLogProps {
  events: AuditEvent[];
}

export function AuditLog({ events }: AuditLogProps) {
  const [expanded, setExpanded] = useState(false);

  return (
  <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full cursor-pointer items-center gap-2 border-t px-4 py-2 hover:bg-gray-50"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
        )}
        <span className="text-xs font-medium text-gray-400">Audit Log</span>
        <span className="ml-auto text-[10px] text-gray-300">
          {events.length} events
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-3">
          {events.length === 0 ? (
            <p className="py-3 text-center text-xs text-gray-400">
              No audit events yet.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2 border-b py-1 text-[10px] uppercase tracking-wide text-gray-400">
                <span>Timestamp</span>
                <span>Event</span>
                <span>Role</span>
                <span>Description</span>
              </div>
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="grid grid-cols-4 gap-2 border-b py-1 text-[10px] text-gray-500 last:border-0"
                >
                  <span>
                    {new Date(ev.timestamp).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                        ev.eventType === "NOTE_GENERATED"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-green-50 text-green-700"
                      )}
                    >
                      {ev.eventType}
                    </span>
                  </span>
                  <span>{ev.userRole}</span>
                  <span>{ev.description}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
