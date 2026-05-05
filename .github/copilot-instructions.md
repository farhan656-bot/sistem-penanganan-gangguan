# Copilot Instructions — Sistem Pengelolaan Tiket Gangguan

## Project Context
This project is an internal operational system for managing disturbance tickets using:
- Node.js
- Express.js
- MySQL (XAMPP localhost)
- EJS
- Bootstrap 5
- express-session
- mysql2/promise

This system is **not** a replacement for the Telkom core system. It acts as an internal mediation, assignment, monitoring, and logging platform.

---

## Required Architecture
Use a simple MVC structure:

- `controllers/`
- `models/`
- `routes/`
- `middlewares/`
- `views/`
- `public/`
- `config/`

Use CommonJS:
- `require(...)`
- `module.exports = ...`

Do not use ES Modules unless explicitly requested.

---

## Authentication and Authorization Rules
There are 5 roles:
- `pelapor`
- `eksekutor`
- `koordinator`
- `supervisor`
- `super_admin`

Rules:
- `pelapor` interacts only via Telegram bot
- `eksekutor` can access only own district tickets and delegated tickets
- `koordinator` can delegate and cancel assignments
- `supervisor` is read-only
- `super_admin` manages users only

Always enforce role checks using middleware.

---

## Ticket Business Rules
Important ticket rules:
- `eksekutor` can only take tickets with status `tersedia`
- `eksekutor` can only take tickets from own district
- delegated tickets do not change ticket district
- delegation only changes active assignee
- `PDG` tickets can only be delegated to `BKT` executors
- `BKT` tickets can only be delegated to `PDG` executors
- assignment cancellation can only be done by `koordinator`

Supported statuses:
- `baru`
- `tersedia`
- `diambil`
- `didelegasikan`
- `selesai`
- `perlu_tindak_lanjut`
- `eskalasi`

---

## SLA Rules
- response time = `received_at` to `taken_at`
- resolution time = `taken_at` to `resolved_at`

Do not redefine SLA logic unless explicitly requested.

---

## Database Rules
Use MySQL queries via `mysql2/promise`.

Critical actions must use database transactions:
- take ticket
- delegate ticket
- cancel assignment
- complete ticket
- escalation / follow-up status changes

Use `SELECT ... FOR UPDATE` for locking rows when needed.

Always preserve audit logs.

---

## Logging Rules
Every important action must be logged to `report_logs`, including:
- ticket received
- take ticket
- delegate ticket
- cancel assignment
- complete ticket
- follow-up
- escalation

Log payload should include:
- `report_id`
- `user_id`
- `action`
- `description`
- `created_at`

---

## UI/UX Rules
UI must follow Telkom Indonesia enterprise style:
- white / light gray background
- red accent for primary brand emphasis
- blue / gray accent for neutral enterprise components
- clean Bootstrap 5 layout
- clear cards and tables
- readable typography
- compact operational forms
- consistent badges for ticket statuses

UX rules:
- keep operational actions visible
- make ticket status and assignee obvious
- minimize unnecessary steps
- always show flash message after important actions
- destructive actions must use confirmation prompts

---

## Code Style Rules
- prefer clear and explicit code over overly clever abstractions
- keep controller logic concise, move SQL logic to models
- validate request body before database operations
- use meaningful function names
- keep files focused on one responsibility
- avoid unnecessary dependencies
- do not introduce ORM unless explicitly requested
- use server-side rendering with EJS unless otherwise requested

---

## What Copilot Should Avoid
Do not:
- change district ownership during delegation
- allow executor to cancel own assignment
- allow supervisor to mutate operational data
- expose unsafe admin operations without role checks
- remove logs
- invent business rules outside the constitution
- bypass transaction safety for assignment-related actions

---

## When Generating New Features
For every new feature:
1. follow the constitution
2. preserve role rules
3. preserve SLA rules
4. preserve district delegation rules
5. preserve audit logging
6. produce production-like but readable code suitable for academic final project documentation

---

## Preferred Feature Development Order
1. super admin & user management
2. ticket lifecycle and statuses
3. delegation and cancellation
4. supervisor KPI dashboard
5. telegram bot intake
6. telegram bot feedback/update flow