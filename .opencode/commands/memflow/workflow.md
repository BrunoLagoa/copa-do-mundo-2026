---
name: workflow
description: Central orchestrator — decides exploration, execution, validation and adapts behavior based on decisions, metrics, insights and assisted suggestions, with predictability and evolution control. It is the sole source of strategy decisions for /brainstorm, /execute and /plan.
license: MIT
metadata:
  author: BrunoCastro
  version: "9.8.0"
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

## Objective

Decide:

- execution (/execute or /plan)
- validation (/review, /review-code)
- model
- history-based intelligent adaptation

---

## Decision basis

- decisions.md
- quality-metrics.md
- decision-suggestions.md
- skills available in the project (if they exist)
- model-policy

---

# 🆕 Decision priority (CRITICAL)

Mandatory order:

1. **decisions.md (always prevails)**
2. **applicable skills (if any)**
3. **workflow rules**
4. **insights (slight adjustment)**
5. **decision-suggestions (assisted mode)**

---

## Rules

- Explicit decisions can NEVER be overwritten
- available and applicable skills CANNOT be ignored
- DO NOT assume implementation assumptions without making them explicit in the output
- insights only adjust behavior
- Suggestions NEVER run automatically
- in case of conflict → respect order above
- `/workflow` is the only strategy decision source (`/brainstorm`, `/execute` vs `/plan`)
- DO NOT proceed without anti-compaction invariants validated by `/context`
- when there is a pending decision in `## Próximos passos`, use structured dialogue with selectable options

---

## Pending decisions in `## Próximos passos` (MANDATORY)

When `/workflow` depends on a user choice to follow (e.g. define scope, prioritize phase, choose implementation direction):

- present options in a structured and selectable dialog
- avoid open-ended typing requests when there are concrete options
- allow option `Outra` when it makes sense to not limit the user
- if the user chooses `Outra`, request details afterwards (free text only at this stage)
- if the answer is ambiguous, repeat the same structured dialogue until there is an explicit selection
- record in the analysis/problemas that there is a pending decision and what choice was made when answered

---

# Step 0 — Existing Decisions

- check previous decisions
- prioritize by score
- detect conflicts

---

# Step 0.5 — Metrics

If it exists:

- approval rate
- failure rate
- medium rework

---

# Step 0.6 — Insights

Detect:

- low clarity
- high complexity
- external integrations
- high rework

---

# Step 0.7 — Decision Suggestions

If it exists:

.agents/memory/decision-suggestions.md

---

## Analyze suggestions

For each suggestion:

- title
- recommendation
- impact
- trust

---

## Activation criteria

- confidence ≥ average
- impact ≥ medium

---

## 🆕 Usage Limit (CRITICAL)

- apply dynamic limit per run:
  - low complexity and low risk: maximum **2 suggestions**
  - medium complexity or medium risk: maximum **3 suggestions**
  - high complexity or high risk: maximum **4 suggestions**
- When there are more eligible suggestions than the limit, prioritize by:
  - greater impact
  - greater confidence

---

## Assisted mode

- DO NOT apply automatically
- just suggest

---

# Step 0.8 — Project Skills (MANDATORY)

If `/context` indicates skills available in the project:

- identify skills relevant to the current task
- record which skills should be used before continuing
- guide explicit use of applicable skills

If there is a clearly applicable skill:

- DO NOT proceed to direct execution without guiding the use of the skill

If applicability is ambiguous:

- request objective confirmation from the user before proceeding

---

# Step 0.9 — Anti-compaction invariant gate (MANDATORY)

Validate whether `/context` confirmed invariants:

- pt-BR language validated
- validated Memflow identity

If status comes as `Reidratados`:

- allow normal continuity
- record in the output that there was post-compaction recovery

If status comes as `Falhou` or absent:

- BLOCK workflow decision
- require rerun of `/context`

---

# 🆕 Suggestion Application (INLINE 🔥)

When a suggestion is presented:

### The user can decide:

- **apply**
- **ignore**

---

## If apply:

- convert recommendation into decision
- register in `decisions.md`
- remove from suggestion list
- register via `/memory-save`

---

## If ignored:

- increment `Ignoradas consecutivas` in the corresponding suggestion in `decision-suggestions.md`
- keep suggestion active while `Ignoradas consecutivas` < 3
- if `Ignoradas consecutivas` ≥ 3 → `/memory-save` archives (Step 13) and stops presenting at `/workflow`

---

## Important

- application must be explicit
- never automatic
- must generate traceability

---

## Result

Add to output:

## Relevant suggestions

- title: <name>
- recommendation: <text>
- available action:
  - apply
  - ignore

---

# Step 1 — Task Classification

- Complexity: low / medium / high
- Impact: low / medium / high
- Risk: low / medium / high
- Clarity: high / medium / low

---

# Step 1.5 — Assumptions and ambiguities (MANDATORY)

Before deciding on strategy:

- list assumptions assumed for the classification
- list doubts that impact decision
- If there is a critical unanswered question:
  - BLOCK decision
  - open structured options dialog with the user
- DO NOT choose interpretation silently when there are multiple plausible readings

---

# Step 2 — Execution decision

---

## DIRECT EXECUTION

- low complexity
- low risk
- high clarity

---

## EXECUTION WITH /plan

- average/alta complexity
- medium risk/alto
- low clarity

---

## Tune for insights

- low clarity → FORCE /plan
- high complexity → prioritize /plan
- high rework → avoid direct execution

---

## EXPLORE WITH /brainstorm

Use when:

- low or medium clarity **and** multiple plausible approaches
- technical or product trade-offs not yet resolved
- undefined scope before `/prd` or `/plan`
- user requests exploration of alternatives

Rules:

- DO NOT jump to `/execute` when `/brainstorm` is necessary
- after `/brainstorm` approved, handoff according to gate decision:
  - `/prd` — lack of product definition or business scope
  - `/spec` — PRD exists, deterministic technical decision is missing
  - `/plan` — scope and approach clear enough to plan
- return to `/workflow` after brainstorm handoff before continuing

---

## Adjustment by insights (brainstorm)

- low clarity + multiple approaches → FORCE /brainstorm before /plan
- undecided architectural trade-off → FORCE /brainstorm
- high clarity + evident single approach → skip /brainstorm

---

# Step 3 — Validation Strategy

---

## /review

- ALWAYS mandatory

---

## /review-code

Mandatory when:

- modified code
- risk ≥ medium
- external integration
- architectural change
- suggestion indicate technical risk

---

## Tune for insights

- external integration → FORCE /review-code
- high error history → strengthen validation

---

# Step 4 — Quality Gate

---

## BLOCK

- review = Failed
- review-code = Failed

---

## ALLOW WITH PROVISIONS

- any “with reservations”

---

## APPROVE

- both approved

---

# Step 5 — Model Orchestration

- economic model by default
- escalate when necessary

---

# Step 6 — Consistency Control

- DO NOT ignore decisions
- DO NOT ignore metrics
- DO NOT ignore insights
- DO NOT ignore suggestions
- DO NOT ignore applicable skills
- limit influence of suggestions

---

# Integration

- /brainstorm
- /execute  
- /review  
- /review-code  
- /memory-save  

---

# Rules

- DO NOT implement
- DO NOT allow bypass
- DO NOT ignore risk
- demand return to `/workflow` if decision is absent

---

# Important

- decisions are sovereign
- insights adjust
- suggestions guide
- system must remain predictable

---

# Output format

## Status

- Decision made

---

## Analysis

### Classification

- Complexity:
- Impact:
- Risk:
- Clarity:

---

### Premises and ambiguities

- assumptions assumed:
- ambiguities detected:
- pending decision with user: YES / NO

---

### Metrics

- available: YES / NO
- failure_rate:

---

### Insights

- detected signals:

---

### Suggestions

- list of relevant suggestions
- available actions: apply / ignore

---

### Skills

- available in the project: YES / NO
- skills applicable to the task:
- action: use skill now / not applicable (justify)

---

### Anti-compaction invariants

- pt-BR language: OK / Failed
- Memflow identity: OK / Failed
- re-hydration required: YES / NO

---

### Strategy

- Exploration: Required (/brainstorm) / Not required
- Execution: Direct / Planned
- Validation:

---

## Problems

- ambiguities
- risks
- failure of anti-compaction invariants (if any)

If there is none:
→ None

---

## Next steps

1. /brainstorm (when exploration required) or /execute or /plan
2. /review  
3. /review-code  
4. /memory-save  
5. If there is an applicable skill: use the skill before continuing
6. If anti-compaction invariants fail: rerun `/context`
7. If there is a pending decision to continue: open the selectable options dialog before proceeding
