import { Badge } from "@/components/ui/badge";
import { setRole } from "@/api/client";
import type { Patient } from "@/api/client";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface SidebarProps {
  patient: Patient | null;
  role: "doctor" | "nurse";
  onRoleChange: (role: "doctor" | "nurse") => void;
}

export function Sidebar({ patient, role, onRoleChange }: SidebarProps) {
  const initials = patient
    ? patient.name
        .split(" ")
        .map((n) => n[0])
        .join("")
    : "MC";

  const handleRoleChange = (newRole: "doctor" | "nurse") => {
    onRoleChange(newRole);
    setRole(newRole);
    toast.success(
      `Role set to ${newRole}. Backend will enforce access.`
    );
  };

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-[240px] flex-col border-r border-gray-200 bg-white">
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-sm font-bold text-white">
            K
          </div>
          <span className="font-semibold text-gray-900">Kubcio</span>
        </div>

        {patient && (
          <div className="mx-3 mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                {initials}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{patient.name}</p>
                <p className="text-xs text-gray-500">
                  {patient.age} · {patient.gender}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                Penicillin Allergy
              </Badge>
              <Badge className="border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50">
                Type 2 Diabetes
              </Badge>
            </div>
          </div>
        )}

        <div className="mx-3 mt-3 rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-500">
          ⚠ Synthetic demo data only. No real patient information.
        </div>
      </div>

      <div className="mt-auto border-t border-gray-100 p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
            SA
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Dr. Sarah Adams</p>
            <p className="text-xs text-gray-500">Attending Physician</p>
          </div>
        </div>

        <p className="mb-2 text-[10px] uppercase tracking-wide text-gray-400">
          DEMO ROLE
        </p>
        <div className="flex rounded-lg bg-gray-100 p-1">
          {(["doctor", "nurse"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRoleChange(r)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 text-sm capitalize transition",
                role === r
                  ? "bg-white text-gray-900 shadow"
                  : "bg-transparent text-gray-500"
              )}
            >
              {r === "doctor" ? "Doctor" : "Nurse"}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
