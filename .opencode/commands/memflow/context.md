---
name: context
description: First command of the flow — loads memory (decisions, state and metrics), interprets patterns and prepares intelligent context for /workflow.
license: MIT
metadata:
  author: BrunoCastro
  version: "8.3.3"
---

## Command activation rule (CRITICAL)

When the user invokes `/context`, this command is already active.

- DO NOT only respond that normative references were registered
- DO NOT ask the user to run `/context` again
- DO NOT block because "preconditions are not validated yet"
- immediately execute the context, memory, metrics, skills and anti-compaction invariant loading described below

---

## Common normative reference

Mandatory application:

### Conteúdo injetado: _shared/base-output.md
---
description: It is not an executable command. Shared base of output format.
license: MIT
hidden: true
metadata:
  author: BrunoCastro
  version: "1.3.0"
---
# Output base (normative reference)

This basic response format must be applied to system commands:

## Required language

- All responses and communications must be in **Brazilian Portuguese (pt-BR)**.

## System identity invariants (anti-compaction)

- Preserve the operational context of the **Memflow Command System** project in all responses.
- Treat shared normative rules as reloadable invariants in any context resumption.
- In case of summarization/context compaction by an LLM, explicitly revalidate:
  - mandatory language (pt-BR)
  - project identity and scope (Memflow)

## Usage rules

- If a command has its own more specific format, it can extend this standard.
- Fields that can be specialized by command:
  - vocabulary from `Status`
- internal subsections of `Analysis` and `Problems`
- Non-overwriteable invariants:
  - answer in pt-BR
- section `## Next steps` as the last `##`
- flow continuity only in `## Next steps`
- Never automatically execute the next command in the flow without explicit confirmation from the user.
- **`## Next steps` is always the last `##` of the answer:** do not include any other section titled `##` after `## Next steps`.
- **Flow continuity only in `## Next steps`:** do not use bullets or lines of type `Next step:` outside this section (includes compact, ultra-light modes or any intermediate summary).

## Status

- Clear current status of the command (e.g. completed, blocked, partial)

---

## Analysis

- Main content of assessment, planning or execution
- Subdivisions with `###` when necessary

---

## Problems

- Violations, risks, ambiguities, limitations or failures detected
- If there is none: `None`

---

## Next steps

- Concrete actions to continue the flow
### Conteúdo injetado: _shared/base-preconditions.md
---
description: It is not an executable command. Shared basis of preconditions.
license: MIT
hidden: true
metadata:
  author: BrunoCastro
  version: "1.4.1"
---

# Common base of preconditions (normative reference)

Apply this block of preconditions to operational commands.

---

## Early activation rule (CRITICAL)

Before applying any precondition block, identify the active command.

If the active command is `/context`:

- DO NOT require prior context
- DO NOT ask the user to run `/context` again
- immediately execute the context, memory, metrics, skills and anti-compaction invariant loading defined by `/context` itself

If the active command is `/memory-init`:

- allow bootstrapping the memory structure without prior context
- after bootstrap, guide re-entry through `/context`

---

## Context precondition (REQUIRED)

Before any execution, except `/context` and `/memory-init`:

- Check if the `/context` command was executed

If NO:

- BLOCK execution
- Request execution of `/context`
- DO NOT continue

---

## Anti-compaction invariants (REQUIRED)

Before any operational command (except `/context`), validate that `/context` has confirmed:

- mandatory language: pt-BR
- project identity and scope: Memflow Command System

If invariants are missing or failed:

- BLOCK execution
- require re-execution of `/context`
- DO NOT continue in partial silent mode

---

## Safe continuity checklist (anti-bypass)

Before proceeding to any critical step, confirm:

- explicit decision of available `/workflow` (when applicable)
- valid anti-compaction invariants (pt-BR + Memflow)
- explicit user confirmation before executing the next command in the flow

If any item fails:

- BLOCK continuity
- record problem in output
- request corrective action before proceeding

---

## Memory validation (MANDATORY)

If persistent memory exists in the project:

- .agents/memory/memory.md
- .agents/memory/session-memory.md
- .agents/memory/decisions.md
- .agents/memory/quality-metrics.md

So:

- ensure it was charged by `/context`
- use as a primary context base

---

## Memory not loaded

If memory exists but has NOT been loaded:

- consider incomplete context
- DO NOT proceed with critical execution
- recommend re-execution of `/context`

---

## Lack of memory

If memory does NOT exist:

- operate normally
- use docs, code and MCPs as fallback

---

## Exception: `/context` command

- DOES NOT require prior context
- This command is responsible for:
  - load context
  - load memory
  - validate environment

---

## Exception: `/memory-init` command

- can bootstrap from memory structure without prior context
- after bootstrap, must require reentry via `/context` before any critical execution

---

## Canonical boot order

1. `/memory-init` (only when memory structure does not exist)
2. `/context` (context and memory mandatory loading)
3. decision commands/execution (`/workflow`, `/execute`, `/plan`, etc.)

## Global consistency rule

- No command can execute without valid context
- No command can ignore available memory
- Avoid execution with partial or inconsistent context
- No critical command can execute without valid anti-compaction invariants

---

## Path resolution (required)

- Rules for resolving normative paths and `model-policy.md` must follow `_shared/target-adapter.md`.
- Never infer paths outside the target adapter.
- When the active command is already loaded:
  - assume the root of this command as the context of normative resolution
  - do not ask the user for manual confirmation about the location of `_shared/*.md` and `model-policy.md`
- If the adapter is not available:
  - report absence
  - DO NOT use fallback

---

## Precedence rule

- This file defines global execution invariants.
- Commands can extend operational rules, without invalidating invariants.
- Non-overwriteable invariants:
  - no critical execution without `/context`
  - available memory cannot be ignored
  - normative resolution must follow `_shared/target-adapter.md`
  - anti-compaction invariants (pt-BR + Memflow) must be valid before critical execution

---

## Important

- This file ensures system consistency
- Avoid execution without context
- Ensures correct memory usage
### Conteúdo injetado: _shared/base-degraded-mode.md
---
description: It is not an executable command. Shared base in degraded mode.
license: MIT
hidden: true
metadata:
  author: BrunoCastro
  version: "1.1.0"
---
# Degraded mode common base (normative reference)

Apply this block when `.agents` is unavailable, missing or incomplete.

## Degraded mode

- Do not automatically block just due to the absence of `.agents`.
- Activate degraded mode and explicitly warn in the response.
- Proceed with available sources:
  - `docs`
  - `model-policy.md` resolved by active target (via `_shared/target-adapter.md`)
  - actual project code
  - MCPs available
- Reduce confidence in conclusions and record limitations.

## Precedence rule

- This file defines the common pattern.
- Specific rules for each command can extend this pattern.
- Non-overwriteable invariants:
  - absence of `.agents` does not automatically block
  - limitations must be explicitly reported
  - reliability of the analysis should be reduced
### Conteúdo injetado: _shared/target-adapter.md
---
description: It is not an executable command. Target adapter for normative resolution in OpenCode.
license: MIT
hidden: true
metadata:
  author: BrunoCastro
  version: "1.3.0"
---
# Target adapter (OpenCode)

Apply this adapter when the active target is `opencode`.

## Resolution of normative paths (mandatory)

- For system normative files, use the official paths by scope:
  - `~/.config/opencode/commands/memflow/...` (global)
  - `.opencode/commands/memflow/...` (local)
- In OpenCode installations generated by the Memflow installer, executable commands may contain injected normative blocks (`_shared/*.md` and `model-policy.md`) in the file itself.
- In these generated artifacts, `_shared/` and `model-policy.md` may not exist as separate files on the target.
- Never resolve:
  - `model-policy.md`
  - `_shared/*.md`
  relating to the open project.

## Automatic scope detection (required)

- Determine installation scope before asking the user for any confirmation.
- Mandatory order:
  1. Detect the directory of the running command (`.../commands/memflow/<command>.md`) and use this directory as the normative root.
  2. If the detected root is in `~/.config/opencode/commands/memflow`, classify as **global**.
  3. If the detected root is in `.opencode/commands/memflow`, classify as **local**.
  4. Solve `_shared/*.md` and `model-policy.md` relative to the detected root.
- Only attempt discovery via official paths (`global -> local`) when the path of the command being executed is not available.
- Do not ask the user to confirm the location of normative files when automatic detection is possible.

## Lack of official file

- If the file is not found in any official path:
  - report absence
  - DO NOT use fallback

## Precedence

- This adapter sets the resolution to `opencode`.
- Commands can only extend read operational rules.
- Non-overwriteable invariants:
  - automatic scope detection when command is active
  - normative resolution relative to the detected root or per block injected into the installed command
  - absence in official path without fallback outside the adapter
### Conteúdo injetado: model-policy.md
---
description: It is not an executable command. Shared template policy base.
license: MIT
hidden: true
metadata:
  author: BrunoCastro
  version: "1.0.0"
---

# Model Policy — Model Orchestration

This file defines the rules for using, selecting, and scaling AI models in the project.

It guarantees:

- cost reduction
- consistency of decisions
- technical quality
- system predictability

---

## Objective

Standardize how models are used at each stage of the workflow:

- `/workflow`
- `/brainstorm`
- `/plan`
- `/execute`
- `/review`
- `/review-enforce-rules` (optional/recomendado)

---

## Fundamental principle

👉 Start with the most economical model
👉 Escalate only when necessary

---

## Model roles

### Free model (e.g. GPT-4.1, GPT-5 mini)

Use for:

- initial context exploration
- quick questions
- simple task screening
- preliminary validations

Features:

- minimum cost
- quick response
- lower robustness for complex implementation

---

### Economy model (e.g. Haiku, GPT-5.4 mini, Gemini 3 Flash)

Use for:

- code execution
- CRUD
- UI components
- simple adjustments
- specific corrections

Features:

- fast
- cheap
- reduced complex reasoning ability

---

### Intermediate model (e.g. Gemini 3.1 Pro, GPT-5.3-Codex, GPT-5.4, Sonnet)

Use for:

- planning (`/plan`)
- architecture
- systems integration
- business rules
- technical decisions

Features:

- best cost balance/qualidade
- main reasoning model

---

### Advanced model (e.g. GPT-5.4, Opus)

Use only for:

- complex refactoring
- difficult debugging
- large code analysis
- persistent problems

Features:

- high cost
- high reasoning ability

---

## Standard strategy

### Mandatory separation

- Planning → smarter model
- Execution → most economical model
- Optional initial screening → free model

---

### Optimal flow


```
/workflow → decide
   ↓
/brainstorm (optional — exploration and trade-offs)
   ↓
/plan (modelo inteligente)
   ↓
/execute (economic model)
```


---

## Selection rules

### By complexity

| Complexity | Model                    |
| ------------ | ------------------------- |
| Very low  | Free                      |
| Low        | Economic                 |
| Medium        | Intermediate             |
| High         | Intermediate or Advanced |

---

### By task type

#### Economic

- "create function"
- "component adjustment"
- "fix simple bug"
- "implement low risk task"

#### Intermediary

- "create system"
- "architecture"
- "backend integration"
- "define technical approach"

#### Advanced

- "refactor project"
- "analyze entire code"
- "complex debug"

---

## Operational selection by level

For each task, define:

1. recommended level
2. main model
3. alternative models of the same level

Rule:

- indicate exactly 1 main model per run
- list 2-3 alternatives of the same level for availability contingency
- keep fallback at same level before scaling

---

## Fallback due to unavailability or operational degradation

Trigger fallback for alternatives of the same level when there is:

- main model unavailability
- quota/limit reached
- unstable latency that compromises continuity

Flow:

1. try alternatives of the same level in the defined order
2. if no alternative is available/viable, reassess risk and complexity
3. escalate to a higher level only if necessary

Not allowed:

- reduce level in tasks already classified as medium/high complexity
- skip alternatives of the same level without justification

---

## Autoclimb

### Main rule

If there is a failure:

1st failure → try to fix locally
2nd failure → review approach (possible plan error)
3rd failure → scale model

---

### Example of climbing


```
Free/Economic → Intermediate → Advanced
```


---

## Critical rules

- DO NOT use advanced template by default
- DO NOT use economic models for complex decisions
- DO NOT use free model for critical implementation
- DO NOT skip planning on medium/high complexity tasks
- DO NOT insist on a model that has repeatedly failed

---

## Integration with commands

### `/workflow`

- decides recommended level, main model and alternatives of the same level

---

### `/brainstorm`

- phases 1–2: economic model by default
- validation in the code and comparison of trade-offs: intermediate when complexity ≥ medium
- final recommendation and DoD: strongest model when complexity ≥ medium or risk ≥ medium

---

### `/plan`

- use intermediate or higher model

---

### `/execute`

- use economic model
- climb if necessary

---

### `/review`

- validate whether the model was suitable

---

### `/review-enforce-rules`

- apply optional hard validation of model usage in critical scenarios

---

## Consistency rules

- model must be coherent with complexity
- Main model must have viable alternatives of the same level
- decisions must be justified
- climbing must be progressive

---

## Performance objective

- reduce cost by 50%–80%
- maintain high quality
- avoid rework
- use free/economic whenever risk allows

---

## Anti-patterns (avoid)

- use advanced template for simple tasks
- use free model for high impact task
- perform complex tasks without planning
- ignore repeated failures
- mix responsibilities (plan + execute at the same level)

---

## Final summary

👉 Model is NOT the brain
👉 Workflow is the brain
👉 Model is a tool

---

## Expected result

- cheaper execution
- smarter decisions
- predictable system
- lower error rate

---

## Load context

---

# Persistent memory (HIGH PRIORITY)

If it exists:

- .agents/memory/memory.md
- .agents/memory/session-memory.md
- .agents/memory/decisions.md
- .agents/memory/quality-metrics.md

---

# Invariant rehydration (ANTI-COMPACTION)

Before completing `/context`, explicitly revalidate:

- mandatory system language: pt-BR
- project identity: Memflow Command System
- active scope: normative commands in `src/` and bases in `_shared`

If any item is missing from the active context:

- reload normative references
- record that there was post-compaction rehydration
- DO NOT mark context as complete without revalidating the 3 items

---

# Memory usage

## Primary Source (CRITICAL)

- memory.md → identity
- decisions.md → decisions

---

## Secondary source

- quality-metrics.md → performance

---

## Trust rule

If they exist:

- memory.md
- decisions.md

→ reliable memory

---

# Metrics interpretation

If it exists:

.agents/memory/quality-metrics.md

---

## Extract:

- approval_rate
- failure_rate
- observations

---

## Quality rating

- high_quality → error < 10%
- medium_quality → 10–30%
- low_quality → >30%

---

# Pattern interpretation (INSIGHTS)

If there are observations:

Example:

- "tasks with low clarity fail more"
- "external integrations have high error"

---

## Generate strategic signals

Convert observations to signals:

### Signal types:

- high_risk_for_clarity
- high_risk_for_integration
- planning_need
- need_for_reinforced_validation

---

## Internal result

Prepare structure:

- quality: high | medium | low
- signs:
  - list of detected signals

---

## Rules

- DO NOT decide action
- DO NOT modify flow
- DO NOT block execution
- just enrich context

---

# Optimized mode

If reliable memory:

---

## DON'T:

- scan project
- upload docs
- read code without need

---

## DO:

- load memory
- interpret metrics
- interpret signals
- use Serena optimized

---

# Fallback mode

If memory is missing:

- DO NOT block `/context`
- enable functional degraded mode
- explicitly record that persistent memory was not loaded
- revalidate anti-compaction invariants using available normative references
- use `AGENTS.md`, `docs`, real project code and available MCPs as complementary sources
- DO NOT assume optimized mode
- DO NOT scan the entire project without need
- DO NOT require Serena or any specific MCP
- reduce confidence in conclusions and report limitations

---

# Main context

- .agents/**
- AGENTS.md
- project skills (if they exist)

---

# Project skills (MANDATORY when available)

Check existence of skills in the project (common examples):

- `.cursor/skills/**`
- `.cursor/skills-cursor/**`
- `.agents/skills/**`

If they exist:

- load inventory of available skills
- record names and summary purpose of each relevant skill
- signal to `/workflow` that there are potentially applicable skills

If they do not exist:

- record absence explicitly (without blocking)

---

# Context on demand

- docs
- code
- configs

---

# MCP integration

If MCPs are available:

- record which relevant MCP servers or tools are available
- use MCPs only as complementary context sources
- DO NOT block `/context` because MCPs are unavailable
- DO NOT assume any specific MCP is required (including Serena)

If no MCP is available:

- record absence as a light limitation (without blocking)
- continue with memory, `.agents`, docs and local code

---

# Source priority

1. memory.md  
2. decisions.md  
3. quality-metrics.md  
4. .agents  
5. Serena  
6. docs  
7. code  

---

# Mandatory rules

- memory is primary source
- metrics are support
- signs do NOT replace rules
- avoid unnecessary reading
- DO NOT ignore skills available in the project
- include skill status in the context delivered to `/workflow`
- ALWAYS revalidate anti-compaction invariants (pt-BR + Memflow) before finalizing

---

# Output

---

## 🟢 Ultra-light

- Context: OK
- Memory: loaded
- Metrics: YES/NO
- Quality: high/medium/low
- Signals: none / detected
- Skills in the project: YES / NO
- Anti-compaction invariants: OK / Rehydrated

---

## Status

- Context: OK / Failed
- Memory: YES / NO
- Metrics: YES / NO
- Skills: YES / NO
- Anti-compaction invariants: OK / Rehydrated / Failed
- Mode: Normal / Degraded / Optimized

---

## Summary

- memory usage
- use of metrics
- detected signals
- available skills (if any)
- status of anti-compaction invariants (pt-BR + Memflow)

---

## Flow state

- Step: context

---

# Consistency rules

- DO NOT decide execution
- DO NOT apply metrics directly
- DO NOT apply signals directly
- DO NOT decide alone whether skill should be used
- ALWAYS delegate to /workflow

---

# Limitations

- observations may be incomplete
- signals depend on data quality
- absence of signs does not indicate absence of problem

---

# Important

- DO NOT implement
- DO NOT decide flow
- signals are strategic support

---

## Next steps

- Run /workflow
