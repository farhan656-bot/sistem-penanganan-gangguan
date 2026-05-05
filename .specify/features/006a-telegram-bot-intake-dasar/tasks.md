# Tasks — Telegram Bot Intake Dasar

## Feature ID
F006A

## Preparation
- [ ] Ensure bot token exists from BotFather
- [ ] Ensure `.env` contains:
  - `TELEGRAM_BOT_TOKEN`
  - `TELEGRAM_BOT_USERNAME`
  - `TELEGRAM_BOT_MODE=polling`
- [ ] Install `node-telegram-bot-api` if not already installed

## Parser
- [ ] Create `utils/telegramParser.js`
- [ ] Define base input format for one core message
- [ ] Parse:
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
- [ ] Normalize output keys to actual `reports` schema needs
- [ ] Add validation for missing required fields

## Telegram Service
- [ ] Create `services/telegramBotService.js`
- [ ] Initialize bot in polling mode
- [ ] Listen to incoming direct messages
- [ ] Call parser for message text
- [ ] Handle parser success and parser failure
- [ ] Send feedback message for success
- [ ] Send feedback message for invalid format
- [ ] Send feedback message for duplicate ticket
- [ ] Send feedback message for system error

## Report Model
- [ ] Add `createTelegramReport()` in `reportModel.js`
- [ ] Validate duplicate `ticket_id`
- [ ] Resolve region code to region id
- [ ] Insert report with:
  - `source_channel = telegram`
  - `status_internal = tersedia`
  - `current_assigned_user_id = NULL`
  - `reported_region_id`
  - `current_region_id`
  - `telegram_chat_id`
  - `telegram_message_id`
  - `received_at = NOW()`
- [ ] Insert `create_telegram_report` log into `report_logs`

## App Bootstrap
- [ ] Import and initialize Telegram bot service in app startup
- [ ] Ensure app does not crash when token is missing; fail with clear message
- [ ] Keep existing web app startup intact

## Validation
- [ ] Reject missing `ticket_id`
- [ ] Reject missing `order_id`
- [ ] Reject missing `summary`
- [ ] Reject invalid region
- [ ] Reject duplicate `ticket_id`

## Manual Testing
- [ ] Start app with Telegram bot enabled
- [ ] Send valid message to bot
- [ ] Verify ticket saved in `reports`
- [ ] Verify `source_channel = telegram`
- [ ] Verify `telegram_chat_id` and `telegram_message_id`
- [ ] Verify ticket appears in task pool
- [ ] Verify success feedback sent to Telegram
- [ ] Send invalid format message
- [ ] Verify format error feedback
- [ ] Send duplicate ticket message
- [ ] Verify duplicate rejection feedback

## Documentation
- [ ] Save screenshot of Telegram success reply
- [ ] Save screenshot of Telegram invalid format reply
- [ ] Save screenshot of duplicate rejection reply
- [ ] Save screenshot of created ticket in task pool
- [ ] Note changed files for BAB IV