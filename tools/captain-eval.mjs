#!/usr/bin/env node
// Captain × local Qwen — a repeatable chat experiment (runs on your Mac).
//
//   node tools/captain-eval.mjs                      # qwen3.5:4b, 1 run per line
//   node tools/captain-eval.mjs --model qwen3.5:9b --runs 3
//   node tools/captain-eval.mjs --temperature 0.5 --num-predict 80
//
// Talks only to Ollama on THIS computer (http://127.0.0.1:11434; no API key,
// no cloud). Uses the same system prompt, message format, cleaning and
// parameters as the app's optional dev provider (Public/js/captain-ai.mjs),
// and only the synthetic lines in docs/captain-ai/chat-cases.json.
// Changing temperature / top-p / length is inference tuning, not fine-tuning.
//
// Writes docs/captain-ai/results/<date>-<model>.md and .json: every reply, the
// time it took, tokens/s, and how much memory Ollama reports for the model.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import os from "node:os";
import * as AI from "../Public/js/captain-ai.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const model = arg("model", AI.DEFAULT_MODEL);
const endpoint = arg("endpoint", AI.DEFAULT_ENDPOINT).replace(/\/+$/, "");
const runs = Math.max(1, Math.min(5, Number(arg("runs", 1))));
const only = arg("only", "");
const params = {
  ...AI.PARAMS,
  temperature: Number(arg("temperature", AI.PARAMS.temperature)),
  top_p: Number(arg("top-p", AI.PARAMS.top_p)),
  num_predict: Number(arg("num-predict", AI.PARAMS.num_predict)),
};
if (!AI.isLoopback(endpoint)) {
  console.error("Only a model server on this computer (127.0.0.1 / localhost) is allowed.");
  process.exit(2);
}

const cases = JSON.parse(readFileSync(join(root, "docs/captain-ai/chat-cases.json"), "utf8")).cases.filter((c) => !only || c.id === only);

async function json(path, body) {
  const response = await fetch(`${endpoint}${path}`, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {});
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status} ${await response.text()}`);
  return response.json();
}
const sh = (cmd) => {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
};

let version;
try {
  version = (await json("/api/version")).version;
} catch (error) {
  console.error(`Ollama is not answering at ${endpoint}. Start it (open the Ollama app, or run: ollama serve) and try again.\n${error.message}`);
  process.exit(1);
}
const installed = (await json("/api/tags")).models?.map((m) => m.name) || [];
if (!installed.includes(model) && !installed.includes(`${model}:latest`)) {
  console.error(`The model "${model}" is not on this Mac yet. Installed: ${installed.join(", ") || "(none)"}\nDownload it with: ollama pull ${model}`);
  process.exit(1);
}

const machine = {
  chip: sh("sysctl -n machdep.cpu.brand_string") || os.cpus()[0]?.model || "",
  memoryGB: Math.round(os.totalmem() / 1024 ** 3),
  macOS: sh("sw_vers -productVersion"),
  ollama: version,
};
console.log(`Captain × ${model} on ${machine.chip} · ${machine.memoryGB} GB · macOS ${machine.macOS} · Ollama ${version}`);
console.log(`params: ${JSON.stringify(params)} · runs per line: ${runs}\n`);

// Load once (the first reply includes loading the model from disk).
const loadStart = Date.now();
await json("/api/chat", { model, messages: [{ role: "user", content: "hi" }], stream: false, think: false, keep_alive: "10m", options: { num_predict: 1 } });
const loadMs = Date.now() - loadStart;

const results = [];
for (const c of cases) {
  for (let run = 1; run <= runs; run++) {
    const language = c.lang === "en" ? "en" : "zh";
    const started = Date.now();
    let reply = null,
      raw = null,
      error = null;
    try {
      // The same call the app makes (cleaned); also keep the raw text to see what cleaning did.
      const data = await json("/api/chat", { model, messages: AI.buildMessages({ text: c.text, language, wearing: c.wearing ?? (language === "en" ? "the lemon hat" : "柠檬帽") }), stream: false, think: false, keep_alive: "10m", options: params });
      raw = data.message?.content ?? "";
      reply = { text: AI.cleanReply(raw, language), ms: Date.now() - started, tokens: data.eval_count ?? null, tps: data.eval_duration ? +(data.eval_count / (data.eval_duration / 1e9)).toFixed(1) : null };
    } catch (e) {
      error = e.message;
    }
    results.push({ id: c.id, run, text: c.text, appRoute: c.appRoute, expect: c.expect, raw, reply, error });
    console.log(`${c.id}#${run}  ${c.text}\n  → ${reply?.text ?? "(error) " + error}  [${reply?.ms ?? "-"} ms, ${reply?.tps ?? "-"} tok/s]\n`);
  }
}
const ps = await json("/api/ps").catch(() => ({ models: [] }));
const loaded = ps.models?.find((m) => m.name === model || m.model === model) || ps.models?.[0] || null;
const gb = (n) => (n ? (n / 1024 ** 3).toFixed(2) + " GB" : "—");
const memory = { modelSize: gb(loaded?.size), inGPU: gb(loaded?.size_vram), pressure: sh("memory_pressure -Q 2>/dev/null | tail -1") };

const date = new Date().toISOString().slice(0, 10);
const slug = `${date}-${model.replace(/[^\w.-]+/g, "_")}-prompt-v${AI.PROMPT_VERSION}`;
const outDir = join(root, "docs/captain-ai/results");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, `${slug}.json`), JSON.stringify({ model, promptVersion: AI.PROMPT_VERSION, machine, params, runs, loadMs, memory, results }, null, 2) + "\n");
const ms = results.filter((r) => r.reply).map((r) => r.reply.ms).sort((a, b) => a - b);
const median = ms.length ? ms[Math.floor(ms.length / 2)] : null;
const rows = results.map((r) => `| ${r.id}${runs > 1 ? `#${r.run}` : ""} | ${r.text} | ${(r.reply?.text ?? `（出错）${r.error}`).replace(/\|/g, "\\|")} | ${r.reply?.ms ?? "—"} | ${r.appRoute === "rules" ? "App 里走规则" : "模型"} |`).join("\n");
writeFileSync(
  join(outDir, `${slug}.md`),
  `# Captain × ${model}（本机 Ollama）· ${date}

- 机器：${machine.chip} · ${machine.memoryGB} GB · macOS ${machine.macOS} · Ollama ${version}
- 提示词版本：v${AI.PROMPT_VERSION}；参数（推理参数，不是微调）：\`${JSON.stringify(params)}\`，每句 ${runs} 次，\`think: false\`；装扮按 App 默认（柠檬帽）
- 首次加载：${loadMs} ms；回复耗时中位数：${median ?? "—"} ms
- 内存（Ollama /api/ps）：模型占用 ${memory.modelSize}，其中在 GPU ${memory.inGPU}${memory.pressure ? `；系统：${memory.pressure}` : ""}
- 输入全部来自 docs/captain-ai/chat-cases.json（合成），没有发送任何真实手帐。

| 用例 | 输入 | Captain 的回复（清理后） | 耗时 ms | App 里 |
|---|---|---|---|---|
${rows}

人工评分（按 docs/keeper-eval/README.md 的 7 项，每项 0–2）：待填写。
`,
);
console.log(`Saved docs/captain-ai/results/${slug}.md (+ .json)`);
