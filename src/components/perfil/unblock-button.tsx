"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { unblockUserAction } from "@/lib/actions/moderation";

interface Props {
  otherUserId: string;
  otherName: string;
}

export function UnblockButton({ otherUserId, otherName }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handle() {
    startTransition(async () => {
      const result = await unblockUserAction(otherUserId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`@${otherName} desbloqueado.`);
        router.refresh();
      }
    });
  }

  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={handle}>
      {pending ? "..." : "Desbloquear"}
    </Button>
  );
}
