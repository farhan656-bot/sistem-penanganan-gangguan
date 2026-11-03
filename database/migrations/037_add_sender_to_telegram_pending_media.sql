-- Migration 037: Add telegram_sender_id to telegram_pending_media for sender isolation in group chats

ALTER TABLE telegram_pending_media
ADD COLUMN telegram_sender_id VARCHAR(100) NULL AFTER telegram_message_id;
