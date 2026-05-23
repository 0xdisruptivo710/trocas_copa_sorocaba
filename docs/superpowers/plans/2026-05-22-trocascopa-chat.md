# TrocasCopa — Plano 4: Chat + Realtime

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar o loop social do TrocasCopa — usuário abre o perfil de um match, clica "Conversar", entra em chat 1:1 com mensagens entregues em tempo real. Lista de conversas em `/chat`, thread em `/chat/[id]`.

**Architecture:** Tabela `trocas_chats` armazena pares ordenados (user_a < user_b) com `last_message_at` mantido por trigger. `trocas_messages` é append-only, lida por participantes via RLS. RPC `trocas_open_chat(other_user)` é `SECURITY DEFINER` (pra contornar `INSERT` revogado). Cliente assina `postgres_changes` de `trocas_messages` filtrado por `chat_id` (Supabase Realtime). Marcação de lidas via Server Action no `useEffect` quando thread abre.

**Tech Stack:** Next.js 16 RSC + client component pra Realtime, Supabase Realtime (`postgres_changes` channel), `@supabase/ssr` no servidor, `@supabase/supabase-js` no cliente (já instalado).

**Decisões de UX:**
- Composer: Enter envia (mobile); botão de avião também sempre disponível.
- Sem indicador "Lido pelo outro" no MVP (apenas tracking interno via `read_at` pra futuras contagens não-lidas).
- Botão "Conversar" no perfil público abre o chat (cria se necessário).
- Lista `/chat` ordena por `last_message_at desc`, mostra avatar + nome + preview da última msg + tempo relativo.

**Referência:** Spec em `docs/superpowers/specs/2026-05-19-trocascopa-design.md` (seções 4.6, 4.7, 4.9, 5.4, 5.5, 6, 7.4).

---

## Estrutura de arquivos esperada ao fim do plano

```
supabase/migrations/
├── 20260522_0012_trocas_chats.sql
├── 20260522_0013_trocas_messages.sql
├── 20260522_0014_trocas_open_chat.sql
└── 20260522_0015_trocas_realtime.sql

src/types/supabase.ts                          (estendido com 2 tabelas + RPC)

src/lib/chat/
├── data.ts              (listChats, getChatThread, getOtherParticipant)
└── format.ts            (formatRelativeTime)

src/lib/actions/
└── chat.ts              (openChatAction, sendMessageAction, markReadAction)

src/components/chat/
├── chat-list-item.tsx       (avatar + nome + última msg + tempo)
├── message-bubble.tsx       (balão verde/branco com timestamp)
├── message-composer.tsx     (textarea + botão enviar)
└── chat-thread.tsx          (client component: Realtime + auto-scroll + mark-read)

src/app/(app)/chat/
├── page.tsx                 (substitui placeholder — lista)
└── [id]/page.tsx            (thread)

src/app/u/[username]/page.tsx  (modify: substitui card "em breve" por ConversarButton)

src/components/perfil/
└── conversar-button.tsx     (client: chama openChatAction → redireciona pra /chat/{id})
```

---

## Fase 1 — DB

### Task 1: Migration `trocas_chats`

**Files:**
- Create: `supabase/migrations/20260522_0012_trocas_chats.sql`

- [ ] **Step 1.1: SQL da tabela + RLS**

```sql
create table public.trocas_chats (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.trocas_profiles(id) on delete cascade,
  user_b uuid not null references public.trocas_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  check (user_a < user_b),
  unique (user_a, user_b)
);

create index trocas_chats_user_a_idx on public.trocas_chats (user_a, last_message_at desc);
create index trocas_chats_user_b_idx on public.trocas_chats (user_b, last_message_at desc);

alter table public.trocas_chats enable row level security;

create policy "trocas_chats read participants"
  on public.trocas_chats for select
  using (auth.uid() in (user_a, user_b));

-- INSERT só via RPC trocas_open_chat (SECURITY DEFINER)
revoke insert, update, delete on public.trocas_chats from public, anon, authenticated;
```

- [ ] **Step 1.2: Aplicar via MCP**

```
mcp__claude_ai_Supabase__apply_migration
  project_id: ehlpmukjdknnyhkycncb
  name: trocas_chats
  query: <conteúdo>
```

- [ ] **Step 1.3: Commit**

```bash
git add supabase/migrations/20260522_0012_trocas_chats.sql
git commit -m "feat(db): trocas_chats with ordered participants invariant"
```

---

### Task 2: Migration `trocas_messages` + trigger

**Files:**
- Create: `supabase/migrations/20260522_0013_trocas_messages.sql`

- [ ] **Step 2.1: SQL**

```sql
create table public.trocas_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.trocas_chats(id) on delete cascade,
  sender_id uuid not null references public.trocas_profiles(id),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index trocas_messages_chat_created_idx
  on public.trocas_messages (chat_id, created_at desc);

create index trocas_messages_unread_idx
  on public.trocas_messages (chat_id) where read_at is null;

alter table public.trocas_messages enable row level security;

create policy "trocas_messages read participants"
  on public.trocas_messages for select using (
    exists (
      select 1 from public.trocas_chats c
      where c.id = chat_id and auth.uid() in (c.user_a, c.user_b)
    )
  );

create policy "trocas_messages send as self"
  on public.trocas_messages for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.trocas_chats c
      where c.id = chat_id and auth.uid() in (c.user_a, c.user_b)
    )
  );

create policy "trocas_messages mark read by receiver"
  on public.trocas_messages for update using (
    exists (
      select 1 from public.trocas_chats c
      where c.id = chat_id and auth.uid() in (c.user_a, c.user_b)
    )
  ) with check (sender_id <> auth.uid());

-- Trigger: atualiza chats.last_message_at quando uma msg é inserida
create or replace function public.trocas_bump_chat_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.trocas_chats
    set last_message_at = new.created_at
    where id = new.chat_id;
  return new;
end $$;

create trigger trocas_messages_bump_chat
  after insert on public.trocas_messages
  for each row execute function public.trocas_bump_chat_last_message();
```

- [ ] **Step 2.2: Aplicar via MCP** com `name: trocas_messages`.

- [ ] **Step 2.3: Commit**

```bash
git add supabase/migrations/20260522_0013_trocas_messages.sql
git commit -m "feat(db): trocas_messages with RLS, indexes, last_message_at trigger"
```

---

### Task 3: RPC `trocas_open_chat`

**Files:**
- Create: `supabase/migrations/20260522_0014_trocas_open_chat.sql`

- [ ] **Step 3.1: SQL**

```sql
create or replace function public.trocas_open_chat(other_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
  a uuid;
  b uuid;
  chat_id uuid;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if me = other_user then
    raise exception 'cannot open chat with self' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.trocas_profiles where id = other_user) then
    raise exception 'other user not found' using errcode = 'P0002';
  end if;

  if me < other_user then
    a := me; b := other_user;
  else
    a := other_user; b := me;
  end if;

  insert into public.trocas_chats (user_a, user_b)
  values (a, b)
  on conflict (user_a, user_b) do update set last_message_at = trocas_chats.last_message_at
  returning id into chat_id;

  return chat_id;
end $$;

revoke execute on function public.trocas_open_chat(uuid) from public, anon;
grant execute on function public.trocas_open_chat(uuid) to authenticated;
```

- [ ] **Step 3.2: Aplicar via MCP** com `name: trocas_open_chat`.

- [ ] **Step 3.3: Commit**

```bash
git add supabase/migrations/20260522_0014_trocas_open_chat.sql
git commit -m "feat(db): trocas_open_chat RPC (get-or-create chat between users)"
```

---

### Task 4: Habilitar Realtime publication

**Files:**
- Create: `supabase/migrations/20260522_0015_trocas_realtime.sql`

- [ ] **Step 4.1: Adicionar tabela à publication `supabase_realtime`**

```sql
-- A publication 'supabase_realtime' já existe por default no Supabase.
-- Adiciona apenas INSERT events em trocas_messages (não precisa de UPDATE/DELETE
-- pra MVP — read_at é fetchado quando o cliente abre a thread).
alter publication supabase_realtime add table public.trocas_messages;
```

- [ ] **Step 4.2: Aplicar via MCP** com `name: trocas_realtime`.

- [ ] **Step 4.3: Verificar**

```
mcp__claude_ai_Supabase__execute_sql
  query: "select schemaname, tablename from pg_publication_tables where pubname='supabase_realtime' and tablename like 'trocas_%';"
```

Expected: linha com `trocas_messages`.

- [ ] **Step 4.4: Commit**

```bash
git add supabase/migrations/20260522_0015_trocas_realtime.sql
git commit -m "feat(db): enable Realtime publication on trocas_messages"
```

---

### Task 5: Atualizar `src/types/supabase.ts`

**Files:**
- Modify: `src/types/supabase.ts`

- [ ] **Step 5.1: Adicionar 2 tabelas no `Tables:`**

Antes de `trocas_user_stickers`, adicione:

```ts
      trocas_chats: {
        Row: {
          id: string;
          user_a: string;
          user_b: string;
          created_at: string;
          last_message_at: string;
        };
        Insert: {
          id?: string;
          user_a: string;
          user_b: string;
          created_at?: string;
          last_message_at?: string;
        };
        Update: Partial<{
          id: string;
          user_a: string;
          user_b: string;
          created_at: string;
          last_message_at: string;
        }>;
        Relationships: [];
      };
      trocas_messages: {
        Row: {
          id: string;
          chat_id: string;
          sender_id: string;
          body: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          chat_id: string;
          sender_id: string;
          body: string;
          created_at?: string;
          read_at?: string | null;
        };
        Update: Partial<{
          id: string;
          chat_id: string;
          sender_id: string;
          body: string;
          created_at: string;
          read_at: string | null;
        }>;
        Relationships: [];
      };
```

- [ ] **Step 5.2: Adicionar RPC `trocas_open_chat` em `Functions`**

Dentro de `Functions`, depois de `trocas_find_matches`, adicione:

```ts
      trocas_open_chat: {
        Args: {
          other_user: string;
        };
        Returns: string;
      };
```

- [ ] **Step 5.3: Build**

```bash
npm run build
```

Expected: passa.

- [ ] **Step 5.4: Commit**

```bash
git add src/types/supabase.ts
git commit -m "types: extend Database with chats, messages, open_chat RPC"
```

---

## Fase 2 — Server-side

### Task 6: `lib/chat/format.ts` — helpers de tempo

**Files:**
- Create: `src/lib/chat/format.ts`

- [ ] **Step 6.1: Util**

```ts
export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "agora";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} h`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} d`;

  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function formatHour(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
```

- [ ] **Step 6.2: Commit**

```bash
git add src/lib/chat/format.ts
git commit -m "feat(chat): relative time + hour formatters"
```

---

### Task 7: `lib/chat/data.ts` — fetchers

**Files:**
- Create: `src/lib/chat/data.ts`

- [ ] **Step 7.1: Tipos e funções**

```ts
import { createClient } from "@/lib/supabase/server";

export interface ChatListItem {
  chat_id: string;
  other_id: string;
  other_username: string;
  other_full_name: string;
  other_avatar_url: string | null;
  last_message: string | null;
  last_message_at: string;
  unread_count: number;
  last_sender_was_me: boolean;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface ChatThread {
  chat_id: string;
  me_id: string;
  other_id: string;
  other_username: string;
  other_full_name: string;
  other_avatar_url: string | null;
  messages: ChatMessage[];
}

export async function listChats(userId: string): Promise<ChatListItem[]> {
  const supabase = await createClient();

  const { data: chats, error } = await supabase
    .from("trocas_chats")
    .select("id, user_a, user_b, last_message_at")
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order("last_message_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  const chatRows = chats ?? [];
  if (chatRows.length === 0) return [];

  const otherIds = chatRows.map((c) => (c.user_a === userId ? c.user_b : c.user_a));
  const { data: profiles, error: pErr } = await supabase
    .from("trocas_public_profiles")
    .select("id, username, full_name, avatar_url")
    .in("id", otherIds);
  if (pErr) throw pErr;

  const profMap = new Map((profiles ?? []).map((p) => [p.id, p] as const));

  // Pega a última msg de cada chat (uma query única usando "DISTINCT ON" não dá
  // bem via supabase-js; aceitamos 1 query por chat — 50 chats max).
  const chatIds = chatRows.map((c) => c.id);
  const { data: allMsgs, error: mErr } = await supabase
    .from("trocas_messages")
    .select("chat_id, sender_id, body, created_at, read_at")
    .in("chat_id", chatIds)
    .order("created_at", { ascending: false });
  if (mErr) throw mErr;

  // Agrupa por chat_id: primeira msg (mais recente) e contagem de não-lidas
  const byChat = new Map<
    string,
    { last: { body: string; sender_id: string; created_at: string } | null; unread: number }
  >();
  for (const c of chatRows) byChat.set(c.id, { last: null, unread: 0 });
  for (const m of allMsgs ?? []) {
    const entry = byChat.get(m.chat_id);
    if (!entry) continue;
    if (entry.last === null) {
      entry.last = {
        body: m.body,
        sender_id: m.sender_id,
        created_at: m.created_at,
      };
    }
    if (m.read_at === null && m.sender_id !== userId) {
      entry.unread += 1;
    }
  }

  return chatRows.map((c) => {
    const otherId = c.user_a === userId ? c.user_b : c.user_a;
    const prof = profMap.get(otherId);
    const agg = byChat.get(c.id);
    return {
      chat_id: c.id,
      other_id: otherId,
      other_username: prof?.username ?? "?",
      other_full_name: prof?.full_name ?? "Colecionador",
      other_avatar_url: prof?.avatar_url ?? null,
      last_message: agg?.last?.body ?? null,
      last_message_at: c.last_message_at,
      unread_count: agg?.unread ?? 0,
      last_sender_was_me: agg?.last?.sender_id === userId,
    };
  });
}

export async function getChatThread(
  userId: string,
  chatId: string,
): Promise<ChatThread | null> {
  const supabase = await createClient();

  const { data: chat, error: cErr } = await supabase
    .from("trocas_chats")
    .select("id, user_a, user_b")
    .eq("id", chatId)
    .maybeSingle();
  if (cErr) throw cErr;
  if (!chat) return null;
  if (chat.user_a !== userId && chat.user_b !== userId) return null;

  const otherId = chat.user_a === userId ? chat.user_b : chat.user_a;

  const [profileRes, messagesRes] = await Promise.all([
    supabase
      .from("trocas_public_profiles")
      .select("id, username, full_name, avatar_url")
      .eq("id", otherId)
      .maybeSingle(),
    supabase
      .from("trocas_messages")
      .select("id, chat_id, sender_id, body, created_at, read_at")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .limit(200),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (messagesRes.error) throw messagesRes.error;

  return {
    chat_id: chat.id,
    me_id: userId,
    other_id: otherId,
    other_username: profileRes.data?.username ?? "?",
    other_full_name: profileRes.data?.full_name ?? "Colecionador",
    other_avatar_url: profileRes.data?.avatar_url ?? null,
    messages: messagesRes.data ?? [],
  };
}
```

- [ ] **Step 7.2: Build check**

```bash
npm run build
```

- [ ] **Step 7.3: Commit**

```bash
git add src/lib/chat/data.ts
git commit -m "feat(chat): server data fetchers (list, thread)"
```

---

### Task 8: `lib/actions/chat.ts` — Server Actions

**Files:**
- Create: `src/lib/actions/chat.ts`

- [ ] **Step 8.1: Actions**

```ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string };

export async function openChatAction(otherUserId: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };
  if (user.id === otherUserId) return { error: "Não dá pra conversar consigo." };

  const { data, error } = await supabase.rpc("trocas_open_chat", {
    other_user: otherUserId,
  });
  if (error) return { error: error.message };
  if (!data) return { error: "Falha ao abrir chat." };

  redirect(`/chat/${data}`);
}

export async function sendMessageAction(
  chatId: string,
  body: string,
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const trimmed = body.trim();
  if (trimmed.length === 0) return { error: "Mensagem vazia." };
  if (trimmed.length > 2000) return { error: "Mensagem muito longa." };

  const { error } = await supabase.from("trocas_messages").insert({
    chat_id: chatId,
    sender_id: user.id,
    body: trimmed,
  });
  if (error) return { error: error.message };

  revalidatePath(`/chat/${chatId}`);
  revalidatePath("/chat");
  return {};
}

export async function markReadAction(chatId: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("trocas_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("chat_id", chatId)
    .neq("sender_id", user.id)
    .is("read_at", null);
  if (error) return { error: error.message };

  revalidatePath("/chat");
  return {};
}
```

- [ ] **Step 8.2: Commit**

```bash
git add src/lib/actions/chat.ts
git commit -m "feat(chat): server actions (open, send, markRead)"
```

---

## Fase 3 — UI components

### Task 9: `ChatListItem`

**Files:**
- Create: `src/components/chat/chat-list-item.tsx`

- [ ] **Step 9.1: Componente**

```tsx
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/chat/format";
import type { ChatListItem as Item } from "@/lib/chat/data";

export function ChatListItem({ item }: { item: Item }) {
  const initials = item.other_full_name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const preview = item.last_message
    ? `${item.last_sender_was_me ? "Você: " : ""}${item.last_message}`
    : "Conversa aberta — diga oi!";

  return (
    <Link href={`/chat/${item.chat_id}`} className="block">
      <Card className="flex items-center gap-3 p-3 transition-colors hover:bg-accent">
        <Avatar className="size-12 shrink-0">
          <AvatarImage src={item.other_avatar_url ?? undefined} alt={item.other_full_name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-semibold">{item.other_full_name}</p>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatRelativeTime(item.last_message_at)}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-xs text-muted-foreground">{preview}</p>
            {item.unread_count > 0 && (
              <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                {item.unread_count}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 9.2: Commit**

```bash
git add src/components/chat/chat-list-item.tsx
git commit -m "feat(chat): ChatListItem with avatar, last msg, unread badge"
```

---

### Task 10: `MessageBubble` + `MessageComposer`

**Files:**
- Create: `src/components/chat/message-bubble.tsx`, `src/components/chat/message-composer.tsx`

- [ ] **Step 10.1: MessageBubble**

```tsx
import { formatHour } from "@/lib/chat/format";

interface Props {
  body: string;
  createdAt: string;
  isMine: boolean;
}

export function MessageBubble({ body, createdAt, isMine }: Props) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 ${
          isMine
            ? "bg-primary text-primary-foreground"
            : "bg-card border border-border"
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-sm">{body}</p>
        <p
          className={`mt-1 text-right text-[10px] ${
            isMine ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          {formatHour(createdAt)}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 10.2: MessageComposer**

```tsx
"use client";

import { useState, useTransition, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sendMessageAction } from "@/lib/actions/chat";

export function MessageComposer({ chatId }: { chatId: string }) {
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const send = () => {
    const text = body.trim();
    if (!text || pending) return;
    setBody("");
    start(async () => {
      const r = await sendMessageAction(chatId, text);
      if (r.error) {
        toast.error(r.error);
        setBody(text);
      }
      textareaRef.current?.focus();
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <form
      className="sticky bottom-16 z-40 flex items-end gap-2 border-t bg-background/95 p-3 backdrop-blur"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Mensagem"
        rows={1}
        maxLength={2000}
        className="min-h-9 flex-1 resize-none rounded-md border border-border bg-card px-3 py-2 text-sm"
      />
      <Button
        type="submit"
        size="sm"
        disabled={pending || body.trim().length === 0}
        aria-label="Enviar"
      >
        <Send className="size-4" aria-hidden />
      </Button>
    </form>
  );
}
```

- [ ] **Step 10.3: Commit**

```bash
git add src/components/chat/
git commit -m "feat(chat): MessageBubble + MessageComposer (Enter to send)"
```

---

### Task 11: `ChatThread` — client component com Realtime

**Files:**
- Create: `src/components/chat/chat-thread.tsx`

- [ ] **Step 11.1: Componente client**

```tsx
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageBubble } from "./message-bubble";
import { markReadAction } from "@/lib/actions/chat";
import type { ChatMessage } from "@/lib/chat/data";

interface Props {
  chatId: string;
  meId: string;
  initialMessages: ChatMessage[];
}

export function ChatThread({ chatId, meId, initialMessages }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [, start] = useTransition();

  // Subscribe to realtime INSERTs for this chat
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trocas_messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.some((p) => p.id === m.id) ? prev : [...prev, m],
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  // Mark unread as read on open (and whenever a new msg arrives from the other side)
  useEffect(() => {
    const hasUnread = messages.some(
      (m) => m.sender_id !== meId && m.read_at === null,
    );
    if (!hasUnread) return;
    start(() => {
      markReadAction(chatId);
    });
  }, [messages, meId, chatId]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-12 text-center text-sm text-muted-foreground">
        Nenhuma mensagem ainda — mande uma proposta de troca!
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          body={m.body}
          createdAt={m.created_at}
          isMine={m.sender_id === meId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
```

- [ ] **Step 11.2: Commit**

```bash
git add src/components/chat/chat-thread.tsx
git commit -m "feat(chat): ChatThread client with Realtime + auto-scroll + auto markRead"
```

---

## Fase 4 — Páginas + integração

### Task 12: `/chat` — lista de conversas

**Files:**
- Modify: `src/app/(app)/chat/page.tsx` (substituir placeholder)

- [ ] **Step 12.1: Substituir o placeholder**

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listChats } from "@/lib/chat/data";
import { ChatListItem } from "@/components/chat/chat-list-item";
import { Card } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const chats = await listChats(user.id);

  return (
    <main className="space-y-4 px-6 py-6">
      <header>
        <h1 className="text-2xl font-semibold">Chat</h1>
        <p className="text-sm text-muted-foreground">
          {chats.length === 0
            ? "Suas conversas aparecem aqui"
            : `${chats.length} ${chats.length === 1 ? "conversa" : "conversas"}`}
        </p>
      </header>

      {chats.length === 0 ? (
        <Card className="space-y-2 p-6 text-center">
          <MessageCircle className="mx-auto size-8 text-muted-foreground" />
          <h2 className="font-semibold">Sem conversas ainda</h2>
          <p className="text-sm text-muted-foreground">
            Abre o perfil de um match em Explorar e clica em &quot;Conversar&quot;.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {chats.map((c) => (
            <li key={c.chat_id}>
              <ChatListItem item={c} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
```

- [ ] **Step 12.2: Build**

```bash
npm run build
```

- [ ] **Step 12.3: Commit**

```bash
git add src/app/\(app\)/chat/page.tsx
git commit -m "feat(chat): /chat page with conversation list and empty state"
```

---

### Task 13: `/chat/[id]` — thread

**Files:**
- Create: `src/app/(app)/chat/[id]/page.tsx`

- [ ] **Step 13.1: Página**

```tsx
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getChatThread } from "@/lib/chat/data";
import { ChatThread } from "@/components/chat/chat-thread";
import { MessageComposer } from "@/components/chat/message-composer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatThreadPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const thread = await getChatThread(user.id, id);
  if (!thread) notFound();

  const initials = thread.other_full_name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] flex-col">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/95 px-3 py-2 backdrop-blur">
        <Link
          href="/chat"
          aria-label="Voltar"
          className="-ml-1 rounded p-1 hover:bg-accent"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <Link href={`/u/${thread.other_username}`} className="flex flex-1 items-center gap-2">
          <Avatar className="size-8">
            <AvatarImage src={thread.other_avatar_url ?? undefined} alt={thread.other_full_name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{thread.other_full_name}</p>
            <p className="text-xs text-muted-foreground">@{thread.other_username}</p>
          </div>
        </Link>
      </header>

      <ChatThread chatId={thread.chat_id} meId={thread.me_id} initialMessages={thread.messages} />

      <MessageComposer chatId={thread.chat_id} />
    </main>
  );
}
```

- [ ] **Step 13.2: Build**

```bash
npm run build
```

- [ ] **Step 13.3: Commit**

```bash
git add src/app/\(app\)/chat/\[id\]/page.tsx
git commit -m "feat(chat): /chat/[id] thread with sticky header and composer"
```

---

### Task 14: Botão "Conversar" no perfil público

**Files:**
- Create: `src/components/perfil/conversar-button.tsx`
- Modify: `src/app/u/[username]/page.tsx`

- [ ] **Step 14.1: Componente client**

`src/components/perfil/conversar-button.tsx`:

```tsx
"use client";

import { useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { openChatAction } from "@/lib/actions/chat";

export function ConversarButton({ otherUserId }: { otherUserId: string }) {
  const [pending, start] = useTransition();

  const onClick = () => {
    start(async () => {
      const r = await openChatAction(otherUserId);
      if (r?.error) toast.error(r.error);
      // Em caso de sucesso, openChatAction redireciona (throws), então
      // não chegamos aqui.
    });
  };

  return (
    <Button onClick={onClick} disabled={pending} className="w-full" size="lg">
      <MessageCircle className="mr-2 size-4" aria-hidden />
      {pending ? "Abrindo…" : "Conversar"}
    </Button>
  );
}
```

- [ ] **Step 14.2: Substituir o card "em breve"**

Em `src/app/u/[username]/page.tsx`, encontre este bloco:

```tsx
      <section className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
        <p className="font-medium">Chat em breve (Plano 4)</p>
        <p className="text-muted-foreground">
          Por enquanto você consegue ver os matches e o preview da troca. O chat
          direto chega na próxima fase.
        </p>
      </section>
```

E substitua por:

```tsx
      <ConversarButton otherUserId={profile.id} />
```

E adicione no topo do arquivo, junto aos outros imports:

```tsx
import { ConversarButton } from "@/components/perfil/conversar-button";
```

- [ ] **Step 14.3: Build + smoke**

```bash
npm run build
```

- [ ] **Step 14.4: Commit**

```bash
git add src/components/perfil/conversar-button.tsx src/app/u/\[username\]/page.tsx
git commit -m "feat(perfil): ConversarButton replaces 'em breve' card"
```

---

## Checklist de aceitação do Plano 4

- [ ] `npm run build` passa.
- [ ] `select count(*) from pg_proc where proname = 'trocas_open_chat';` retorna 1.
- [ ] `trocas_messages` aparece em `pg_publication_tables where pubname='supabase_realtime'`.
- [ ] Botão "Conversar" no `/u/{username}` abre `/chat/{id}` (cria o chat se não existir, senão reusa).
- [ ] `/chat` lista as conversas ordenadas por `last_message_at desc`.
- [ ] Conversa nova mostra preview "Conversa aberta — diga oi!".
- [ ] Enviar uma mensagem aparece imediatamente no remetente.
- [ ] Em outra aba/dispositivo logada como o destinatário, a mensagem aparece sem refresh (Realtime).
- [ ] Badge de não-lidas mostra contagem na lista `/chat`.
- [ ] Ao abrir uma thread, as não-lidas viram lidas (badge some).
- [ ] Pressionar Enter envia. Shift+Enter quebra linha.
- [ ] Voltar pra `/u/{user_id_proprio}` redireciona pra `/conta` (sem mudança).

---

## Testes end-to-end (2 abas / 2 usuários)

Pra ver Realtime funcionando, abre 2 navegadores ou perfis:

**Aba 1:** Seu user (`muriloaugustoatm`) → vai em `/explorar` → tap em `Tester Sorocaba`.

**Aba 2:** Aí está o problema — `testersorocaba` é um user fake sem senha. Pra logar nele:

```sql
-- Setar uma senha de teste no fake user
update auth.users
set encrypted_password = crypt('teste1234', gen_salt('bf'))
where email = 'tester.sorocaba@trocas-test.local';
```

Aí em aba anônima loga com `tester.sorocaba@trocas-test.local` / `teste1234`.

**Aba 1 → "Conversar"** → entra no chat. **Aba 1 envia "oi"** → aparece em **Aba 2** sem refresh.

---

## Próximas iterações sugeridas

Depois do Plano 4, o MVP está fechado. Próximos passos naturais (não-MVP):

- **Polish visual**: tema escuro, micro-interações, animações em mensagens novas.
- **Notificações push**: Web Push API pra avisar mensagens novas com app fechado.
- **Premium**: PIX integração + cupom de indicação + cashback (do design original).
- **Propostas formais de troca**: tabela `trocas_trades` com estados (proposed/accepted/completed) + UI específica de troca dentro do chat.
- **Deploy Vercel** pra ter URL pública e PWA instalável no celular.
