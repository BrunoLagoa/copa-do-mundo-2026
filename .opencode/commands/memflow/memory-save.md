---
name: memory-save
description: Saves session state and relevant decisions — with automatic detection, scoring, versioning, decision dashboard, metrics, insights, suggestions, and growth control. Integrates results from /review and /review-code into the quality cycle. Output: Status (Saved/Blocked/Not required), Analysis, Problems, and Next steps.
license: MIT
metadata:
  author: BrunoCastro
  version: "11.2.0"
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

## System integration (CRITICAL)

This command:

- MUST be used when `/execute` recommends (score ≥ 51) or after `/review` / `/review-code`
- CAN be manually invoked by the user at any time
- DOES NOT decide execution strategy (this is `/workflow`)
- DOES NOT implement code
- DO NOT overwrite decisions in `decisions.md` without explicit confirmation

Managed files:

- `.agents/memory/decisions.md`
- `.agents/memory/session-memory.md`
- `.agents/memory/quality-metrics.md`
- `.agents/memory/decision-suggestions.md`

---

## Objective

Save the current session state and preserve important decisions **without polluting memory**.

Manage `.agents/memory/decisions.md` as a **structured dashboard** — source of truth for persistent decisions with traceable history.

Ensure that:

- relevant decisions survive between sessions
- scores reflect actual use (reinforcement and obsolescence)
- quality metrics feed `/context` and `/workflow` in the next session
- `session-memory.md` acts as temporary session state (not log) and is cleared after successful persistence

---

## Step 0 — Preconditions (MANDATORY)

To check:

1. `.agents/memory/` exists
   - If NO → block and steer `/memory-init`
2. `.agents/memory/decisions.md` exists
   - If `.agents/memory/` exists but `decisions.md` DOES NOT → create base structure (same schema as `/memory-init`) and register in the analysis as a fallback
   - Prefer full `/memory-init` when memory has never been initialized
3. Valid anti-compaction invariants (pt-BR + Memflow)
   - If NO → block and steer `/context`
4. There is eligible content to save (relevant decision, metric, or session)
- If NO → status `Not required` and stop

---

## Step 1 — Validation of relevance (MANDATORY)

Run only if there is relevant content detected in:

- output of `/execute` (relevance score)
- output from `/review` or `/review-code`
- `session-memory.md` (temporary session state)
- saved artifacts (`.agents/docs/plans/`, `.agents/docs/brainstorm/`, etc.)

### DO NOT save if:

- technical logs or debug output
- trivial executions (score < 21)
- repetitions of information already present in `decisions.md`
- temporary content with no future impact
- actions without continuity between sessions
- session without execution, review or detectable decision
- user chooses "Do not save" at confirmation gate

### SAVE only if there is:

- important decisions
- relevant changes
- technical or architectural definitions
- useful context for future continuity
- eligible metrics after `/review` or `/review-code`

### Blocking rule

If there is NO relevant information:

- DO NOT update files
- status `Not required` (not to be confused with `Blocked`)
- if in doubt about relevance → **DO NOT save**

---

## Step 2 — Auto-detection of decisions

Analyze the current session and automatically identify decisions.

### Decision indicators

Detect patterns such as:

- "we decided that…"
- "we decided…"
- "let's use…"
- "We won't use it anymore…"
- "don't use it anymore…"
- "from now on…"
- "standardize…"
- "defined that…"
- explicit decisions in `/brainstorm`, `/plan`, `/spec` or `/prd` saved
- reinforcement of existing decision (same topic, additional evidence)

For each candidate, extract:

- **title/slug** (kebab-case, single)
- **decision text** (1–3 objective sentences)
- **context** (why it was taken)
- **category** (Criticism | Technique | UI/UX | Other)

---

## Step 3 — Relevance Score (0–100)

Aligned to `/execute`:

| Criterion | Points |
|----------|--------|
| Stack change | +40 |
| Architectural decision | +30 |
| Global standard | +20 |
| Impact multiple files | +10 |
| Local move | +5 |
| Trivial adjustment | 0 |

### Calculation rules

- add **only** criteria applicable to the session
- maximum limit: **100**
- **do not** duplicate equivalent criteria (e.g.: architecture + stack when one already covers the other)
- ensure that every saved decision has a coherent **Score** and **Impact** (impact is semantic, not mechanically derived from the score)

### Interpretation

- **0–20** → Do not save
- **21–50** → Can save (confirm with user)
- **51–80** → Recommend save
- **81–100** → Strongly recommend

---

## Step 4 — Impact Determination

Rate each decision:

- **Low** — local scope, reversible, without systemic effect
- **Medium** — affects relevant module or flow
- **High** — architecture, security, public contract, or multiple domains

---

## Step 5 — Category Classification

Map to section in `decisions.md`:

| Type | Section | Examples |
|------|-------|----------|
| Security, compliance, invariants | `## Critical` | stack, architecture, structural changes |
| Standards, technical rules, implementation | `## Technical` | code standards, libraries, internal contracts |
| Design, UX, accessibility | `## UI/UX` | interface, experience, navigation |
| Other | `## Other` | fallback when it doesn't fit above |

Also record in `## Recent` (maximum 5 entries — see Step 9).

Keep `decisions.md` organized by category — don't mix types.

---

## Step 6 — Structure of `decisions.md`

If `.agents/memory/decisions.md` does not exist (fallback from Step 0), create:


```md
# Project Decisions

## Critical
## Technical
## UI/UX
## Other
## Recent
## History
```


### Mandatory scheme by decision


```md
### {slug} (score: N)
- Category: Critical | Technical | UI/UX | Other
- Impact: Low | Medium | High
- Decision: <objective text>
- Context: <why it was taken>
- Date: YYYY-MM-DD
- Version: 1
```


### Slug rules

- kebab-case (`dark-mode-strategy`, `email-normalization`)
- unique in the file
- stable between sessions (don't rename for no reason)

---

## Step 7 — Versioning and score lifecycle

Before writing, compare each candidate with existing `decisions.md`.

### New decision

- create entry with score calculated in Step 3
- `Version: 1`

### Reinforcement (same theme, additional evidence, or successful use)

- **do not** create duplicate
- update `Decision` and `Context` if there is new information
- score: **+5** (maximum 100)
- increment `Version`

### Contradiction (previous decision violated or reversed)

- add note in `Context` with date and reason
- score: **−15** (minimum 0)
- if score < 30 → move to section `## History` with obsolescence note

### Exact duplicate

- merge into existing entry
- **do not** create new

---

## Step 8 — Mandatory confirmation before writing (CRITICAL)

Before changing any file, present a summary and request confirmation:


```
Summary of what will be saved:

Decisions:
- {slug} (score: N, {new|reinforcement|update})
- ...

Metrics: {yes|no}
Session-memory: will be cleared after saving

Do you want to persist?

A) Yes, save all
B) Save decisions only (no metrics)
C) Do not save
```


- **A** → proceed with Steps 9–13
- **B** → skip Step 11 (metrics), continue
- **C** → status `Not required` and stop

DO NOT write files without explicit confirmation.

---

## Step 9 — Writing of and recent decisions

1. Insert or update entries in the correct sections (`Critical`, `Technical`, `UI/UX`, `Other`)
2. Update `## Recent`:
   - add slug + date at top
   - keep **maximum 5** entries
   - remove the oldest if it exceeds

---

## Step 10 — `session-memory.md` (during and after the session)

### During the session (before saving)

- `session-memory.md` is **temporary state** — not log, not `decisions.md`
- DO NOT turn into permanent history
- keep between **500–1000 tokens** when there is active content
- if you exceed 1000 tokens before saving → condense (remove redundancies), **do not** truncate decisions already detected
- record only operational context of the current session

### After successful persistence

- clear temporary operational contents of `session-memory.md`
- keep minimal placeholder or empty file
- register in analysis: `Session-memory cleared: YES`

If persistence fails or user cancels → **don't** clean up.

---

## Step 11 — Logging Metrics

### Conditions

Register ONLY if:

- there was `/review` or `/review-code` in this session
- execution was not trivial

### Data collected

- `review_result`: approved | approved_with_reserves | failed
- `review_code_result`: approved | approved_with_reserves | failed
- `rework`: yes | no
- `complexity`: low | average | high

### `quality-metrics.md` Update

If the file exists in the legacy format (for example, a loose `approval_rate:` entry), migrate it to the structure below before incrementing counters.

Increment counters and recalculate KPIs:


```md
# Quality Metrics

## Executions

- total: N
- approved: N
- approved_with_reservations: N
- failed: N

## KPIs

- approval_rate: N%
- failure_rate: N%
- average_rework: N

## Current snapshot

- Executions: N
- Approval rate: N%
- Failure rate: N%
- Average rework: N
- Main risk: <short text>
- Trend: improving | stable | getting worse

## Observations

- (insights generated in Step 12)
```


### Effect on next session

- `/context` classifies quality (high | average | low)
- `/workflow` may require `/plan` or enhanced validation when quality is low

---

## Step 12 — Generating Insights

Analyze patterns in recent metrics and observations.

### Conditions

Generate insight ONLY if:

- total runs ≥ 3
- consistent pattern (≥ 2 similar occurrences)

### Types of insight

- `high_risk_due_to_clarity` — tasks with low clarity fail more often
- `high_risk_due_to_integration` — external integrations fail frequently
- `need_for_planning` — direct runs fail frequently
- `need_for_stronger_validation` — recurring failures in specific areas

### Insight Control (CRITICAL)

- maximum **10** active insights in `quality-metrics.md` (section `## Observations`)
- if exceeded → apply eviction in the order below (remove the first eligible):

### Eviction criteria (insights)

**Retention** priority (keep the best scorers):

1. **Recency** — occurrence in the last 5 sessions recorded in `## Executions`
2. **Impact on KPI** — insight linked to recent rejection or rework
3. **Frequency** — pattern with ≥ 3 occurrences in history
4. **Date** — most recent prevails in a tie

Remove the insight with the **lowest** score first in that order. Record in the analysis which insights were removed.

### Insight format in `## Observations`


```md
- [{type}] {short description} (occurrences: N, last: YYYY-MM-DD)
```


Example:


```md
- [high_risk_due_to_integration] external integrations fail frequently (occurrences: 4, last: 2026-05-28)
```


---

## Step 13 — Suggested decisions

Transform recurring patterns into **structured suggestions**, without automating.

### Conditions

Run ONLY if:

- total_executions ≥ 5
- there is relevant insight from Step 12
- consistent pattern identified

### Structure in `decision-suggestions.md`


```md
## Suggestion: {title}

Reason:
<metrics-based explanation>

Recommendation:
<suggested action>

Expected impact: low | medium | high
Confidence: low | average | high
Consecutive ignores: 0
Status: active
Date: YYYY-MM-DD
```


### Suggestion control (CRITICAL)

- maximum of **5** suggestions with `Status: active`
- if exceeded → apply eviction (see criteria below)

### Eviction criteria (suggestions)

**Retention** priority (keep the ones that score the best):

1. **Confidence** — high > medium > low
2. **Expected impact** — high > medium > low
3. **Recency** — most recent `Date`
4. **Less ignored** — lower `Consecutive ignores`

Remove the suggestion with the **lowest** score first in that order. Register in analysis.

### Expiration of ignored suggestions

- when the user **ignores** via `/workflow` → increment `Consecutive ignores` by +1
- when the user **applies** it → remove suggestion from active list
- if `Consecutive ignores` ≥ **3** → archive:
  - change `Status: archived`
  - move to section `## Archived` at the end of `decision-suggestions.md`
  - DO NOT resubmit in `/workflow` unless regeneration with new insight

### Suggestion deduplication

- DO NOT allow suggestions with the same title
- if already exists → update existing, DO NOT create new

### Integration with `/workflow`

- suggestions are **assisted mode** — never applied automatically
- user decides to apply or ignore via `/workflow`
- apply → convert into decision and register via `/memory-save`

---

## Model usage (ALIGNED TO MODEL-POLICY)

- Decision detection and classification → economic model
- Generation of insights and suggestions → intermediate model when history ≥ 5 executions
- Escalate only if high ambiguity in classification

---

## Mandatory rules

1. DO NOT save without explicit confirmation
2. DO NOT duplicate decisions (merge or reinforce)
3. DO NOT pollute memory with trivial adjustments (score < 21)
4. DO NOT clear `session-memory.md` if persistence failed
5. DO NOT turn `session-memory.md` into permanent log
6. DO NOT automatically apply suggestions
7. DO NOT decide execution strategy
8. If in doubt about relevance or conflict → **DO NOT save**

---

## Good practices

- use at the end of each relevant task (especially after `/review`)
- avoid use in trivial tasks
- prioritize quality over quantity of inputs
- `.agents/memory/decisions.md` is the source of truth — score should reflect real importance

---

## Mandatory output format

## Status

- Saved
- Blocked
- Not necessary
- Partial

---

## Analysis

### Validation

- Relevant content identified: YES / NO
- Decisions detected: YES / NO
- Calculated score: X/100
- Impact: Low | Average | High
- Category assigned: Critical | Technical | UI/UX | Other
- Type of action: New decision | Reinforcement | Update | Metrics | Session
- Justification: (brief)

### Persistence

- Saved decisions: N (slug list)
- Reinforced Decisions: N
- Archived decisions: N
- Updated metrics: YES / NO / N/A
- Insights generated: N
- Suggestions generated: N
- Clear session-memory: YES/NO

### Session score

- Relevance score: X/100
- Original `/execute` recommendation: (if applicable)

### Changed files

- `.agents/memory/decisions.md`
- `.agents/memory/quality-metrics.md`
- `.agents/memory/decision-suggestions.md`
- `.agents/memory/session-memory.md`

---

## Problems

- Irrelevant information (if `Not required`)
- Ambiguities in classification or detection
- Possible conflict with existing decisions
- Limitations of automatic detection
- Missing or incomplete Bootstrap

If there is none:
→ None

---

## Next steps

If `Not required` or `Blocked`:

- No persistence action required

If `Saved`:

- `/context` — reload updated memory
- Decision dashboard updated in `decisions.md`
- Continue SDLC flow as per `/workflow`
- Review pending suggestions in `decision-suggestions.md` (if generated)
