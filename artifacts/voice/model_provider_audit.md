# Model Provider Audit

Per the appended requirement. Covers every provider's config status and the
specific MiniMax swap-in question. **Note:** this is *adjacent* to the voice
audit — MiniMax-as-LLM (bulk coding/agents) is a different concern from
MiniMax-as-voice (paid TTS). Both are covered. No secret values printed.

## Provider status

| Provider | EB (executive-brain) | BikeBrowser | Overall |
|---|---|---|---|
| **Claude** | **CONFIGURED** — via `claude` CLI subprocess (`executors/claude_executor.py:19,162-172`); no API key in `.env`, no `base_url`/`model` knob in code | not an LLM provider here | configured (CLI), not base_url-swappable in code |
| **OpenAI** | not configured (no key, no client) | **CONFIGURED** — `OPENAI_API_KEY`; `providers/openai-provider.js:14` (hardcoded base_url), `OPENAI_MODEL` env | configured in BB only |
| **MiniMax** | **AVAILABLE-BUT-UNUSED (audio)** — `MINIMAX_API_KEY` present; `api_registry.py:36`; **no adapter**, `plan_only`. **MISSING as LLM** | **MISSING** (not in provider map) | paid audio stub; not an LLM anywhere |
| **Local LLMs** | **PARTIAL/PLANNED** — `capabilities/ollama.yaml`, `lm_studio.yaml` = `disabled`, "adapter not_yet_implemented"; `api_registry.py:84-89` health-probe only | **CONFIGURED** — `LocalProvider` (`local-provider.js:34-45`) takes `LOCAL_AI_ENDPOINT`+`LOCAL_AI_MODEL`+`LOCAL_AI_API_STYLE`; auto-detects Ollama/LM Studio/llama.cpp | real in BB; planned in EB. (`ollama` installed but not running) |

Legend: CONFIGURED / PARTIAL / AVAILABLE-BUT-UNUSED / MISSING.

## Can MiniMax be swapped into existing workflows?

### …as an LLM into Anthropic-compatible workflows?
**The premise needs a correction.** EB does **not** use the Anthropic SDK with a
configurable `base_url` — it **shells out to the `claude` CLI**
(`claude_executor.py:162-172`). So there is no Python `base_url` to change. BUT:
- **The `claude` CLI itself honors `ANTHROPIC_BASE_URL` / `ANTHROPIC_AUTH_TOKEN`
  / model env vars.** If EB's claude executor passes the process environment
  through to the subprocess (needs a 1-line verification of the `subprocess`
  call), then pointing those env vars at **MiniMax's Anthropic-compatible
  endpoint** would route that executor to MiniMax **with no EB code change** —
  exactly the lever the appended note describes, applied at the CLI layer.
- **Caveat:** doing so on the *existing* claude executor would replace your
  high-value reasoning model. The right pattern is a **second executor instance**
  ("minimax_coder") with its own env, so Claude stays for architecture/governance
  and MiniMax handles bulk coding/agents — your own routing proposal.

### …can OpenClaw use it?
**Not as an LLM directly.** `openclaw_executor.py:160-173` runs bounded
PowerShell scripts under `C:\OpenClaw`; it is a governance/automation bridge, not
an LLM client. OpenClaw could *invoke* a script that calls MiniMax (OpenAI- or
Anthropic-compatible), but that script is net-new.

### …can LangChain use it?
**Yes, but it must be added.** `langchain`/`langgraph` are EB dependencies, but
**no `ChatAnthropic`/`ChatOpenAI` is instantiated anywhere** — EB's graph does
not call LLMs through LangChain today. To use MiniMax via LangChain you'd add a
`ChatOpenAI(base_url=<minimax-openai-compatible>, model=..., api_key=...)` (or
`ChatAnthropic(base_url=...)`) — net-new code, but small and standard.

### …can Executive Brain use it?
**Not without new code** for the *code/LLM* path (no base_url-configurable client
exists). For the *voice/audio* path, EB needs a **MiniMax voice adapter behind
the existing privilege + budget gates** (the governance is already there;
`executive_privileges.yaml:452-465`, `budgets/`).

### …in BikeBrowser?
**Trivial.** `LocalProvider` already accepts `LOCAL_AI_ENDPOINT` +
`LOCAL_AI_MODEL` + `LOCAL_AI_API_STYLE=openai-compatible`
(`local-provider.js:37-40`). Point `LOCAL_AI_ENDPOINT` at MiniMax's
OpenAI-compatible URL, or add a `minimax` entry to the `providers` map in
`deepseek-config.js` / `provider-manager.js`.

## Exact configuration changes required (by target)

| Target | Change | Effort |
|---|---|---|
| **BB — MiniMax as LLM** | set `LOCAL_AI_ENDPOINT`, `LOCAL_AI_MODEL`, `LOCAL_AI_API_STYLE=openai-compatible`, `LOCAL_AI_API_KEY`; or add `minimax` provider entry | minutes (config) |
| **EB — MiniMax via claude CLI** | verify env pass-through in `claude_executor`, add a `minimax_coder` executor instance with `ANTHROPIC_BASE_URL`/`ANTHROPIC_AUTH_TOKEN`/model env + a privilege + budget | small (1 executor + governance) |
| **EB — MiniMax via LangChain** | add a `ChatOpenAI`/`ChatAnthropic` client with base_url/model, wire into a routed node | small–medium |
| **EB — MiniMax voice** | build a voice/audio executor calling MiniMax behind privilege+budget gates | medium |
| **OpenClaw — MiniMax** | author a governed script that calls MiniMax | small |

## Routing recommendation (your proposal, validated)
The hardware + existing BB router make a multi-provider topology realistic:
```
Claude (CLI)        → architecture, critique, governance        (high value)
MiniMax (compat)    → bulk coding / agent workflows             (paid, budget-gated)
Local LLM (Ollama)  → retrieval, classification, low-value      (free, GPU-local)
LangChain           → RAG/retrieval glue
LangGraph           → workflow
Playwright          → reality / acceptance
```
**Governance gate:** every paid MiniMax path (LLM *or* voice) is **blocked by R0
budgets until an operator sets a `minimax` usd_limit** in
`memory/procedural/project_budgets.yaml`. Local LLM + local TTS are free but
must still pass **resource** budgets (GPU-minutes/wall-clock). This keeps the
multi-provider expansion inside the governance built this session.
