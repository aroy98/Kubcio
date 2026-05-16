import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, HelpCircle, Search } from "lucide-react";

interface TopbarProps {
  visitId: string | null;
}

export function Topbar({ visitId }: TopbarProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3">
      <div className="flex items-center gap-3">
        <h1 className="font-semibold text-gray-900">Patient Visit Note</h1>
        <Separator orientation="vertical" className="h-5" />
        <span className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 font-mono text-[11px] text-gray-400">
          {visitId ?? "—"}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Search">
          <Search className="h-4 w-4 text-gray-500" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4 text-gray-500" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Help">
          <HelpCircle className="h-4 w-4 text-gray-500" />
        </Button>
      </div>
    </div>
  );
}
