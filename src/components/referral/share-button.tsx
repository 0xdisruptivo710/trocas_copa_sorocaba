"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  username: string;
  siteUrl: string;
}

export function ShareButton({ username, siteUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const url = `${siteUrl}/cadastro?via=${username}`;
  const text = `Bora colecionar a Copa 2026? Cadastre no TrocasCopa com meu cupom e a gente ganha bônus 👇 ${url}`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não consegui copiar — copia manual.");
    }
  };

  const onShare = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: "TrocasCopa",
          text,
          url,
        });
        return;
      } catch {
        // user cancelled
      }
    }
    onCopy();
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" className="flex-1" onClick={onCopy}>
        {copied ? <Check className="mr-1 size-4" /> : <Copy className="mr-1 size-4" />}
        {copied ? "Copiado!" : "Copiar link"}
      </Button>
      <Button onClick={onShare} className="flex-1">
        <Share2 className="mr-1 size-4" />
        Compartilhar
      </Button>
    </div>
  );
}
