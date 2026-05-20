"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { setAvatarAction } from "@/lib/actions/profile";

interface Props {
  avatarUrl: string | null;
  initials: string;
}

export function AvatarUpload({ avatarUrl, initials }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();

  const onPick = () => inputRef.current?.click();

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    start(async () => {
      const r = await setAvatarAction(fd);
      if (r.error) toast.error(r.error);
      else toast.success("Foto atualizada.");
    });
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16">
        <AvatarImage src={avatarUrl ?? undefined} alt="Avatar" />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <Button type="button" variant="outline" onClick={onPick} disabled={pending}>
        {pending ? "Enviando…" : "Trocar foto"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />
    </div>
  );
}
