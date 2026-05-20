"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/lib/actions/profile";

interface Props {
  initial: { username: string; full_name: string; bio: string | null };
  nextHref?: string;
}

export function ProfileForm({ initial, nextHref }: Props) {
  const [pending, start] = useTransition();
  const router = useRouter();

  const submit = (formData: FormData) => {
    start(async () => {
      const result = await updateProfileAction(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Perfil salvo.");
      if (nextHref) router.push(nextHref);
    });
  };

  return (
    <form action={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Nome completo</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={initial.full_name}
          required
          minLength={2}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          defaultValue={initial.username}
          required
          pattern="^[a-z0-9_]{3,30}$"
        />
        <p className="text-xs text-muted-foreground">
          3-30 caracteres, minúsculas, números e _.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio (opcional)</Label>
        <Input id="bio" name="bio" defaultValue={initial.bio ?? ""} maxLength={280} />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Salvando…" : "Salvar e continuar"}
      </Button>
    </form>
  );
}
