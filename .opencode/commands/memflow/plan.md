---
name: plan
description: Creates a detailed implementation plan when /workflow decides PLAN FIRST, aligned with `model-policy.md` of the active target (via `_shared/target-adapter.md`) — sequence of steps, affected files, impact, risks, and success criteria. Do not write code. Output: Status (Plan created/Locked), Analysis with 9 subsections, Problems, and Next steps. Block on ambiguity. Next command: /execute.
license: MIT
metadata:
  author: BrunoCastro
  version: "1.2.0"
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

## Objective

Create an implementation plan:

- clear
- full
- unambiguously
- ready to run via `/execute`

---

## System integration (CRITICAL)

This command:

- SHOULD be used when `/workflow` decides → PLAN FIRST
- Should NOT be used outside of this context without validation

---

## Using MCP Tools

If available:

### Serena MCP (PRIORITY)

- validate real code structure
- identify exact implementation points
- find files and dependencies
- avoid duplication

Prioritize:

- find_symbol
- find_referencing_symbols
- search_for_pattern
- get_symbols_overview

Avoid:

- assume structure
- plan non-existent files

---

## Model usage (ALIGNED TO MODEL-POLICY)

This command should:

- use a smarter model (e.g. GPT-5.4)
- prioritize quality over cost

---

### Main rule

- Planning → stronger model
- Execution → most economical model

---

## Mandatory rules

1. Based on:
   - `.agents` (when available)
   - `docs`
   - `model-policy.md` resolved by active target (via `_shared/target-adapter.md`)
   - real structure (via Serena, if available)
   - resolve `model-policy.md` with the active target rules (via `_shared/target-adapter.md`)

2. DO NOT write code

3. DO NOT assume undefined behavior

4. If there is ambiguity → STOP

5. If there is conflict → STOP

---

## Validation before planning

Before generating the plan:

- Is the problem clear?
- Is the scope defined?
- Is there enough context?
- Are premises and dependencies explicit?
- Are there multiple interpretations of the request?

If not:
→ STOP and request clarification

---

## Explicit premises (MANDATORY)

Before assembling the steps:

- state assumed premises
- declare points still uncertain
- if there is uncertainty that changes approach:
  - TO STOP
  - request user decision via objective options
- DO NOT assume silent interpretation when there is more than one valid reading

---

## Mandatory save confirmation (BEFORE any planning)

Before starting analysis and creating the plan, ASK the user:

- Do you want to save the plan that will be created to maintain documented data?

It is mandatory to present clear options:

- Yes, save the plan
- No, just show in chat

Rules:

- DO NOT start planning before user response
- If the answer is ambiguous, ask again using the same options
- If there is already an explicit save preference in the current session, reuse this preference by default and only confirm when a change is requested
- Register the chosen preference in the plan (save or not save)
- If the user chooses to save, include it in the plan where the content will be documented
- If the user chooses to save, structure the document as a living plan with a progress checklist per task/subtask for updates during `/execute`

---

## Specific rules

- DO NOT plan based on guesswork
- DO NOT create files without validating the need
- DO NOT ignore existing standards
- MUST scale the number of tasks according to actual complexity and scope, without reusing a fixed quantity between plans
- MUST apply dynamic sizing for implementation steps:
  - low complexity: 3-5 tasks
  - medium complexity: 6-10 tasks
  - high complexity: 10+ tasks with mandatory subtasks

---

## Limitations

If Serena is NOT available:

- warn limitation
- plan based on available files

If `.agents` is NOT available:

- warn limitation
- keep plan in degraded mode
- not automatically block for this reason

---

## Locks

- Lack of context → STOP
- Ambiguity → STOP
- Conflict with `.agents` (when it exists) → STOP
- Unknown structure → STOP

---

## Important

- DO NOT implement
- DO NOT move forward without complete clarity
- DO NOT proceed to `/execute` without validation
- This command sets the execution quality

---

## Mandatory output format

## Status

- Plan created / Locked

---

## Analysis

### Understanding

- What needs to be done

---

### Save preference

- User decision: Save / Don't save
- When to save: Defined documentation destination

---

### Applicable rules

- Relevant `.agents` (or absence in degraded mode)
- security (if applicable)

---

### Strategy

- high-level approach
- alignment with existing architecture

---

### Implementation steps

- clear and executable sequence
- based on real structure (when possible)
- number of tasks defined by dynamic sizing (complexity + real scope), with no fixed quantity reused between plans
- for high complexity, include subtasks
- mandatory final granularity checklist: can each item be executed without ambiguity?
- each step must include objective verification in the format:
  - `Step -> verify: test/command/expected evidence`
- Classify each task as:
  - `[P]` parallelizable (can run in parallel)
  - `[S]` sequential (depends on order)

---

### Affected files

- files to create or change
- validate with Serena (if available)

---

### Impact

- affected areas
- dependencies involved

---

### Risks

- technical
- business
- side effects

---

### Success criteria

- verifiable (non-generic) criteria to validate after `/execute`
- map each criterion to command, test, evidence, or expected output

---

### Execution tracking (Living plan)

- mandatory when the preference is to save the plan
- include a checklist per task/subtask with status: pending / in progress / completed / blocked
- include last execution checkpoint and next objective step for resumption
- include an execution mode marker per task/subtask:
  - `[P]` parallelizable
  - `[S]` sequential
- use standard checklist template for consistency:
  - `[ ]` pending
  - `[-]` in progress
  - `[x]` completed
  - `[!]` blocked
- Mandatory criteria to mark `[P]`:
  - no dependency on output from another task
  - no predictable conflict of files/critical areas
  - no blocking by sensitive shared state
  - with isolatable merge and rollback
- if any criteria fail, classify as `[S]`
- apply status consistency between parent task and subtasks:
  - parent task can only be `[x]` when all subtasks are `[x]`
  - if there is a subtask `[-]`, the parent task must be `[-]`
  - if subtask `[!]` exists, the parent task cannot be `[x]`
  - keep update in top-down order (parent task -> subtask) to avoid divergence
- for `[!]` (blocked) items, it is mandatory to register:
  - objective reason for blocking
  - action required to unlock
  - expected person responsible for the action (user, agent or external system)
  - lock exit criteria to return to `[ ]` or `[-]`

Recommended base template:

```md
### Execution progress

- [P][ ] Task 1
  - [S][-] Subtask 1.1
  - [P][x] Subtask 1.2
- [S][!] Task 2 (blocking reason)
  - Unblocking action: <objective action>
  - Responsible party: <user | agent | external system>
  - Exit criteria: <condition to return to [ ] or [-]>

Last checkpoint: <objective summary of the last completed point>
Next step: <objective action for resumption>
```

---

### Out of scope

- what will NOT be done

---

### Confidence in the plan

- Low / Medium / High

---

### Operating mode

- Normal / Degraded
- Impact of the absence of `.agents` (when applicable)

---

## Problems

- ambiguities
- lack of context
- conflicts with `.agents` or `docs`
- Serena's limitations

If there is none:
→ None

---

## Main model and alternatives

- Recommended level: (free/economic/intermediate/advanced)
- Main model: (ex: GPT-5.4)
- Alternative models (2-3, same level):
  - alternative 1
  - alternative 2
  - alternative 3 (optional)
- When to use alternatives:
  - main model unavailability
  - quota/limit reached
  - unstable latency
- Justification:
  - complexity
  - impact
  - risk

---

## Next steps

- Wait for confirmation
- Adjust plan (if necessary)
- Go to `/execute`
- When there is a saved plan: keep the checklist and checkpoint updated during execution
