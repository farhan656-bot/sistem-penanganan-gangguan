# AGENTS.md

## Project Context
This project is a ticket monitoring and service disruption management system for Divisi Data Management PT Telkom Sumbar Witel Padang.

The system is built as an academic final project and operational prototype.

## Main Stack
- Node.js
- Express.js
- MySQL
- mysql2/promise
- EJS
- Bootstrap 5
- express-session
- CommonJS

## Architecture Rules
- Preserve the existing MVC structure.
- Keep SQL queries in model files.
- Use mysql2/promise.
- Use CommonJS with `require` and `module.exports`.
- Do not introduce ORM.
- Do not use ES Modules.
- Do not introduce React, Vue, Tailwind, or another frontend framework.
- Do not rewrite unrelated files.

## Spec Driven Development
This project uses Spec Driven Development with Spec Kit.

Before implementing or changing a feature, read:
1. `.specify/memory/constitution.md`
2. `.github/copilot-instructions.md`
3. the related feature folder under `.specify/features/`

For each feature, read:
- `spec.md`
- `plan.md`
- `tasks.md`
- `checklist.md`

## Current Feature Status
The following major features have been implemented:

- F001 Superadmin User Management
- F002 Ticket Lifecycle and Status Handling
- F003 Assignment / Delegation Related Flow
- F004 Supervisor KPI Dashboard Refinement
- F005 Manual Report Entry
- F006 Telegram Bot Intake / Feedback / Text Enrichment
- F007 Temporary Region Switch Approval
- F008 UI/UX Refinement and Layout Standardization
- F033 Report Identity & Database Normalization (RELEASED, tag: f033-normalization-completed)
- F034 UI/UX Refinement & Anti-Slop (RELEASED, tag: f034-ui-ux-refinement)

## F034 Release Checkpoint
- Feature: 034-ui-ux-refinement
- Status: RELEASED
- Release tag: f034-ui-ux-refinement
- Branch: master
- Pre-release baseline: 17b305c14dcc2ed23cf75c8bd641b6bcabb1cf6d
- Tasks: T078–T084 completed
- Acceptance: T083 PASS / APPROVED
- NF-05: Belum diuji
- Database: No mutation during F034 release process
- Tests: 84 total (83 pass, 0 fail, 1 skipped)

F008 and F034 have already been completed through the final safety check stage. Do not re-implement F008 or F034 unless explicitly asked.

## Important Business Rules
- Do not change Telegram bot logic unless explicitly requested.
- Do not change Region Switch F007 logic unless explicitly requested.
- Do not change ticket lifecycle logic unless explicitly requested.
- Do not change supervisor KPI calculation logic unless explicitly requested.
- Do not change database schema unless the feature explicitly requires it.
- Supervisor dashboard must remain read-only.
- Eksekutor can submit Region Switch F007 requests.
- Koordinator can approve or reject Region Switch F007 requests.
- Super Admin manages users and can access administrative pages.

## Ticket Status Rules
The active ticket statuses used in the current implementation are:
- `tersedia`
- `diambil`
- `didelegasikan`
- `selesai`
- `perlu_tindak_lanjut`
- `eskalasi`

Status `baru` is not used in the current implementation.
Tickets from Telegram bot and manual input directly use status `tersedia`.

## F007 Region Switch Rule
F007 Temporary Region Switch Approval has been implemented successfully.

Rules:
- Eksekutor can request temporary access to another region.
- Koordinator can approve or reject the request.
- User permanent home region must not be changed.
- Approved region switch gives temporary access only.
- Expired region switch must no longer grant access.

## F008 UI/UX Status
F008 UI/UX Refinement and Layout Standardization has been completed.

It includes:
- global layout
- sidebar
- topbar
- login page refinement
- Superadmin UI refinement
- Supervisor UI refinement
- Eksekutor UI refinement
- Koordinator UI refinement
- table standardization
- badge standardization
- form standardization
- alert standardization
- date display refinement
- final safety check

Do not redo F008 unless explicitly requested.
Only make small UI fixes if the user asks for a specific issue.

## Triad Collaboration Model (Workflow TA)
This project follows a strict three-role collaboration model documented in `docs/WORKFLOW_TA.md`:
- **User / Anda (Human)**: Human Approval Gate & final decision maker.
- **ChatGPT**: Orchestrator, Reviewer, and Auditor (spec, plans, thesis consistency).
- **Antigravity**: Implementer, Refactorer, and Test Executor (code execution, test runs, anti-slop filter, factual reporting).

## Workflow Rules for Future Work
When asked to implement a new feature:
1. Read the relevant Spec Kit documents first.
2. Inspect the current codebase.
3. Propose a short implementation plan.
4. Modify only related files.
5. Preserve existing working logic.
6. Explain files changed and manual test steps.

When asked to fix a bug:
1. Identify the affected file.
2. Make the smallest safe change.
3. Do not refactor unrelated code.
4. Explain the root cause and test steps.

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read `.agents/skills/antislop/SKILL.md` (core) and then the skill for the task:
- UI / visual: `.agents/skills/antislop-ui/SKILL.md`
- Copy & text: `.agents/skills/antislop-copywriting/SKILL.md`
- People: `.agents/skills/antislop-human/SKILL.md`
- Mobile / responsive: `.agents/skills/antislop-layoutmobile/SKILL.md`
- Code comments: `.agents/skills/antislop-code/SKILL.md`

Before starting, ask the user when antislop applies: during the work, or after it is done.
Note: antislop acts as an AI output quality filter and must strictly preserve all existing architecture rules (MVC, CommonJS, MySQL2, Bootstrap 5, no-ORM) defined above.
<!-- antislop:end -->