# AI Resource Routing

Resource-aware AI execution strategy for BikeBrowser. Routes AI tasks to the most appropriate compute path: CPU (deterministic), local GPU inference, or remote cloud providers.

## Architecture Overview

```
Game / Renderer
    |
    v
window.api.ai.orchestrate(payload)
    |
    v  (IPC)
Main Process: ai:orchestrate handler
    |
    v
Compute Orchestrator (src/server/ai/computeOrchestrator.js)
    |--- classifies task (workloadClasses.js)
    |--- checks capabilities (capabilityDetector.js)
    |--- applies resource policy
    |
    +---> CPU path (deterministic fallback)
    +---> Local GPU path (local-provider.js)
    +---> Remote path (existing provider-manager.js)
```

## Workload Categories

### A. CPU_CONTROL (always CPU, never offloaded)
- Quest correctness and progression
- Save/load state persistence
- Inventory validation
- Learning progress updates
- Reward logic (Zuzubucks, reputation)
- NPC state machine transitions
- Prompt construction
- JSON/schema validation
- Cache lookup and routing decisions
- Fallback template selection

### B. CPU_REALTIME (lightweight CPU)
- Rule-based difficulty band selection
- Deterministic question selection
- Keyword/topic matching
- Local hint assembly from templates

### C. GPU_LOCAL_INTERACTIVE (local GPU when available)
- NPC dialogue generation
- Question rewording by complexity band
- Explanation depth scaling
- Hint generation
- Encouragement generation

Fallback chain: local GPU -> remote provider -> CPU fallback templates

### D. GPU_LOCAL_BATCH (future, background GPU work)
- Content pre-generation for caching
- Embedding generation for similarity

### E. REMOTE_PROVIDER (existing cloud AI)
- Complex structured parsing
- Safety filtering
- High-confidence generation
- Query expansion

### F. BROWSER_PLATFORM (OS/browser managed)
- Speech synthesis (Web Speech API)
- WebGL rendering (Phaser)

## Resource Policies

Set via `RESOURCE_POLICY` environment variable or `ai:resource-policy` IPC:

| Policy | Behavior |
|--------|----------|
| `adaptive` (default) | Use best available resource per task class |
| `prefer-local` | Prefer local GPU when available, fall back to remote |
| `prefer-remote` | Prefer remote providers even when local is available |
| `cpu-safe` | CPU-only mode, no AI inference (uses fallback templates) |

## Local Inference Setup

### Supported Runtimes

The local provider auto-detects these runtimes:

| Runtime | Default Port | API Style |
|---------|-------------|-----------|
| Ollama | 11434 | Ollama native + OpenAI compat |
| LM Studio | 1234 | OpenAI-compatible |
| llama.cpp server | 8080 | OpenAI-compatible |
| Custom | env-configured | OpenAI-compatible |

### Hardware Notes (This Machine)

- **CPU**: AMD Ryzen 7 5700 (8c/16t) -- strong for CPU inference
- **GPU**: AMD Radeon RX 580 2048SP (~4GB VRAM, GCN/Polaris)
- **RAM**: ~32GB
- **Best inference path**: Vulkan backend via llama.cpp
- **Realistic models**: Q4_K_M quantized 7B models (Mistral 7B, Phi-3, Llama 3.1 8B)
- **Expected speed**: ~10-15 tokens/sec with Vulkan on RX 580
- **CUDA**: Not available (AMD GPU)
- **ROCm**: Limited/unofficial for GCN architecture

### How to Enable Local Inference

1. **Install Ollama** (easiest):
   ```bash
   # Windows: download from https://ollama.com
   # Then:
   ollama pull mistral:7b-instruct-q4_K_M
   ollama serve
   ```

2. **Or install llama.cpp with Vulkan** (for AMD GPU acceleration):
   ```bash
   # Build llama.cpp with Vulkan support
   # Then run the server:
   llama-server -m model.gguf --port 8080 -ngl 99
   ```

3. **Or set a custom endpoint**:
   ```env
   LOCAL_AI_ENDPOINT=http://localhost:8080
   LOCAL_AI_MODEL=my-model
   LOCAL_AI_API_STYLE=openai-compatible
   ```

The app auto-detects running runtimes on startup. No configuration needed if using default ports.

### Environment Variables

```env
# Resource policy
RESOURCE_POLICY=adaptive

# Local inference (optional -- auto-detected if not set)
LOCAL_AI_ENDPOINT=http://localhost:11434
LOCAL_AI_MODEL=mistral:7b-instruct-q4_K_M
LOCAL_AI_TIMEOUT=15000
LOCAL_AI_API_STYLE=openai-compatible
LOCAL_AI_AUTODETECT=true
```

## Capability Detection

On startup, the app detects:
- CPU model and thread count
- GPU presence, vendor, VRAM
- Local inference runtime availability
- Local inference health and latency
- Preferred routes per task category

Results are cached for 60 seconds and available via `ai:capabilities` IPC.

## What Stays Deterministic (Never AI-Controlled)

These systems are always CPU-bound and deterministic:

- Game loop and physics
- Quest step progression and validation
- Answer correctness checking
- Inventory and item logic
- Save/load system
- Learning progress state machine
- Reward granting (Zuzubucks, reputation)
- AI output validation (schema checking)
- Canonical answer truth (from quest data)
- Fallback dialogue templates

AI generates *language* around these systems. It never controls whether game state is valid.

## Diagnostics

In non-production mode, every AI-routed task logs:
```
[ComputeOrchestrator] npc_dialogue -> local-gpu (local, 850ms) -- Local inference available (ollama, 120ms latency)
```

The `_routing` field in results contains:
- `route`: cpu-deterministic | local-gpu | remote-provider | cpu-fallback
- `provider`: which provider was used
- `reason`: human-readable explanation
- `workloadClass`: which category the task was classified as
- `policy`: active resource policy
- `latencyMs`: total routing + execution time

## File Map

| File | Purpose |
|------|---------|
| `src/server/ai/workloadClasses.js` | Task classification system (6 categories, ~25 task types) |
| `src/server/ai/capabilityDetector.js` | Hardware and runtime detection |
| `src/server/ai/computeOrchestrator.js` | Resource-aware routing engine |
| `src/server/ai/index.js` | Public API exports |
| `src/main/deepseek/providers/local-provider.js` | Local inference provider (OpenAI-compatible + Ollama) |
| `src/main/config/deepseek-config.js` | Provider configuration (updated with local + policy) |
| `src/main/deepseek/provider-manager.js` | Provider chain management (updated with local provider) |
