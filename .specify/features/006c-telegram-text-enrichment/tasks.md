# Tasks — Telegram Text Enrichment / Additional Field Update

## Feature ID
F006C

## Preparation
- [ ] Review catatan format laporan dan pola enrichment di lapangan
- [ ] Review F006A dan F006B flow classification
- [ ] Confirm existing `reports` fields used for enrichment

## Parser
- [ ] Extend parser to detect text enrichment messages
- [ ] Add extraction for `TICKET ID`
- [ ] Add extraction for supported key-value fields
- [ ] Normalize aliases like `SERVICE TYPE`, `WO NUMBER`, `STATUS WFM`, `STATUS ANDALAS`
- [ ] Ignore unsupported fields safely

## Report Model
- [ ] Add helper `findByTicketId(ticketId)` if not already stable
- [ ] Add helper to compare incoming enrichment fields with current report values
- [ ] Add helper to update only empty/null report fields
- [ ] Add helper to record conflicting fields without overwriting

## Telegram Bot Service
- [ ] Extend message classification to include enrichment text
- [ ] Route enrichment messages to enrichment handler
- [ ] If ticket exists, apply enrichment logic
- [ ] If ticket does not exist, send safe error reply
- [ ] If no valid enrichment fields found, send safe reply
- [ ] Send success / no change / conflict feedback messages

## Logging
- [ ] Log `telegram_text_enrichment_applied`
- [ ] Log `telegram_text_enrichment_no_change`
- [ ] Log `telegram_text_enrichment_conflict`
- [ ] Log raw text and changed fields
- [ ] Log unknown ticket failures

## Manual Testing
- [ ] Test add missing branch
- [ ] Test add missing STO
- [ ] Test add multiple fields at once
- [ ] Test same-value enrichment
- [ ] Test conflicting-value enrichment
- [ ] Test unknown ticket
- [ ] Test enrichment text without TICKET ID

## Documentation
- [ ] Save screenshot of enrichment success message
- [ ] Save screenshot of no-change message
- [ ] Save screenshot of conflict message
- [ ] Save screenshot of updated report detail after enrichment
- [ ] Note changed files for BAB IV