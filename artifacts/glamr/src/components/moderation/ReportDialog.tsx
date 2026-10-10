import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export type ReportTargetType = "post" | "comment" | "message" | "user";

const REASONS: Array<{ id: string; label: string }> = [
  { id: "harassment", label: "Bullying or harassment" },
  { id: "hate", label: "Hate speech or symbols" },
  { id: "nudity", label: "Nudity or sexual content" },
  { id: "violence", label: "Violence or threats" },
  { id: "self_harm", label: "Self-harm or suicide" },
  { id: "minor_safety", label: "Involves a minor" },
  { id: "impersonation", label: "Pretending to be someone else" },
  { id: "spam", label: "Spam or scam" },
  { id: "other", label: "Something else" },
];

const NOUN: Record<ReportTargetType, string> = {
  post: "post",
  comment: "comment",
  message: "message",
  user: "account",
};

export function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReportTargetType;
  targetId: string;
}) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const submit = useMutation({
    mutationFn: () => api.post("/reports", { targetType, targetId, reason, details: details.trim() || undefined }),
    onSuccess: () => {
      toast({ title: "Thanks for letting us know", description: "Our team will review this report." });
      onOpenChange(false);
      setReason("");
      setDetails("");
    },
    onError: (e) => toast({ title: "Couldn't send report", description: (e as Error).message, variant: "destructive" }),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report {NOUN[targetType]}</DialogTitle>
          <DialogDescription>Reports are anonymous. The person won't know who reported them.</DialogDescription>
        </DialogHeader>
        <RadioGroup value={reason} onValueChange={setReason} className="gap-2">
          {REASONS.map((r) => (
            <div key={r.id} className="flex items-center gap-2">
              <RadioGroupItem value={r.id} id={`reason-${r.id}`} />
              <Label htmlFor={`reason-${r.id}`} className="font-normal">{r.label}</Label>
            </div>
          ))}
        </RadioGroup>
        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Anything else we should know? (optional)"
          maxLength={1000}
          aria-label="Report details"
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!reason || submit.isPending} onClick={() => submit.mutate()}>
            {submit.isPending ? "Sending…" : "Send report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
