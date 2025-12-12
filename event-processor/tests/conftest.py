"""Pytest configuration and fixtures for event processor tests."""

import pytest
import asyncio
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


class MockCollection:
    """Mock MongoDB collection."""
    def __init__(self):
        self.find_one = AsyncMock(return_value=None)
        self.update_one = AsyncMock(
            return_value=MagicMock(matched_count=0, modified_count=0, upserted_id="test-id")
        )
        self.insert_one = AsyncMock(return_value=MagicMock(inserted_id="test-id"))


class MockDatabase:
    """Mock MongoDB database that supports both attribute and dict access."""
    def __init__(self):
        self._collections = {}
        self.customers = MockCollection()
        self.conversations = MockCollection()
        self._collections["customers"] = self.customers
        self._collections["conversations"] = self.conversations
        self._collections["loan-accounts"] = MockCollection()
    
    def __getitem__(self, name):
        if name not in self._collections:
            self._collections[name] = MockCollection()
        return self._collections[name]
    
    def __setitem__(self, name, value):
        self._collections[name] = value


@pytest.fixture
def mock_db():
    """Create a mock MongoDB database."""
    return MockDatabase()


@pytest.fixture
def sample_customer_changed_event():
    """Sample customer.changed.v1 event from SDK."""
    return {
        "typ": "customer.changed.v1",
        "cid": "conv-123",
        "usr": "CUS-TEST-001",
        "seq": 1,
        "dat": {
            "customer_id": "CUS-TEST-001",
            "first_name": "John",
            "last_name": "Smith",
            "email_address": "john.smith@test.com",
            "mobile_phone_number": "0412345678",
            "date_of_birth": "1985-06-15",
            "residential_address": {
                "address_type": "RESIDENTIAL",
                "street_number": "123",
                "street_name": "Test",
                "street_type": "St",
                "suburb": "Sydney",
                "state": "NSW",
                "postcode": "2000",
                "country": "Australia",
                "full_address": "123 Test St, Sydney NSW 2000, Australia",
            },
            "changed_at": datetime.utcnow().isoformat(),
        },
    }


@pytest.fixture
def sample_account_created_event():
    """Sample account.created.v1 event from SDK."""
    return {
        "typ": "account.created.v1",
        "cid": "conv-123",
        "usr": "CUS-TEST-001",
        "seq": 1,
        "dat": {
            "account_id": "ACC-TEST-001",
            "account_number": "ACC-12345",
            "customer_id": "CUS-TEST-001",
            "status": "ACTIVE",
            "loan_amount": "500.00",
            "current_balance": "500.00",
            "loan_fee": "80.00",
            "loan_total_payable": "580.00",
            "opened_date": "2024-01-15",
        },
    }


@pytest.fixture
def sample_schedule_created_event():
    """Sample account.schedule.created.v1 event from SDK."""
    return {
        "typ": "account.schedule.created.v1",
        "cid": "conv-123",
        "usr": "CUS-TEST-001",
        "seq": 1,
        "dat": {
            "account_id": "ACC-TEST-001",
            "schedule_id": "SCHED-001",
            "loan_amount": "500.00",
            "total_amount": "580.00",
            "fee": "80.00",
            "n_payments": 4,
            "payment_frequency": "fortnightly",
            "payments": [
                {"payment_number": 1, "due_date": "2024-01-22", "amount": "145.00"},
                {"payment_number": 2, "due_date": "2024-02-05", "amount": "145.00"},
                {"payment_number": 3, "due_date": "2024-02-19", "amount": "145.00"},
                {"payment_number": 4, "due_date": "2024-03-04", "amount": "145.00"},
            ],
            "created_date": "2024-01-15",
        },
    }


@pytest.fixture
def sample_conversation_started_event():
    """Sample conversation_started chat event."""
    return {
        "typ": "conversation_started",
        "cid": "CONV-TEST-001",
        "usr": "CUS-TEST-001",
        "app_number": "APP-12345",
        "timestamp": datetime.utcnow().isoformat(),
    }


@pytest.fixture
def sample_user_input_event():
    """Sample user_input chat event."""
    return {
        "typ": "user_input",
        "cid": "CONV-TEST-001",
        "usr": "CUS-TEST-001",
        "payload": {
            "utterance": "I need a loan of $500",
            "created_at": datetime.utcnow().isoformat(),
        },
    }


@pytest.fixture
def sample_assistant_response_event():
    """Sample assistant_response chat event."""
    return {
        "typ": "assistant_response",
        "cid": "CONV-TEST-001",
        "usr": "CUS-TEST-001",
        "payload": {
            "utterance": "I can help you with that. Let me get some details.",
            "rationale": "Customer requested loan amount",
            "created_at": datetime.utcnow().isoformat(),
        },
    }


@pytest.fixture
def sample_final_decision_event():
    """Sample final_decision chat event."""
    return {
        "typ": "final_decision",
        "cid": "CONV-TEST-001",
        "usr": "CUS-TEST-001",
        "decision": "APPROVED",
        "outcome": "APPROVED",
    }

