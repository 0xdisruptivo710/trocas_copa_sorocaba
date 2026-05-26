"use client";

import { useState } from "react";
import { MoreVertical, Flag, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReportDialog } from "./report-dialog";
import { BlockConfirmDialog } from "./block-confirm-dialog";

interface Props {
  otherUserId: string;
  otherName: string;
  chatId?: string | null;
  /** Após bloqueio: pra onde redireciona. */
  redirectAfterBlock?: string;
}

export function UserActionsMenu({
  otherUserId,
  otherName,
  chatId,
  redirectAfterBlock,
}: Props) {
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Mais ações sobre ${otherName}`}
            >
              <MoreVertical className="size-5" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => setReportOpen(true)}>
            <Flag className="size-4" aria-hidden />
            Reportar
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setBlockOpen(true)}>
            <UserX className="size-4" aria-hidden />
            Bloquear
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        otherUserId={otherUserId}
        otherName={otherName}
        chatId={chatId}
      />
      <BlockConfirmDialog
        open={blockOpen}
        onOpenChange={setBlockOpen}
        otherUserId={otherUserId}
        otherName={otherName}
        redirectTo={redirectAfterBlock}
      />
    </>
  );
}
