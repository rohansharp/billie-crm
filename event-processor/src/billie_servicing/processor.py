"""Event processor with transactional guarantees using Billie Event SDKs."""

import asyncio
import json
import os
from datetime import datetime
from typing import Any, Callable, Coroutine

import redis.asyncio as redis
import structlog
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from billie_accounts_events.parser import parse_account_message
from billie_customers_events.parser import parse_customer_message

from .config import settings

logger = structlog.get_logger()


def sanitize_envelope(data: dict[str, Any]) -> dict[str, Any]:
    """
    Sanitize message envelope fields for SDK compatibility.
    
    The broker may send fields with incorrect types:
    - c_seq as empty string instead of int
    - rec as JSON string instead of list
    """
    result = data.copy()
    
    # Fix c_seq: should be int, may come as empty string
    if "c_seq" in result:
        if result["c_seq"] == "" or result["c_seq"] is None:
            result["c_seq"] = 0
        elif isinstance(result["c_seq"], str):
            try:
                result["c_seq"] = int(result["c_seq"])
            except ValueError:
                result["c_seq"] = 0
    
    # Fix seq: should be int
    if "seq" in result:
        if result["seq"] == "" or result["seq"] is None:
            result["seq"] = 0
        elif isinstance(result["seq"], str):
            try:
                result["seq"] = int(result["seq"])
            except ValueError:
                result["seq"] = 0
    
    # Fix rec: should be list, may come as JSON string
    if "rec" in result:
        if isinstance(result["rec"], str):
            try:
                result["rec"] = json.loads(result["rec"])
            except json.JSONDecodeError:
                result["rec"] = [result["rec"]] if result["rec"] else []
        elif result["rec"] is None:
            result["rec"] = []
    
    # Fix dat: payload may be JSON string
    if "dat" in result and isinstance(result["dat"], str):
        try:
            result["dat"] = json.loads(result["dat"])
        except json.JSONDecodeError:
            pass  # Keep as string if not valid JSON
    
    return result


class EventProcessor:
    """
    Transactional event processor using Billie Event SDKs.

    Guarantees:
    - At-least-once delivery via consumer groups with manual XACK
    - Exactly-once semantics via deduplication keys
    - No message loss via XPENDING recovery on startup
    - Dead letter queue for failed messages
    """

    def __init__(
        self,
        redis_url: str | None = None,
        database_uri: str | None = None,
        db_name: str | None = None,
    ) -> None:
        self.redis_url = redis_url or settings.redis_url
        self.database_uri = database_uri or settings.database_uri
        self.db_name = db_name or settings.db_name

        self.redis: redis.Redis | None = None
        self.mongo: AsyncIOMotorClient | None = None
        self.db: AsyncIOMotorDatabase | None = None

        self.consumer_id = f"processor-{os.getpid()}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        self.handlers: dict[str, Callable[..., Coroutine[Any, Any, None]]] = {}
        self._running = False

    def register_handler(
        self, event_type: str, handler: Callable[..., Coroutine[Any, Any, None]]
    ) -> None:
        """Register a handler for a specific event type."""
        self.handlers[event_type] = handler
        logger.info("Registered handler", event_type=event_type)

    async def start(self) -> None:
        """Initialize connections and start processing."""
        print("Connecting to Redis...")
        self.redis = redis.from_url(self.redis_url, decode_responses=False)

        print("Connecting to MongoDB...")
        self.mongo = AsyncIOMotorClient(self.database_uri)
        self.db = self.mongo[self.db_name]

        print("Setting up consumer groups...")
        await self._ensure_consumer_group(settings.inbox_stream)
        await self._ensure_consumer_group(settings.internal_stream)

        print("Processing any pending messages...")
        await self._process_pending_messages(settings.inbox_stream)
        await self._process_pending_messages(settings.internal_stream)

        self._running = True
        print(f"✅ Event processor started (consumer: {self.consumer_id})")
        print(f"👂 Listening for events on:")
        print(f"   - {settings.inbox_stream} (external)")
        print(f"   - {settings.internal_stream} (internal/CRM)")
        print()
        logger.info(
            "Event processor started",
            consumer_id=self.consumer_id,
            streams=[settings.inbox_stream, settings.internal_stream],
        )

        while self._running:
            await self._process_new_messages()

    async def stop(self) -> None:
        """Stop processing and close connections."""
        self._running = False
        if self.redis:
            await self.redis.close()
        if self.mongo:
            self.mongo.close()
        logger.info("Event processor stopped")

    async def _ensure_consumer_group(self, stream: str) -> None:
        """Create consumer group if it doesn't exist for the given stream."""
        try:
            await self.redis.xgroup_create(
                stream,
                settings.consumer_group,
                id="0",
                mkstream=True,
            )
            logger.info(
                "Created consumer group",
                group=settings.consumer_group,
                stream=stream,
            )
        except redis.ResponseError as e:
            if "BUSYGROUP" not in str(e):
                raise
            logger.debug("Consumer group already exists", group=settings.consumer_group, stream=stream)

    async def _process_pending_messages(self, stream: str) -> None:
        """Process messages from previous runs that weren't ACKed for the given stream."""
        logger.info("Processing pending messages...", stream=stream)
        processed_count = 0

        while True:
            pending = await self.redis.xpending_range(
                stream,
                settings.consumer_group,
                min="-",
                max="+",
                count=settings.batch_size,
            )

            if not pending:
                break

            for entry in pending:
                message_id = entry["message_id"]
                delivery_count = entry["times_delivered"]

                messages = await self.redis.xclaim(
                    stream,
                    settings.consumer_group,
                    self.consumer_id,
                    min_idle_time=0,
                    message_ids=[message_id],
                )

                if messages:
                    await self._process_message(messages[0], stream, delivery_count)
                    processed_count += 1

        logger.info("Pending messages processed", stream=stream, count=processed_count)

    async def _process_new_messages(self) -> None:
        """Process new messages from both streams."""
        messages = await self.redis.xreadgroup(
            groupname=settings.consumer_group,
            consumername=self.consumer_id,
            streams={
                settings.inbox_stream: ">",
                settings.internal_stream: ">",
            },
            count=settings.batch_size,
            block=settings.block_timeout_ms,
        )

        if messages:
            for stream_name, stream_messages in messages:
                stream_name_str = stream_name.decode() if isinstance(stream_name, bytes) else stream_name
                for message in stream_messages:
                    await self._process_message(message, stream_name_str)

    async def _process_message(
        self, message: tuple[bytes, dict[bytes, bytes]], stream: str, delivery_count: int = 1
    ) -> None:
        """
        Process a single message with transactional guarantees.

        XACK only happens after successful MongoDB write.
        """
        message_id, fields = message
        message_id_str = message_id.decode() if isinstance(message_id, bytes) else str(message_id)

        try:
            # Decode bytes to strings
            sanitized = {
                k.decode() if isinstance(k, bytes) else k: v.decode() if isinstance(v, bytes) else v
                for k, v in fields.items()
            }

            # Get event type
            event_type = (
                sanitized.get("msg_type")
                or sanitized.get("typ")
                or sanitized.get("event_type", "")
            )

            # Get event ID for deduplication (use 'cause' for CRM events)
            event_id = (
                sanitized.get("cause")
                or sanitized.get("id")
                or sanitized.get("event_id")
                or message_id_str
            )

            log = logger.bind(
                message_id=message_id_str,
                event_type=event_type,
                event_id=event_id,
                stream=stream,
                delivery_count=delivery_count,
            )

            stream_label = "internal" if stream == settings.internal_stream else "external"
            print(f"📥 [{stream_label}] Received event: {event_type} (id: {event_id})")

            # Deduplication check
            dedup_key = f"dedup:{event_id}"
            if await self.redis.exists(dedup_key):
                print(f"   ⏭️  Skipping duplicate event")
                log.debug("Duplicate event, skipping")
                await self.redis.xack(stream, settings.consumer_group, message_id)
                return

            # Parse with appropriate SDK
            parsed_event = self._parse_event(event_type, sanitized)

            # Get handler
            handler = self.handlers.get(event_type)
            if not handler:
                print(f"   ⚠️  No handler for event type: {event_type}")
                log.warning("No handler registered for event type")
                await self.redis.xack(stream, settings.consumer_group, message_id)
                return

            # Execute handler (writes to MongoDB)
            await handler(self.db, parsed_event)

            # Set dedup key with TTL
            await self.redis.setex(dedup_key, settings.dedup_ttl_seconds, "1")

            # ACK after successful write
            await self.redis.xack(stream, settings.consumer_group, message_id)

            print(f"   ✅ Processed successfully")
            log.info("Event processed successfully")

        except Exception as e:
            print(f"   ❌ Error: {e}")
            logger.error(
                "Error processing message",
                message_id=message_id_str,
                stream=stream,
                error=str(e),
                delivery_count=delivery_count,
                exc_info=True,
            )

            if delivery_count >= settings.max_retries:
                print(f"   🗑️  Moving to DLQ after {delivery_count} attempts")
                await self._move_to_dlq(message_id, fields, str(e))
                await self.redis.xack(stream, settings.consumer_group, message_id)
                logger.error("Message moved to DLQ", message_id=message_id_str)

    def _parse_event(self, event_type: str, sanitized: dict[str, Any]) -> Any:
        """Parse event using appropriate SDK."""
        # Sanitize envelope fields for SDK compatibility
        sdk_data = sanitize_envelope(sanitized)
        
        if event_type.startswith("account.") or event_type.startswith("payment."):
            # Use accounts SDK
            return parse_account_message(sdk_data)

        elif event_type.startswith("customer.") or event_type.startswith("application."):
            # Use customers SDK
            payload = parse_customer_message(sdk_data)
            # Wrap in mock ParsedEvent for consistency
            return type(
                "ParsedEvent",
                (),
                {
                    "event_type": event_type,
                    "conversation_id": sdk_data.get("conv", ""),
                    "sequence": sdk_data.get("seq", ""),
                    "payload": payload,
                },
            )()

        else:
            # Chat events - return raw dict
            return sanitized

    async def _move_to_dlq(
        self, message_id: bytes, fields: dict[bytes, bytes], error: str
    ) -> None:
        """Move failed message to dead letter queue."""
        message_id_str = message_id.decode() if isinstance(message_id, bytes) else str(message_id)

        dlq_entry = {
            **{
                k.decode() if isinstance(k, bytes) else k: v.decode() if isinstance(v, bytes) else v
                for k, v in fields.items()
            },
            "original_message_id": message_id_str,
            "error": error,
            "moved_at": datetime.utcnow().isoformat(),
        }

        await self.redis.xadd(settings.dlq_stream, dlq_entry)

