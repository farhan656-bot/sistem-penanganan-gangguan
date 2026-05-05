# Checklist — Telegram Bot Intake Dasar

## Bot Setup Checklist
- [ ] Bot token is configured in `.env`
- [ ] Bot username is configured in `.env`
- [ ] Bot starts successfully in polling mode

## Parsing Checklist
- [ ] Bot can read one core message
- [ ] `ticket_id` is extracted correctly
- [ ] `order_id` is extracted correctly
- [ ] `summary` is extracted correctly
- [ ] `region` is extracted correctly
- [ ] optional fields are extracted when present

## Validation Checklist
- [ ] Invalid format is rejected
- [ ] Missing required fields are rejected
- [ ] Invalid region is rejected
- [ ] Duplicate `ticket_id` is rejected

## Database Checklist
- [ ] Report is inserted into `reports`
- [ ] `source_channel` is `telegram`
- [ ] `status_internal` is `tersedia`
- [ ] `reported_region_id` is set
- [ ] `current_region_id` is set
- [ ] `current_assigned_user_id` is NULL
- [ ] `telegram_chat_id` is stored
- [ ] `telegram_message_id` is stored
- [ ] `received_at` is set

## Queue Checklist
- [ ] Created Telegram ticket appears in task pool
- [ ] Ticket follows existing lifecycle rules

## Logging Checklist
- [ ] `create_telegram_report` is written to `report_logs`
- [ ] log description includes ticket_id and source

## Feedback Checklist
- [ ] Success feedback is sent after valid intake
- [ ] Invalid format feedback is sent
- [ ] Duplicate ticket feedback is sent
- [ ] System error feedback is sent safely

## Evidence Checklist
- [ ] Screenshot bot success message
- [ ] Screenshot bot invalid format message
- [ ] Screenshot bot duplicate ticket message
- [ ] Screenshot created ticket in dashboard
- [ ] Screenshot report_logs entry