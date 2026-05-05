# Checklist — Telegram Text Enrichment / Additional Field Update

## Parsing Checklist
- [ ] Bot can detect enrichment text messages
- [ ] `TICKET ID` is extracted correctly
- [ ] Supported key-value fields are extracted correctly
- [ ] Unsupported fields are ignored safely

## Update Checklist
- [ ] Empty `branch_name` can be filled from Telegram text
- [ ] Empty `sto` can be filled from Telegram text
- [ ] Empty `cluster_name` can be filled from Telegram text
- [ ] Multiple empty fields can be filled in one enrichment message
- [ ] No new ticket is created during enrichment

## Conflict Checklist
- [ ] Same-value enrichment does not break data
- [ ] Different existing value is not overwritten automatically
- [ ] Conflict is logged properly

## Logging Checklist
- [ ] `telegram_text_enrichment_applied` is logged
- [ ] `telegram_text_enrichment_no_change` is logged
- [ ] `telegram_text_enrichment_conflict` is logged
- [ ] Raw enrichment text is recorded in logs

## Feedback Checklist
- [ ] Success update reply is sent
- [ ] No-change reply is sent
- [ ] Conflict reply is sent
- [ ] Unknown ticket reply is sent

## Safety Checklist
- [ ] Message without `TICKET ID` does not create a new ticket
- [ ] Message with unsupported fields does not break the bot
- [ ] Existing media logic remains intact
- [ ] Existing intake logic remains intact

## Evidence Checklist
- [ ] Screenshot enrichment success
- [ ] Screenshot updated branch in report detail
- [ ] Screenshot no-change feedback
- [ ] Screenshot conflict feedback
- [ ] Screenshot corresponding log entries