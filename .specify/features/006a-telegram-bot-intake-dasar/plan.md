# Technical Plan — Telegram Bot Intake Dasar

## Feature ID
F006A

## Feature Name
Telegram Bot Intake Dasar

## Objective
Menghubungkan Bot Telegram dengan sistem ticketing agar laporan inti dari pelapor dapat diproses otomatis menjadi tiket baru di database.

## Existing Context
Sistem saat ini sudah memiliki:
- autentikasi dan RBAC,
- lifecycle tiket,
- assignment, delegasi, dan cancel assignment,
- dashboard KPI,
- input laporan manual.

Schema `reports` sudah mendukung kolom Telegram:
- `source_channel`
- `telegram_chat_id`
- `telegram_message_id`

Karena itu, feature ini tidak memerlukan perubahan struktur database wajib.

## Technical Stack
- Node.js
- Express.js
- MySQL
- mysql2/promise
- node-telegram-bot-api
- dotenv

## Database Impact
Tidak ada perubahan struktur database wajib.

### Existing fields expected in `reports`
- `source_channel`
- `ticket_id`
- `order_id`
- `wo_number`
- `service_type`
- `segment`
- `provider`
- `telkom_area`
- `branch_name`
- `cluster_name`
- `sto`
- `summary`
- `service_id`
- `status_wfm`
- `status_andalas`
- `status_internal`
- `reported_region_id`
- `current_region_id`
- `telegram_chat_id`
- `telegram_message_id`
- `received_at`

## Files Likely Added or Changed

### New Files
- `services/telegramBotService.js`
- `utils/telegramParser.js`

### Likely Changed Files
- `models/reportModel.js`
- `app.js`
- `.env.example` or local `.env`
- optional: `config/telegram.js` if separating config is preferred

## Backend Design

### Telegram Mode
Use long polling for local development.

### `services/telegramBotService.js`
Responsibilities:
- initialize bot with token
- listen to incoming messages
- pass message text to parser
- validate parsed output
- call model/service to create ticket
- send success/error feedback to user

### `utils/telegramParser.js`
Responsibilities:
- parse structured text from Telegram message
- support base fields:
  - ticket_id
  - order_id
  - wo_number
  - service_type
  - segment
  - provider
  - telkom_area
  - branch_name
  - cluster_name
  - sto
  - summary
  - service_id
  - status_wfm
  - status_andalas
  - region
- return normalized object

### `reportModel.js`
Add function such as:
- `createTelegramReport(parsedData, telegramMeta)`

Responsibilities:
- validate duplicate `ticket_id`
- resolve region code to region id
- insert into `reports`
- set:
  - `source_channel = telegram`
  - `status_internal = tersedia`
  - `current_assigned_user_id = NULL`
  - `reported_region_id`
  - `current_region_id`
  - `telegram_chat_id`
  - `telegram_message_id`
  - `received_at = NOW()`
- insert log `create_telegram_report`

### Feedback Messages
Success response should follow the operational style already seen in the discussion, for example:
- ticket accepted
- order ID acknowledged
- forwarded to HD Data Management for handling

Error response should cover:
- format salah
- data wajib tidak lengkap
- ticket duplikat
- system/database error

## Parser Scope
For F006A, parser supports one core message only.
Additional long messages, follow-up data, and photos are deferred to the next feature.

## Validation Rules
1. `ticket_id` wajib
2. `order_id` wajib
3. `summary` wajib
4. `region` wajib dan harus valid (`PDG` / `BKT`)
5. duplicate `ticket_id` harus ditolak

## Environment Variables
Expected:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `TELEGRAM_BOT_MODE=polling`

## Testing Strategy

### Manual Test Cases
1. bot starts successfully
2. valid Telegram message creates report
3. invalid format is rejected
4. duplicate ticket is rejected
5. created ticket appears in task pool
6. telegram metadata is stored
7. success feedback is sent to chat

## Out of Scope
1. merge additional messages into existing ticket
2. photo/document ingestion
3. status feedback for assigned / in progress / selesai
4. webhook deployment