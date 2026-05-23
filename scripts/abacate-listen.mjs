#!/usr/bin/env node
/**
 * Roda `abacatepay listen` apontando pro nosso /api/abacatepay com o
 * webhookSecret lido do .env.local. Evita ter que decorar o caminho.
 *
 * Uso:
 *   npm run abacate:listen
 *
 * Pré-requisitos:
 *   - Go instalado e abacatepay-cli no PATH
 *     (go install github.com/AbacatePay/abacatepay-cli@latest)
 *   - .env.local com TROCAS_WEBHOOK_SECRET preenchido
 *   - npm run dev rodando em outro terminal (porta 3000)
 *
 * O AbacatePay CLI deve estar logado (uma vez): abacatepay login
 */

import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";

function readEnvLocal() {
  const env = {};
  try {
    const content = readFileSync(".env.local", "utf8");
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/i);
      if (m) env[m[1]] = m[2];
    }
  } catch (e) {
    console.error("Erro ao ler .env.local:", e.message);
    process.exit(1);
  }
  return env;
}

const env = readEnvLocal();
const secret = env.TROCAS_WEBHOOK_SECRET;
if (!secret) {
  console.error("TROCAS_WEBHOOK_SECRET não encontrado em .env.local");
  process.exit(1);
}

const forwardTo = `http://localhost:3000/api/abacatepay?webhookSecret=${secret}`;
console.log(`→ Forwarding AbacatePay webhooks to: ${forwardTo}`);
console.log(`→ Press Ctrl+C to stop\n`);

const child = spawn("abacatepay", ["listen", "--forward-to", forwardTo], {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
child.on("error", (err) => {
  if (err.code === "ENOENT") {
    console.error(
      "\n❌ abacatepay CLI não encontrado.\n" +
        "   Instala com: go install github.com/AbacatePay/abacatepay-cli@latest\n" +
        "   E garante que $GOPATH/bin (ou %USERPROFILE%\\go\\bin no Windows) tá no PATH.",
    );
  } else {
    console.error("Erro:", err.message);
  }
  process.exit(1);
});
