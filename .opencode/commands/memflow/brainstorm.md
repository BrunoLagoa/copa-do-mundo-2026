---
name: brainstorm
description: Structured brainstorming before any implementation — explores the problem in conversational phases, generates 2 to 5 approaches with pros/cons, proposed design, risks and recommendation. Includes HARD-GATE anti-bypass, dialog with selectable options, self-review, save gate and readiness criteria (DoD). Output: Status, Analysis, Problems and Next steps. Prerequisite: /context. Next step: /prd, /spec or /plan (depending on gate). It doesn't implement anything.
license: MIT
metadata:
  author: BrunoCastro
  version: "1.3.0"
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
- Resolve these references according to `_shared/target-adapter.md` (no fallback outside the active target).

---

## System integration (CRITICAL)

This command:

- MUST be used when `/workflow` decides to → EXPLORE FIRST
- MAY be used before `/prd`, `/spec` or `/plan` when there are trade-offs or insufficient clarity
- DOES NOT replace `/prd`, `/spec` or `/plan` — prepares decision for next step
- MUST NOT invoke `/execute` or any implementation

Allowed handoff (decide at final gate):

- `/prd` — lacks product definition, scope or business criteria
- `/spec` — PRD exists, deterministic technical decision is lacking
- `/plan` — scope and approach are already clear enough to plan implementation

---

## Mandatory gate (HARD-GATE)

DO NOT invoke `/execute`, write code, scaffold project, or take any implementation action until:

1. present the complete recommendation
2. Complete Self-Review
3. get explicit user approval

This goes for **every** task, regardless of perceived complexity.

### Anti-pattern: "It's too simple to need brainstorming"

Simple tasks may be short in design (few sentences), but they **always** pass the gate. "Simple" projects are where unexamined assumptions generate the most rework.

HARD-GATE violation → status `Blocked`.

---

## Objective

Explore multiple possible approaches before defining a solution, with incremental validation and clear handoff to the next SDLC command.

---

## Model usage (ALIGNED TO MODEL-POLICY)

- **Phases 1–2 (context and approaches):** economic model by default
- **Validation in code (Serena) and comparison of trade-offs:** intermediate model when complexity ≥ medium
- **Final recommendation, proposed design and DoD:** strongest model when complexity ≥ medium or risk ≥ medium
- Escalate only when the quality of the decision justifies it

---

## Using MCP tools

If available:

### Serena MCP- Use for:
  - understand the actual structure of the code
  - identify existing patterns
  - find similar implementations
  - validate assumptions about architecture
- Prioritize:
  - find_symbol
  - find_referencing_symbols
  - search_for_pattern
  - get_symbols_overview
- Avoid:
  - assume structure without validation
  - base decisions on file names only

---

## Visual resources (optional)

Decide **per question**, not per entire session.

**Use diagram or mockup** (Mermaid, canvas or equivalent) when the content **is visual**:

- UI layout, wireframes, side-by-side comparison
- component architecture, data flow, state machine

**Use terminal/texto** when the content is conceptual:

- trade-offs, scope, success criteria, API decisions
- requirement or clarification questions

Question about UI is not automatically visual. "What does X mean in this context?" → text. "Which layout works best?" → visual.

---

## Phased process (MANDATORY)

Execute in order. Don't skip phases. Proceed only after validating the current phase.

| Phase | Objective | Typical status |
|------|----------|---------------|
| 1/4 | Context, premises and gaps | `In exploration (fase 1/4)` or `Aguardando resposta` |
| 2/4 | Approaches, pros/cons and complexity | `In exploration (fase 2/4)` or `Aguardando resposta` |
| 3/4 | Proposed design, risks, criteria and recommendation | `In exploration (fase 3/4)` or `Aguardando resposta` |
| 4/4 | Self-review, rescue gate and handoff | `In exploration (fase 4/4)` → final readiness status |

### Phase 1 — Context and gaps

- Explore `.agents`, `docs` and real code (Serena, when available)
- If the scope describes multiple independent subsystems → **decompose first** (see section below)
- Identify validated assumptions vs. not validated
- Ask **one question at a time** for remaining gaps
- Validate understanding before moving forward

### Phase 2 — Approaches

- Propose **2 to 5** different approaches
- Compare pros, cons and complexity (Low / Medium / High)
- Base on real code standards when possible
- **DO NOT** close a single solution yet

### Phase 3 — Design and recommendation- Present proposed design (scale by complexity)
- Define success criteria, risks and adherence to the project
- Register recommendation, rejected options and confidence
- Request validation of the recommendation from the user

### Phase 4 — Self-review, rescue and handoff

- Perform self-review (see section below)
- Ask save gate (if not already answered)
- Set next command: `/prd`, `/spec` or `/plan`
- Mark readiness status only after explicit approval

---

## Structured dialogue (MANDATORY)

When you need user input:

- present options in a structured and selectable dialog
- **prefer multiple choice** (A/B/C/D) instead of open-ended question
- **one question per message**
- include option `Other` when it makes sense
- if user chooses `Other` → request details afterwards (free text only at this stage)
- if answer ambiguous → repeat the same dialogue until explicit selection
- record in the analysis which option was chosen

---

## Decomposition into sub-projects

When the scope involves multiple independent subsystems (e.g. chat + billing + analytics):

1. list sub-projects with relationship and suggested order of construction
2. brainstorm **just the first** sub-project in this session
3. register the others in **Next steps** as future cycles (`brainstorm → spec/plan → execute` each)
4. DO NOT try to close recommendation for the entire system at once

---

## Work on existing codebase

Before proposing changes:

- explore existing structure and patterns (Serena when available)
- follow project conventions
- include **targeted** improvements when current code gets in the way of work (large file, blurred boundaries) — justify and keep scope focused
- DO NOT propose refactoring unrelated to the current objective

### Design for isolation and clarity

For each proposed unit, answer:

- what do you do?
- how is it used?
- what does it depend on?

Prefer smaller units with clear interfaces and single responsibility.

---

## Rules1. Build on:
   - `.agents` (technical restrictions)
   - `docs` (product objectives)
   - Serena MCP (when available, to validate the real code)
2. DO NOT choose a single solution before phase 3.
3. DO NOT implement anything.
4. Whenever necessary:
   - validate assumptions with Serena
   - avoid decisions based only on static context
5. DO NOT proceed to handoff without explicit user approval of the recommendation.
6. DO NOT invoke `/execute`, `/plan` or write code without completing the gate.

---

## Specific rules

- DO NOT assume architecture without validating it in the code
- DO NOT propose solutions that contradict existing standards
- DO NOT ask for confirmation of normative file path when the command is already running on the active target
- If Serena is available:
  - validate at least one hypothesis in real code
- If Serena is NOT available:
  - warn limitation in the analysis
- Apply YAGNI:
  - avoid overengineering and unsolicited scope
- Every recommendation must indicate the main source:
  - real code (Serena), docs, or explicit user validation

---

## Mandatory save confirmation (Phase 4)

Before marking readiness status, ASK the user:

- Want to save the brainstorm to keep the data documented?

It is mandatory to present clear options:

- Yes, save the brainstorm
- No, just show in chat

Rules:

- DO NOT mark readiness status before user response about save
- Ask the question in a structured dialogue with selectable options (not in free text)
- If the answer is ambiguous, ask again using the same options
- Register the chosen preference in the output (save or not save)
- If the user chooses to save, use default destination: `.agents/docs/brainstorm/YYYY-MM-DD-<topico>.md`
- Record the path in the **Next steps** section when saving

---

## Self-review (before readiness status)

Run inline before marking `Pronto para /prd`, `Pronto para /spec` or `Pronto para /plan`:| Check | What to look for |
|-------|--------------|
| Placeholders | TBD, TODO, incomplete or vacant sections |
| Consistency | Contradictions between approaches, design and recommendation |
| Scope | Does it fit into a single `/plan` or does it need to be broken down into sub-projects? |
| Ambiguity | Any requirements interpretable in two different ways? |

Fix issues inline. Do not mark readiness while there is an issue that compromises the handoff.

---

## Important

- If any approach violates `.agents` → DISCARD
- If in doubt → ASK (structured dialogue)
- DO NOT implement anything
- DO NOT infer behavior without evidence

---

## Produce (**Analysis** content)

Under **Analysis**, include the `###` subsections applicable to the current phase. In the final phase, include **all**:

### Problem

- What needs to be resolved

### Assumptions and gaps

- What is a validated fact
- What is a premise that has not yet been validated
- Which gaps require asking the user

### Sub-projects (when applicable)

- List of independent parts, suggested order and which is in focus in this session

### Possible approaches

- List 2 to 5 different options
- Whenever possible:
  - base on real code patterns (via Serena)

### Pros and cons

- For each approach

### Complexity

- Low / Medium / High (by approach or synthesis)

### Proposed design

- Scale by complexity: few sentences if simple; up to ~300 words if complex
- Cover when applicable:
  - affected architecture/components
  - data flow
  - error handling
  - testing strategy
  - justified collateral improvements (if any)

### Risks

- Technical or business
- Consider impact on existing code

### Success criteria

- How to measure whether the solution meets the objective
- Objective criteria (functional, technical and business, when applicable)

### Adherence to the project

- Compatible with `.agents`?
- Aligned with `docs`?
- Consistent with the current code (via Serena)?

### Recommendation

- Best option (with justification)
- Suggested handoff: `/prd`, `/spec` or `/plan` (with reason)

### Decision and rejected

- Option chosen and reason
- Discarded options and reason for discarding### Confidence in the recommendation

- Low / Medium / High

### Current phase

- Indicate process phase (e.g.: `2/4 — Abordagens`)

### Save preference

- Save / Don't save
- Path defined (when saving)

---

## Readiness Criteria (DoD)

Only use status `Pronto para /prd`, `Pronto para /spec` or `Pronto para /plan` if **ALL** of the following items are met:

- defined problem with clear scope
- premises and gaps explained
- 2 to 5 approaches compared with pros and cons
- proposed design presented (scale appropriate to complexity)
- main risks identified
- defined success criteria
- justified recommendation with explicit handoff
- rejected options recorded with reason
- self-review completed (4 checks)
- registered save preference
- explicit user approval to proceed to the next command

---

## Mandatory output format

**Always** respond with these four titles `##`, **in this order** and **with these exact names**:

1. **Status** — use only one value between:
- `In exploration (fase 1/4)`
- `In exploration (fase 2/4)`
- `In exploration (fase 3/4)`
- `In exploration (fase 4/4)`
   - `Aguardando resposta`
   - `Blocked`
   - `Pronto para /prd`
   - `Pronto para /spec`
   - `Pronto para /plan`
2. **Analysis** — main content; just use `###` to subdivide (see list above).
3. **Issues** — `.agents` violations, context gaps, unacceptable risks, HARD-GATE violation; if there is none: **None**.
4. **Next steps** — e.g.: questions to the user (structured dialogue), run `/prd`, `/spec` or `/plan`, save artifact; wait for explicit confirmation before handoff (**always** the last `##` section of the response).

Do not omit sections. Do not rename titles.
