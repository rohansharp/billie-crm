"""Event handlers for Billie Servicing App."""

from .account import (
    handle_account_created,
    handle_account_status_changed,
    handle_account_updated,
    handle_schedule_created,
    handle_schedule_updated,
)
from .customer import (
    handle_customer_changed,
    handle_customer_verified,
)
from .conversation import (
    handle_conversation_started,
    handle_utterance,
    handle_final_decision,
    handle_conversation_summary,
    handle_application_detail_changed,
    handle_assessment,
    handle_noticeboard_updated,
)
from .writeoff import (
    handle_writeoff_requested,
    handle_writeoff_approved,
    handle_writeoff_rejected,
    handle_writeoff_cancelled,
)

__all__ = [
    # Account handlers
    "handle_account_created",
    "handle_account_updated",
    "handle_account_status_changed",
    "handle_schedule_created",
    "handle_schedule_updated",
    # Customer handlers
    "handle_customer_changed",
    "handle_customer_verified",
    # Conversation handlers
    "handle_conversation_started",
    "handle_utterance",
    "handle_final_decision",
    "handle_conversation_summary",
    "handle_application_detail_changed",
    "handle_assessment",
    "handle_noticeboard_updated",
    # Write-off handlers (CRM-originated events)
    "handle_writeoff_requested",
    "handle_writeoff_approved",
    "handle_writeoff_rejected",
    "handle_writeoff_cancelled",
]
