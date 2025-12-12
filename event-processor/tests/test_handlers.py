"""
Integration Tests for Event Processor Handlers

Tests cover event handling for:
- Customer events (customer.changed.v1, customer.verified.v1)
- Account events (account.created.v1, account.schedule.created.v1)
- Conversation events (conversation_started, user_input, assistant_response, final_decision)

Based on Requirements/v2-servicing-app specifications.
"""

import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from decimal import Decimal

# Import handlers
from billie_servicing.handlers.customer import handle_customer_changed, handle_customer_verified
from billie_servicing.handlers.account import (
    handle_account_created,
    handle_account_updated,
    handle_account_status_changed,
    handle_schedule_created,
)
from billie_servicing.handlers.conversation import (
    handle_conversation_started,
    handle_utterance,
    handle_final_decision,
    handle_conversation_summary,
    handle_assessment,
    handle_noticeboard_updated,
)


class TestCustomerHandlers:
    """Tests for customer event handlers (F5: View Customer Details)."""

    @pytest.mark.asyncio
    async def test_handle_customer_changed_creates_new_customer(self, mock_db):
        """F5.1: Should create a new customer from customer.changed.v1 event."""
        # Create mock parsed event
        mock_event = MagicMock()
        mock_event.payload = MagicMock()
        mock_event.payload.customer_id = "CUS-TEST-001"
        mock_event.payload.first_name = "John"
        mock_event.payload.last_name = "Smith"
        mock_event.payload.email_address = "john@test.com"
        mock_event.payload.mobile_phone_number = "0412345678"
        mock_event.payload.date_of_birth = "1985-06-15"
        mock_event.payload.ekyc_status = "successful"
        mock_event.payload.residential_address = None

        await handle_customer_changed(mock_db, mock_event)

        # Verify update was called
        mock_db.customers.update_one.assert_called_once()
        call_args = mock_db.customers.update_one.call_args
        
        # Verify query filter
        assert call_args[0][0] == {"customerId": "CUS-TEST-001"}
        
        # Verify document structure
        update_doc = call_args[0][1]["$set"]
        assert update_doc["customerId"] == "CUS-TEST-001"
        assert update_doc["firstName"] == "John"
        assert update_doc["lastName"] == "Smith"
        assert update_doc["fullName"] == "John Smith"
        assert update_doc["emailAddress"] == "john@test.com"

    @pytest.mark.asyncio
    async def test_handle_customer_changed_with_address(self, mock_db):
        """F5.1: Should store residential address with all fields."""
        mock_event = MagicMock()
        mock_event.payload = MagicMock()
        mock_event.payload.customer_id = "CUS-TEST-002"
        mock_event.payload.first_name = "Jane"
        mock_event.payload.last_name = "Doe"
        mock_event.payload.email_address = None
        mock_event.payload.mobile_phone_number = None
        mock_event.payload.date_of_birth = None
        mock_event.payload.ekyc_status = None
        
        # Mock address object
        mock_addr = MagicMock()
        mock_addr.street_number = "123"
        mock_addr.street_name = "Test"
        mock_addr.street_type = "St"
        mock_addr.unit_number = None
        mock_addr.suburb = "Sydney"
        mock_addr.state = "NSW"
        mock_addr.postcode = "2000"
        mock_addr.country = "Australia"
        mock_addr.full_address = "123 Test St, Sydney NSW 2000"
        mock_event.payload.residential_address = mock_addr

        await handle_customer_changed(mock_db, mock_event)

        call_args = mock_db.customers.update_one.call_args
        update_doc = call_args[0][1]["$set"]
        
        assert "residentialAddress" in update_doc
        addr = update_doc["residentialAddress"]
        assert addr["streetNumber"] == "123"
        assert addr["streetName"] == "Test"
        assert addr["suburb"] == "Sydney"
        assert addr["state"] == "NSW"
        assert addr["fullAddress"] == "123 Test St, Sydney NSW 2000"

    @pytest.mark.asyncio
    async def test_handle_customer_verified(self, mock_db):
        """F5.1: Should set identityVerified flag on customer.verified.v1."""
        mock_event = MagicMock()
        mock_event.payload = MagicMock()
        mock_event.payload.customer_id = "CUS-TEST-003"

        await handle_customer_verified(mock_db, mock_event)

        call_args = mock_db.customers.update_one.call_args
        update_doc = call_args[0][1]["$set"]
        
        assert update_doc["identityVerified"] is True
        assert update_doc["ekycStatus"] == "successful"


class TestAccountHandlers:
    """Tests for account event handlers (F1: View Loan Accounts)."""

    @pytest.mark.asyncio
    async def test_handle_account_created(self, mock_db):
        """F1.2: Should create loan account from account.created.v1."""
        mock_event = MagicMock()
        mock_event.payload = MagicMock()
        mock_event.payload.account_id = "ACC-TEST-001"
        mock_event.payload.account_number = "ACC-12345"
        mock_event.payload.customer_id = "CUS-TEST-001"
        mock_event.payload.status = "ACTIVE"
        mock_event.payload.loan_amount = Decimal("500.00")
        mock_event.payload.loan_fee = Decimal("80.00")
        mock_event.payload.loan_total_payable = Decimal("580.00")
        mock_event.payload.current_balance = Decimal("580.00")
        mock_event.payload.opened_date = "2024-01-15"

        await handle_account_created(mock_db, mock_event)

        mock_db["loan-accounts"].update_one.assert_called_once()
        call_args = mock_db["loan-accounts"].update_one.call_args
        
        # Verify query filter
        assert call_args[0][0] == {"loanAccountId": "ACC-TEST-001"}
        
        # Verify document structure
        update_doc = call_args[0][1]["$set"]
        assert update_doc["loanAccountId"] == "ACC-TEST-001"
        assert update_doc["accountNumber"] == "ACC-12345"
        assert update_doc["customerIdString"] == "CUS-TEST-001"
        assert update_doc["loanTerms"]["loanAmount"] == 500.00
        assert update_doc["loanTerms"]["loanFee"] == 80.00
        assert update_doc["loanTerms"]["totalPayable"] == 580.00
        assert update_doc["accountStatus"] == "active"

    @pytest.mark.asyncio
    async def test_handle_account_status_mapping(self, mock_db):
        """F1.3: Should correctly map SDK status to display status."""
        test_cases = [
            ("PENDING", "active"),
            ("ACTIVE", "active"),
            ("SUSPENDED", "in_arrears"),
            ("CLOSED", "paid_off"),
        ]

        for sdk_status, expected_status in test_cases:
            mock_db["loan-accounts"].update_one.reset_mock()
            
            mock_event = MagicMock()
            mock_event.payload = MagicMock()
            mock_event.payload.account_id = f"ACC-{sdk_status}"
            mock_event.payload.account_number = f"ACC-{sdk_status}"
            mock_event.payload.customer_id = "CUS-TEST"
            mock_event.payload.status = sdk_status
            mock_event.payload.loan_amount = Decimal("500.00")
            mock_event.payload.loan_fee = Decimal("80.00")
            mock_event.payload.loan_total_payable = Decimal("580.00")
            mock_event.payload.current_balance = Decimal("580.00")
            mock_event.payload.opened_date = "2024-01-15"

            await handle_account_created(mock_db, mock_event)

            call_args = mock_db["loan-accounts"].update_one.call_args
            update_doc = call_args[0][1]["$set"]
            
            assert update_doc["accountStatus"] == expected_status, \
                f"Expected {sdk_status} -> {expected_status}, got {update_doc['accountStatus']}"

    @pytest.mark.asyncio
    async def test_handle_schedule_created(self, mock_db):
        """F1.4: Should add repayment schedule from account.schedule.created.v1."""
        mock_event = MagicMock()
        mock_event.payload = MagicMock()
        mock_event.payload.account_id = "ACC-TEST-001"
        mock_event.payload.schedule_id = "SCHED-001"
        mock_event.payload.n_payments = 4
        mock_event.payload.payment_frequency = "fortnightly"
        mock_event.payload.created_date = "2024-01-15"
        
        # Mock payments
        mock_payment1 = MagicMock()
        mock_payment1.payment_number = 1
        mock_payment1.due_date = "2024-01-22"
        mock_payment1.amount = Decimal("145.00")
        
        mock_payment2 = MagicMock()
        mock_payment2.payment_number = 2
        mock_payment2.due_date = "2024-02-05"
        mock_payment2.amount = Decimal("145.00")
        
        mock_event.payload.payments = [mock_payment1, mock_payment2]

        await handle_schedule_created(mock_db, mock_event)

        mock_db["loan-accounts"].update_one.assert_called_once()
        call_args = mock_db["loan-accounts"].update_one.call_args
        update_doc = call_args[0][1]["$set"]
        
        schedule = update_doc["repaymentSchedule"]
        assert schedule["scheduleId"] == "SCHED-001"
        assert schedule["numberOfPayments"] == 4
        assert schedule["paymentFrequency"] == "fortnightly"
        assert len(schedule["payments"]) == 2
        assert schedule["payments"][0]["paymentNumber"] == 1
        assert schedule["payments"][0]["amount"] == 145.00
        assert schedule["payments"][0]["status"] == "scheduled"


class TestConversationHandlers:
    """Tests for conversation event handlers (F4: View Conversations)."""

    @pytest.mark.asyncio
    async def test_handle_conversation_started(self, mock_db):
        """F4.1: Should create conversation from conversation_started event."""
        event = {
            "cid": "CONV-TEST-001",
            "usr": "CUS-TEST-001",
            "app_number": "APP-12345",
            "timestamp": datetime.utcnow().isoformat(),
        }

        await handle_conversation_started(mock_db, event)

        mock_db.conversations.update_one.assert_called_once()
        call_args = mock_db.conversations.update_one.call_args
        
        # Verify query filter
        assert call_args[0][0] == {"conversationId": "CONV-TEST-001"}
        
        # Verify document structure
        update_doc = call_args[0][1]["$set"]
        assert update_doc["conversationId"] == "CONV-TEST-001"
        assert update_doc["customerIdString"] == "CUS-TEST-001"
        assert update_doc["applicationNumber"] == "APP-12345"
        assert update_doc["status"] == "active"
        assert update_doc["utterances"] == []

    @pytest.mark.asyncio
    async def test_handle_user_input(self, mock_db):
        """F4.2: Should add customer utterance to conversation."""
        # Mock existing conversation
        mock_db.conversations.find_one = AsyncMock(
            return_value={"conversationId": "CONV-TEST-001"}
        )
        
        event = {
            "typ": "user_input",
            "cid": "CONV-TEST-001",
            "usr": "CUS-TEST-001",
            "payload": {
                "utterance": "I need a loan of $500",
                "created_at": datetime.utcnow().isoformat(),
            },
        }

        await handle_utterance(mock_db, event)

        mock_db.conversations.update_one.assert_called()
        call_args = mock_db.conversations.update_one.call_args
        
        # Verify $push operation for utterances
        push_doc = call_args[0][1]["$push"]["utterances"]
        assert push_doc["username"] == "customer"
        assert push_doc["utterance"] == "I need a loan of $500"

    @pytest.mark.asyncio
    async def test_handle_assistant_response(self, mock_db):
        """F4.2: Should add assistant utterance with rationale."""
        mock_db.conversations.find_one = AsyncMock(
            return_value={"conversationId": "CONV-TEST-001"}
        )
        
        event = {
            "typ": "assistant_response",
            "cid": "CONV-TEST-001",
            "usr": "CUS-TEST-001",
            "payload": {
                "utterance": "I can help you with that.",
                "rationale": "Customer requested loan",
                "created_at": datetime.utcnow().isoformat(),
            },
        }

        await handle_utterance(mock_db, event)

        call_args = mock_db.conversations.update_one.call_args
        push_doc = call_args[0][1]["$push"]["utterances"]
        
        assert push_doc["username"] == "assistant"
        assert push_doc["utterance"] == "I can help you with that."
        assert push_doc["rationale"] == "Customer requested loan"

    @pytest.mark.asyncio
    async def test_handle_final_decision_approved(self, mock_db):
        """F4.3: Should update status to approved on APPROVED decision."""
        event = {
            "cid": "CONV-TEST-001",
            "decision": "APPROVED",
        }

        await handle_final_decision(mock_db, event)

        call_args = mock_db.conversations.update_one.call_args
        update_doc = call_args[0][1]["$set"]
        
        assert update_doc["status"] == "approved"
        assert update_doc["finalDecision"] == "APPROVED"

    @pytest.mark.asyncio
    async def test_handle_final_decision_declined(self, mock_db):
        """F4.3: Should update status to declined on DECLINED decision."""
        event = {
            "cid": "CONV-TEST-001",
            "decision": "DECLINED",
        }

        await handle_final_decision(mock_db, event)

        call_args = mock_db.conversations.update_one.call_args
        update_doc = call_args[0][1]["$set"]
        
        assert update_doc["status"] == "declined"
        assert update_doc["finalDecision"] == "DECLINED"

    @pytest.mark.asyncio
    async def test_handle_assessment_identity_risk(self, mock_db):
        """F4.3: Should store identity risk assessment."""
        event = {
            "typ": "identityRisk_assessment",
            "cid": "CONV-TEST-001",
            "payload": {
                "score": 85,
                "status": "low_risk",
            },
        }

        await handle_assessment(mock_db, event)

        call_args = mock_db.conversations.update_one.call_args
        update_doc = call_args[0][1]["$set"]
        
        assert "assessments.identityRisk" in update_doc

    @pytest.mark.asyncio
    async def test_handle_assessment_serviceability(self, mock_db):
        """F4.3: Should store serviceability assessment."""
        event = {
            "typ": "serviceability_assessment_results",
            "cid": "CONV-TEST-001",
            "payload": {
                "result": "pass",
                "affordability": True,
            },
        }

        await handle_assessment(mock_db, event)

        call_args = mock_db.conversations.update_one.call_args
        update_doc = call_args[0][1]["$set"]
        
        assert "assessments.serviceability" in update_doc

    @pytest.mark.asyncio
    async def test_handle_conversation_summary(self, mock_db):
        """F4.2: Should store conversation summary and facts."""
        event = {
            "cid": "CONV-TEST-001",
            "payload": {
                "purpose": "Loan application",
                "facts": ["Customer requested $500", "Income verified"],
            },
        }

        await handle_conversation_summary(mock_db, event)

        call_args = mock_db.conversations.update_one.call_args
        update_doc = call_args[0][1]["$set"]
        
        assert update_doc["purpose"] == "Loan application"
        assert len(update_doc["facts"]) == 2

    @pytest.mark.asyncio
    async def test_handle_noticeboard_updated(self, mock_db):
        """F4.3: Should add noticeboard entry."""
        event = {
            "cid": "CONV-TEST-001",
            "agentName": "serviceability_agent::Serviceability Assessment",
            "content": "Customer income verified at $50,000 p.a.",
            "timestamp": datetime.utcnow().isoformat(),
        }

        await handle_noticeboard_updated(mock_db, event)

        call_args = mock_db.conversations.update_one.call_args
        push_doc = call_args[0][1]["$push"]["noticeboard"]
        
        assert push_doc["agentName"] == "serviceability_agent::Serviceability Assessment"
        assert push_doc["topic"] == "Serviceability Assessment"
        assert "income verified" in push_doc["content"]


class TestEventProcessorIntegration:
    """Integration tests for the full event processing flow."""

    @pytest.mark.asyncio
    async def test_customer_loan_lifecycle(self, mock_db):
        """Test complete customer -> account -> schedule flow."""
        # 1. Create customer
        customer_event = MagicMock()
        customer_event.payload = MagicMock()
        customer_event.payload.customer_id = "CUS-LIFECYCLE-001"
        customer_event.payload.first_name = "Test"
        customer_event.payload.last_name = "User"
        customer_event.payload.email_address = "test@test.com"
        customer_event.payload.mobile_phone_number = None
        customer_event.payload.date_of_birth = None
        customer_event.payload.ekyc_status = None
        customer_event.payload.residential_address = None

        await handle_customer_changed(mock_db, customer_event)
        assert mock_db.customers.update_one.called

        # 2. Create account
        mock_db.customers.find_one = AsyncMock(
            return_value={"_id": "mongo-id", "fullName": "Test User"}
        )
        
        account_event = MagicMock()
        account_event.payload = MagicMock()
        account_event.payload.account_id = "ACC-LIFECYCLE-001"
        account_event.payload.account_number = "ACC-99999"
        account_event.payload.customer_id = "CUS-LIFECYCLE-001"
        account_event.payload.status = "ACTIVE"
        account_event.payload.loan_amount = Decimal("500.00")
        account_event.payload.loan_fee = Decimal("80.00")
        account_event.payload.loan_total_payable = Decimal("580.00")
        account_event.payload.current_balance = Decimal("580.00")
        account_event.payload.opened_date = "2024-01-15"

        await handle_account_created(mock_db, account_event)
        assert mock_db["loan-accounts"].update_one.called

        # 3. Add schedule
        schedule_event = MagicMock()
        schedule_event.payload = MagicMock()
        schedule_event.payload.account_id = "ACC-LIFECYCLE-001"
        schedule_event.payload.schedule_id = "SCHED-LIFECYCLE-001"
        schedule_event.payload.n_payments = 4
        schedule_event.payload.payment_frequency = "fortnightly"
        schedule_event.payload.created_date = "2024-01-15"
        schedule_event.payload.payments = []

        await handle_schedule_created(mock_db, schedule_event)
        
        # Verify all three handlers were called
        assert mock_db.customers.update_one.call_count >= 1
        assert mock_db["loan-accounts"].update_one.call_count >= 2

    @pytest.mark.asyncio
    async def test_conversation_lifecycle(self, mock_db):
        """Test complete conversation flow from start to decision."""
        # 1. Start conversation
        start_event = {
            "cid": "CONV-LIFECYCLE-001",
            "usr": "CUS-TEST-001",
            "app_number": "APP-99999",
        }
        await handle_conversation_started(mock_db, start_event)
        
        # 2. User input
        mock_db.conversations.find_one = AsyncMock(
            return_value={"conversationId": "CONV-LIFECYCLE-001"}
        )
        
        input_event = {
            "typ": "user_input",
            "cid": "CONV-LIFECYCLE-001",
            "payload": {"utterance": "I need help"},
        }
        await handle_utterance(mock_db, input_event)
        
        # 3. Assistant response
        response_event = {
            "typ": "assistant_response",
            "cid": "CONV-LIFECYCLE-001",
            "payload": {"utterance": "I can help"},
        }
        await handle_utterance(mock_db, response_event)
        
        # 4. Final decision
        decision_event = {
            "cid": "CONV-LIFECYCLE-001",
            "decision": "APPROVED",
        }
        await handle_final_decision(mock_db, decision_event)
        
        # Verify conversation updates
        assert mock_db.conversations.update_one.call_count >= 4

