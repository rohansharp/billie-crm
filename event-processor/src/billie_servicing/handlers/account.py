"""Account event handlers using Billie Accounts SDK.

Handles events:
- account.created.v1
- account.updated.v1
- account.status_changed.v1
- account.schedule.created.v1
"""

from datetime import datetime
from typing import Any

import structlog
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = structlog.get_logger()

# SDK AccountStatus to Payload accountStatus mapping
SDK_STATUS_MAP = {
    "PENDING": "active",
    "ACTIVE": "active",
    "SUSPENDED": "in_arrears",
    "CLOSED": "paid_off",
}


async def handle_account_created(db: AsyncIOMotorDatabase, parsed_event: Any) -> None:
    """
    Handle account.created.v1 event.

    SDK Model: AccountCreatedV1
    Fields: account_id, account_number, customer_id, status, loan_amount,
            current_balance, loan_fee, loan_total_payable, opened_date
    """
    payload = parsed_event.payload
    account_id = payload.account_id
    customer_id = payload.customer_id

    log = logger.bind(account_id=account_id, customer_id=customer_id)
    log.info("Processing account.created.v1")

    # Get customer for relationship and denormalization
    customer = await db.customers.find_one({"customerId": customer_id})
    customer_mongo_id = customer.get("_id") if customer else None
    customer_name = customer.get("fullName", "") if customer else ""

    # Map SDK status to Payload status
    sdk_status = str(payload.status) if payload.status else "PENDING"
    # Remove enum prefix if present (e.g., "AccountStatus.ACTIVE" -> "ACTIVE")
    if "." in sdk_status:
        sdk_status = sdk_status.split(".")[-1]
    account_status = SDK_STATUS_MAP.get(sdk_status, "active")

    document = {
        "loanAccountId": account_id,
        "accountNumber": payload.account_number,
        "customerId": customer_mongo_id,
        "customerIdString": customer_id,  # Keep string version for queries
        "customerName": customer_name,
        "loanTerms": {
            "loanAmount": float(payload.loan_amount) if payload.loan_amount else None,
            "loanFee": float(payload.loan_fee) if payload.loan_fee else None,
            "totalPayable": (
                float(payload.loan_total_payable) if payload.loan_total_payable else None
            ),
            "openedDate": payload.opened_date,
        },
        "balances": {
            "currentBalance": float(payload.current_balance) if payload.current_balance else 0.0,
            "totalOutstanding": float(payload.current_balance) if payload.current_balance else 0.0,
            "totalPaid": 0.0,
        },
        "accountStatus": account_status,
        "sdkStatus": sdk_status,
        "updatedAt": datetime.utcnow(),
    }

    result = await db["loan-accounts"].update_one(
        {"loanAccountId": account_id},
        {
            "$set": document,
            "$setOnInsert": {"createdAt": datetime.utcnow()},
        },
        upsert=True,
    )

    log.info(
        "Loan account upserted",
        matched=result.matched_count,
        modified=result.modified_count,
        upserted_id=str(result.upserted_id) if result.upserted_id else None,
    )


async def handle_account_updated(db: AsyncIOMotorDatabase, parsed_event: Any) -> None:
    """
    Handle account.updated.v1 event.

    Fields: account_id, current_balance, status, last_payment_date, last_payment_amount
    """
    payload = parsed_event.payload
    account_id = payload.account_id

    log = logger.bind(account_id=account_id)
    log.info("Processing account.updated.v1")

    update_doc: dict[str, Any] = {"updatedAt": datetime.utcnow()}

    if payload.current_balance is not None:
        update_doc["balances.currentBalance"] = float(payload.current_balance)
        update_doc["balances.totalOutstanding"] = float(payload.current_balance)

    if payload.status:
        sdk_status = str(payload.status)
        if "." in sdk_status:
            sdk_status = sdk_status.split(".")[-1]
        update_doc["sdkStatus"] = sdk_status
        update_doc["accountStatus"] = SDK_STATUS_MAP.get(sdk_status, "active")

    if hasattr(payload, "last_payment_date") and payload.last_payment_date:
        update_doc["lastPayment.date"] = payload.last_payment_date

    if hasattr(payload, "last_payment_amount") and payload.last_payment_amount is not None:
        update_doc["lastPayment.amount"] = float(payload.last_payment_amount)

    result = await db["loan-accounts"].update_one(
        {"loanAccountId": account_id}, {"$set": update_doc}
    )

    log.info("Loan account updated", matched=result.matched_count, modified=result.modified_count)


async def handle_account_status_changed(db: AsyncIOMotorDatabase, parsed_event: Any) -> None:
    """
    Handle account.status_changed.v1 event.

    Fields: account_id, new_status, changed_at
    """
    payload = parsed_event.payload
    account_id = payload.account_id

    log = logger.bind(account_id=account_id)
    log.info("Processing account.status_changed.v1")

    sdk_status = str(payload.new_status)
    if "." in sdk_status:
        sdk_status = sdk_status.split(".")[-1]
    account_status = SDK_STATUS_MAP.get(sdk_status, "active")

    result = await db["loan-accounts"].update_one(
        {"loanAccountId": account_id},
        {
            "$set": {
                "sdkStatus": sdk_status,
                "accountStatus": account_status,
                "updatedAt": datetime.utcnow(),
            }
        },
    )

    log.info(
        "Account status changed",
        new_status=account_status,
        matched=result.matched_count,
        modified=result.modified_count,
    )


async def handle_schedule_created(db: AsyncIOMotorDatabase, parsed_event: Any) -> None:
    """
    Handle account.schedule.created.v1 event.

    Adds repayment schedule to loan account.

    Fields: account_id, schedule_id, loan_amount, total_amount, fee,
            n_payments, payment_frequency, payments[], created_date

    Payments[]: payment_number, due_date, amount
    """
    payload = parsed_event.payload
    account_id = payload.account_id

    log = logger.bind(account_id=account_id, schedule_id=payload.schedule_id)
    log.info("Processing account.schedule.created.v1")

    # Build payments array
    payments = []
    for payment in payload.payments or []:
        payments.append(
            {
                "paymentNumber": payment.payment_number,
                "dueDate": payment.due_date,
                "amount": float(payment.amount) if payment.amount else 0.0,
                "status": "scheduled",
            }
        )

    schedule_doc = {
        "repaymentSchedule": {
            "scheduleId": payload.schedule_id,
            "numberOfPayments": payload.n_payments,
            "paymentFrequency": payload.payment_frequency,
            "payments": payments,
            "createdDate": payload.created_date,
        },
        "updatedAt": datetime.utcnow(),
    }

    result = await db["loan-accounts"].update_one(
        {"loanAccountId": account_id}, {"$set": schedule_doc}
    )

    log.info(
        "Repayment schedule added",
        num_payments=len(payments),
        frequency=payload.payment_frequency,
        matched=result.matched_count,
        modified=result.modified_count,
    )

