import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export function BlockDialog({
  open,
  onOpenChange,
  userId,
  handle,
  onBlocked,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  handle: string;
  onBlocked?: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const block = useMutation({
    mutationFn: () => api.post(`/blocks/${userId}`),
    onSuccess: () => {
      toast({ title: `Blocked @${handle}`, description: "You can unblock them in Settings → Blocked accounts." });
      // Anything that might show their content needs a refetch.
      qc.invalidateQueries();
      onOpenChange(false);
      onBlocked?.();
    },
    onError: (e) => toast({ title: "Couldn't block", description: (e as Error).message, variant: "destructive" }),
  });
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Block @{handle}?</AlertDialogTitle>
          <AlertDialogDescription>
            They won't be able to see your profile or posts, follow you, or message you, and you won't see theirs.
            They won't be told you blocked them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); block.mutate(); }}
            disabled={block.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Block
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
