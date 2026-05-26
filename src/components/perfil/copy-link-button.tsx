"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function handle() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <Button variant="default" onClick={handle} className="shrink-0">
      {copied ? (
        <>
          <Check className="size-4" aria-hidden /> Copiado
        </>
      ) : (
        <>
          <Copy className="size-4" aria-hidden /> Copiar link
        </>
      )}
    </Button>
  );
}
