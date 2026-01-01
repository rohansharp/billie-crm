"""
Unit Tests for Write-Off Event Handlers

Tests cover event handling for:
- writeoff.requested.v1
- writeoff.approved.v1
- writeoff.rejected.v1
- writeoff.cancelled.v1

These are CRM-originated events processed by the event processor.
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from billie_servicing.handlers.writeoff import (
    handle_writeoff_requested,
    handle_writeoff_approved,
    handle_writeoff_rejected,
    handle_writeoff_cancelled,
    _parse_payload,
    _generate_request_number,
)


class TestPayloadParsing:
    """Tests for payload parsing utility."""

    def test_parse_dict_payload(self):
        """Should return payload as-is when already a dict."""
        event = {"payload": {"key": "value"}}
        result = _parse_payload(event)
        assert result == {"key": "value"}

    def test_parse_json_string_payload(self):
        """Should parse JSON string payload."""
        event = {"payload": '{"key": "value"}'}
        result = _parse_payload(event)
        assert result == {"key": "value"}

    def test_parse_empty_payload(self):
        """Should return empty dict for missing payload."""
        event = {}
        result = _parse_payload(event)
        assert result == {}

    def test_parse_invalid_json_payload(self):
        """Should return empty dict for invalid JSON."""
        event = {"payload": "not valid json"}
        result = _parse_payload(event)
        assert result == {}


class TestRequestNumberGeneration:
    """Tests for request number generation."""

    def test_generate_request_number_format(self):
        """Should generate request number in WO-TIMESTAMP-SUFFIX format."""
        result = _generate_request_number()
        assert result.startswith("WO-")
        parts = result.split("-")
        assert len(parts) == 3
        assert len(parts[1]) == 14  # YYYYMMDDHHMMSS
        assert len(parts[2]) == 4   # Random suffix

    def test_generate_unique_request_numbers(self):
        """Should generate unique request numbers."""
        numbers = set()
        for _ in range(100):
            numbers.add(_generate_request_number())
        # At least 90% should be unique (timestamp + random suffix)
        assert len(numbers) >= 90


class TestWriteoffRequestedHandler:
    """Tests for writeoff.requested.v1 event handler."""

    @pytest.mark.asyncio
    async def test_handle_writeoff_requested_creates_document(self, mock_db):
        """Should create a new write-off request document."""
        event = {
            "conv": "req-123",
            "cause": "evt-456",
            "typ": "writeoff.requested.v1",
            "payload": {
                "loanAccountId": "acc-001",
                "customerId": "cust-001",
                "customerName": "John Smith",
                "accountNumber": "1234567890",
                "amount": 1500.0,
                "originalBalance": 1500.0,
                "reason": "hardship",
                "notes": "Customer hardship case",
                "priority": "high",
                "requestedBy": "user-001",
                "requestedByName": "Jane Doe",
            },
        }

        await handle_writeoff_requested(mock_db, event)

        mock_db["write-off-requests"].insert_one.assert_called_once()
        call_args = mock_db["write-off-requests"].insert_one.call_args
        document = call_args[0][0]

        # Verify IDs
        assert document["requestId"] == "req-123"
        assert document["eventId"] == "evt-456"
        assert document["requestNumber"].startswith("WO-")

        # Verify account/customer info
        assert document["loanAccountId"] == "acc-001"
        assert document["customerId"] == "cust-001"
        assert document["customerName"] == "John Smith"
        assert document["accountNumber"] == "1234567890"

        # Verify request details
        assert document["amount"] == 1500.0
        assert document["originalBalance"] == 1500.0
        assert document["reason"] == "hardship"
        assert document["notes"] == "Customer hardship case"
        assert document["priority"] == "high"
        assert document["status"] == "pending"

        # Verify audit
        assert document["requestedBy"] == "user-001"
        assert document["requestedByName"] == "Jane Doe"
        assert "requestedAt" in document
        assert "createdAt" in document
        assert "updatedAt" in document

    @pytest.mark.asyncio
    async def test_handle_writeoff_requested_with_json_string_payload(self, mock_db):
        """Should handle JSON string payload."""
        import json
        
        payload = {
            "loanAccountId": "acc-002",
            "customerId": "cust-002",
            "amount": 500.0,
            "reason": "bankruptcy",
            "requestedBy": "user-002",
        }
        
        event = {
            "conv": "req-789",
            "cause": "evt-789",
            "typ": "writeoff.requested.v1",
            "payload": json.dumps(payload),
        }

        await handle_writeoff_requested(mock_db, event)

        mock_db["write-off-requests"].insert_one.assert_called_once()
        call_args = mock_db["write-off-requests"].insert_one.call_args
        document = call_args[0][0]

        assert document["loanAccountId"] == "acc-002"
        assert document["amount"] == 500.0
        assert document["reason"] == "bankruptcy"


class TestWriteoffApprovedHandler:
    """Tests for writeoff.approved.v1 event handler."""

    @pytest.mark.asyncio
    async def test_handle_writeoff_approved_updates_status(self, mock_db):
        """Should update status to approved with approval details."""
        event = {
            "conv": "req-123",  # Same as original request
            "cause": "evt-approve-456",
            "typ": "writeoff.approved.v1",
            "payload": {
                "requestId": "req-123",
                "requestNumber": "WO-20241211-ABCD",
                "comment": "Approved after review",
                "approvedBy": "supervisor-001",
                "approvedByName": "Supervisor Name",
            },
        }

        await handle_writeoff_approved(mock_db, event)

        mock_db["write-off-requests"].update_one.assert_called_once()
        call_args = mock_db["write-off-requests"].update_one.call_args

        # Verify query filter uses requestId (from conv)
        assert call_args[0][0] == {"requestId": "req-123"}

        # Verify update
        update_doc = call_args[0][1]["$set"]
        assert update_doc["status"] == "approved"
        assert update_doc["approvalDetails"]["approvedBy"] == "supervisor-001"
        assert update_doc["approvalDetails"]["approvedByName"] == "Supervisor Name"
        assert update_doc["approvalDetails"]["comment"] == "Approved after review"
        assert "approvedAt" in update_doc["approvalDetails"]
        assert "updatedAt" in update_doc


class TestWriteoffRejectedHandler:
    """Tests for writeoff.rejected.v1 event handler."""

    @pytest.mark.asyncio
    async def test_handle_writeoff_rejected_updates_status(self, mock_db):
        """Should update status to rejected with rejection details."""
        event = {
            "conv": "req-456",
            "cause": "evt-reject-789",
            "typ": "writeoff.rejected.v1",
            "payload": {
                "requestId": "req-456",
                "requestNumber": "WO-20241211-EFGH",
                "reason": "Insufficient documentation provided",
                "rejectedBy": "supervisor-002",
                "rejectedByName": "Another Supervisor",
            },
        }

        await handle_writeoff_rejected(mock_db, event)

        mock_db["write-off-requests"].update_one.assert_called_once()
        call_args = mock_db["write-off-requests"].update_one.call_args

        # Verify query filter
        assert call_args[0][0] == {"requestId": "req-456"}

        # Verify update
        update_doc = call_args[0][1]["$set"]
        assert update_doc["status"] == "rejected"
        assert update_doc["approvalDetails"]["rejectedBy"] == "supervisor-002"
        assert update_doc["approvalDetails"]["rejectedByName"] == "Another Supervisor"
        assert update_doc["approvalDetails"]["reason"] == "Insufficient documentation provided"
        assert "rejectedAt" in update_doc["approvalDetails"]


class TestWriteoffCancelledHandler:
    """Tests for writeoff.cancelled.v1 event handler."""

    @pytest.mark.asyncio
    async def test_handle_writeoff_cancelled_updates_status(self, mock_db):
        """Should update status to cancelled with cancellation details."""
        event = {
            "conv": "req-789",
            "cause": "evt-cancel-123",
            "typ": "writeoff.cancelled.v1",
            "payload": {
                "requestId": "req-789",
                "requestNumber": "WO-20241211-IJKL",
                "cancelledBy": "user-001",
                "cancelledByName": "Original Requester",
            },
        }

        await handle_writeoff_cancelled(mock_db, event)

        mock_db["write-off-requests"].update_one.assert_called_once()
        call_args = mock_db["write-off-requests"].update_one.call_args

        # Verify query filter
        assert call_args[0][0] == {"requestId": "req-789"}

        # Verify update
        update_doc = call_args[0][1]["$set"]
        assert update_doc["status"] == "cancelled"
        assert update_doc["cancellationDetails"]["cancelledBy"] == "user-001"
        assert update_doc["cancellationDetails"]["cancelledByName"] == "Original Requester"
        assert "cancelledAt" in update_doc["cancellationDetails"]


class TestWriteoffEventLifecycle:
    """Integration tests for the complete write-off workflow."""

    @pytest.mark.asyncio
    async def test_writeoff_request_to_approval_lifecycle(self, mock_db):
        """Test complete lifecycle: request -> approval."""
        # 1. Create request
        request_event = {
            "conv": "req-lifecycle-001",
            "cause": "evt-create-001",
            "typ": "writeoff.requested.v1",
            "payload": {
                "loanAccountId": "acc-lifecycle",
                "customerId": "cust-lifecycle",
                "amount": 2000.0,
                "reason": "hardship",
                "requestedBy": "user-requester",
                "requestedByName": "Requester Name",
            },
        }

        await handle_writeoff_requested(mock_db, request_event)
        assert mock_db["write-off-requests"].insert_one.called

        # 2. Approve request
        approve_event = {
            "conv": "req-lifecycle-001",  # Same requestId
            "cause": "evt-approve-001",
            "typ": "writeoff.approved.v1",
            "payload": {
                "requestId": "req-lifecycle-001",
                "requestNumber": "WO-TEST-001",
                "comment": "Approved after verification",
                "approvedBy": "user-approver",
                "approvedByName": "Approver Name",
            },
        }

        await handle_writeoff_approved(mock_db, approve_event)
        assert mock_db["write-off-requests"].update_one.called

        # Verify the update used the correct requestId
        update_call = mock_db["write-off-requests"].update_one.call_args
        assert update_call[0][0] == {"requestId": "req-lifecycle-001"}

    @pytest.mark.asyncio
    async def test_writeoff_request_to_rejection_lifecycle(self, mock_db):
        """Test lifecycle: request -> rejection."""
        # 1. Create request
        request_event = {
            "conv": "req-reject-001",
            "cause": "evt-create-002",
            "payload": {
                "loanAccountId": "acc-reject",
                "customerId": "cust-reject",
                "amount": 3000.0,
                "reason": "aged_debt",
                "requestedBy": "user-001",
            },
        }

        await handle_writeoff_requested(mock_db, request_event)

        # 2. Reject request
        reject_event = {
            "conv": "req-reject-001",
            "cause": "evt-reject-002",
            "payload": {
                "requestId": "req-reject-001",
                "requestNumber": "WO-TEST-002",
                "reason": "Account still has payment history",
                "rejectedBy": "supervisor-001",
                "rejectedByName": "Supervisor",
            },
        }

        await handle_writeoff_rejected(mock_db, reject_event)

        update_call = mock_db["write-off-requests"].update_one.call_args
        update_doc = update_call[0][1]["$set"]
        assert update_doc["status"] == "rejected"

    @pytest.mark.asyncio
    async def test_writeoff_request_to_cancellation_lifecycle(self, mock_db):
        """Test lifecycle: request -> cancellation."""
        # 1. Create request
        request_event = {
            "conv": "req-cancel-001",
            "cause": "evt-create-003",
            "payload": {
                "loanAccountId": "acc-cancel",
                "customerId": "cust-cancel",
                "amount": 500.0,
                "reason": "other",
                "requestedBy": "user-001",
            },
        }

        await handle_writeoff_requested(mock_db, request_event)

        # 2. Cancel request (by original requester)
        cancel_event = {
            "conv": "req-cancel-001",
            "cause": "evt-cancel-003",
            "payload": {
                "requestId": "req-cancel-001",
                "requestNumber": "WO-TEST-003",
                "cancelledBy": "user-001",  # Same as requester
                "cancelledByName": "Original User",
            },
        }

        await handle_writeoff_cancelled(mock_db, cancel_event)

        update_call = mock_db["write-off-requests"].update_one.call_args
        update_doc = update_call[0][1]["$set"]
        assert update_doc["status"] == "cancelled"
