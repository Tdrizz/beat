import { useState } from "react";
import { MoreHorizontal, Flag, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMe } from "@/hooks/useMe";
import { ReportDialog, type ReportTargetType } from "./ReportDialog";
import { BlockDialog } from "./BlockDialog";

// "⋯" menu offering Report (and Block for the author) on any piece of
// user-generated content. Renders nothing on your own content or when
// signed out.
export function ModerationMenu({
  targetType,
  targetId,
  author,
  onBlocked,
  className,
}: {
  targetType: ReportTargetType;
  targetId: string;
  author: { userId: string; handle: string } | null | undefined;
  onBlocked?: () => void;
  className?: string;
}) {
  const { data: me } = useMe();
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  if (!me || !author || author.userId === me.userId) return null;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className={`rounded-full h-8 w-8 p-0 ${className ?? ""}`} aria-label="More options">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setReportOpen(true)}>
            <Flag className="w-4 h-4 mr-2" /> Report {targetType === "user" ? "account" : targetType}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setBlockOpen(true)} className="text-destructive focus:text-destructive">
            <Ban className="w-4 h-4 mr-2" /> Block @{author.handle}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} targetType={targetType} targetId={targetId} />
      <BlockDialog
        open={blockOpen}
        onOpenChange={setBlockOpen}
        userId={author.userId}
        handle={author.handle}
        onBlocked={onBlocked}
      />
    </>
  );
}
