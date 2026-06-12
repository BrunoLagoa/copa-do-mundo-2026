---
name: execute
description: Implements code based on the /workflow decision respecting `model-policy.md` of the active target. Without explicit decision by /workflow, block and return to orchestration. Includes integration with smart persistence and quality metrics.
license: MIT
metadata:
  author: BrunoCastro
  version: "3.4.0"
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

Run the deployment:

- respecting the decision of `/workflow`
- following `model-policy.md`
- maintaining consistency with `.agents` and `docs`

This command does NOT decide strategy, it just executes it.

---

## Using MCP tools

### Serena MCP (PRIORITY)

- locate exact points of change
- edit code accurately
- avoid duplication
- understand dependencies

Prioritize:

- find_symbol
- find_referencing_symbols
- replace_symbol_body
- insert_before_symbol / insert_after_symbol

Avoid:

- edit entire files without need

---

## Decision validation (MANDATORY)

### Is there a decision from `/workflow`?

- YES → follow decision  
- NO → BLOCK and return to `/workflow`

---

## No decision from `/workflow`

- Status: Partial
- Reason: Missing strategy decision
- Mandatory action: execute `/workflow`
- DO NOT classify complexity/impact/risk within `/execute`

AND STOP.

---

## Gate anti-compaction (MANDATORY)

Before executing implementation, validate in the active context:

- pt-BR language confirmed
- Memflow identity confirmed

If either is missing or fails:

- Status: Partial
- Reason: invalid anti-compaction invariants
- Mandatory action: rerun `/context`
- DO NOT implement until revalidation

AND STOP.

---

## Integration with `/workflow`

- RUN DIRECT → run  
- PLAN → block  

---

## Explicit premises (MANDATORY)

Before changing code:

- list adopted execution assumptions
- list open ambiguities
- if there is more than one valid interpretation for the same task:
  - STOP
  - request explicit decision from the user
- DO NOT hide uncertainty or choose interpretation silently

---

## Simplicity first

- implement the minimum necessary to resolve the request
- DO NOT add unsolicited features, flexibility or abstractions
- DO NOT create treatment for impossible scenarios in the current context
- if there is a simpler option with the same result, prioritize the simpler option

---

## Template usage- follow model-policy  
- execution → economic model  
- climb only if necessary  

---

## Climbing

1st failure → fix  
2nd failure → review approach  
3rd failure → scale model  

---

## Execution

- implement code  
- adjust files  
- follow project standards  

---

## Integration with saved plan (Vivo Plan)

When there is a plan saved in `.md`:

- read the saved plan before starting implementation
- map planned tasks/subtasks to current execution
- respect the execution method defined in the plan:
  - `[P]` parallelizable: can run in parallel with other `[P]` when there is no conflict
  - `[S]` sequential: execute in the planned order
- update the progress checklist on the saved plan during execution using the default legend:
  - `[ ]` pending
  - `[-]` in progress
  - `[x]` completed
  - `[!]` blocked
- preserve `[P]` and `[S]` mode markers during status updates
- maintain consistency between parent task and subtasks when updating status:
  - only mark parent task as `[x]` when all subtasks are `[x]`
  - when there is subtask `[-]`, reflect parent task as `[-]`
  - when there is a subtask `[!]`, do not mark the parent task as `[x]`
- update in top-down order (parent task -> subtask) to avoid contradictory state
- when there is item `[!]`, register in the saved plan:
  - objective reason for blocking
  - action required to unlock
  - expected person responsible for the action (user, agent or external system)
  - exit criteria to return to `[ ]` or `[-]`
- update the last checkpoint and the next step at the end of the execution
- if the execution stops in the middle, clearly record where it stopped and what remains to resume

If there is no saved plan:

- execute normally based on `/workflow` decision

---

## Security

- respect `.agents`  
- avoid exposing secrets  
- separate client/server correctly  

If `.agents` missing:
- apply good practices  
- degraded mode  

---

## Tests

- detect runtime  
- run relevant tests  
- avoid regression  

---

## Stack detection

Identify:- language/runtime  
- manager  
- lint/test commands  

---

## Mandatory quality

After implementing:

1. setup (if necessary)  
2.format  
3. lint/typecheck  
4. testing  

If an error occurs, fix it and repeat the cycle until the success criteria defined in the plan/scope are validated.

---

## Goal-oriented execution (MANDATORY)

For each step implemented:

- define verifiable objective
- perform objective validation (test, command, evidence of behavior)
- only move forward when validation passes

Recommended format:

1. `<step>` → check: `<command/test/evidence>`

---

## Specific rules

- DO NOT overwrite without analysis  
- DO NOT duplicate code  
- DO NOT change multiple files unnecessarily  
- apply surgical changes: each changed line must have a direct link with the request
- DO NOT refactor adjacent parts outside the scope of the request
- remove only leftovers generated by the change itself (orphan imports/variable/funtions created by the change)
- DO NOT auto-execute next flow commands without user confirmation
- DO NOT end execution with an outdated saved plan when there has been progress in tasks/subtasks

---

## Resilience

- simple error → fix  
- structural error → review plan  
- recurring error → escalate  

---

# Intelligent persistence (AUTO MEMORY)

After execution, evaluate memory relevance.

---

## Relevance assessment

Check if there was:

- technical decisions  
- relevant changes  
- defined standards  
- architectural choices  
- useful context  

---

## Decision detection

Detect patterns:

- “let’s use…”  
- “we decided…”  
- “standardize…”  
- “don’t use it anymore…”  
- “from now on…”  

---

## Relevance score (0–100)

- Stack change: +40  
- Architectural decision: +30  
- Global standard: +20  
- Impact multiple files: +10  
- Local change: +5  
- Trivial adjustment: 0  

---

## Interpretation

- 0–20 → Do not save  
- 21–50 → Can save  
- 51–80 → Recommend  
- 81–100 → Strongly recommend  

---

## Result

If score ≥ 51:

→ Run `/memory-save`

If score < 51:

→ No need to save  

---

# Integration with quality metrics (NEW)

If execution is followed by:

- `/review`
- `/review-code`

So:

→ Prioritize execution of `/memory-save`

Objective:

- record quality of execution  
- feed system history  
- allow future analysis  

---

## Important

- DO NOT decide strategy  
- DO NOT skip validations  
- DO NOT end with an error  
- DO NOT execute without understanding  

---

# Mandatory output format

## Status

- Executed / Failed / Partial  

---

## Analysis

- What was done  
- Changed files  
- Explicit premises and ambiguities addressed
- Traceability: changes linked to the order (YES / NO)
- Use of Serena  
- Use of fallback  
- Adherence to the workflow  
- Mode: Normal / Degraded  
- Updated saved plan: YES / NO / N/A
- Registered resumption checkpoint: YES / NO / N/A

---

## Problems

- Errors or risks  
- Impacts  

If there is none:
→ None  

---

## Suggested persistence

- Relevance score: X/100  
- Relevant content: YES / NO  
- Decisions detected: YES / NO  
- Eligible quality metrics: YES / NO  
- Recommendation:
  - Run `/memory-save`
  - No need to save  

---

## Locks

- Plan required → STOP  
- Conflict with `.agents` → STOP  
- Lack of context → STOP  
- Failure of anti-compaction invariants → STOP

---

## Next steps

- `/review`  
- `/review-code` (if applicable)  
- `/memory-save` (recommended after validation)  
- `/review-enforce-rules` (optional)  
- `/test-plan` (if applicable)  
- Wait for explicit confirmation from the user before executing any next command
