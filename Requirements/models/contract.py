from pydantic import BaseModel, Field
from typing import Optional, List


class ContractOutstandingInfoResponse(BaseModel):
    i: str = Field(description="Outstanding information")
    wc: bool = Field(description="Agent work completion status")


class SalaryAccount(BaseModel):
    """Account details for salary disbursement"""

    holder: str = Field(description="Account holder name")
    number: str = Field(description="Account number")
    bsb: str = Field(description="BSB code")


class SalarySource(BaseModel):
    """Individual salary source information"""

    source_id: str = Field(description="Unique identifier for the salary source")
    source_description: str = Field(description="Description of the salary source")
    frequency: Optional[str] = Field(description="Payment frequency", default=None)
    account: SalaryAccount = Field(description="Account details for this salary source")


class RepaymentPayment(BaseModel):
    """Individual repayment payment details"""

    instalment_number: int = Field(description="Instalment number")
    date: str = Field(description="Payment due date in DD-MM-YY format")
    amount: float = Field(description="Payment amount")
    days_from_start: int = Field(description="Days from loan start date")
    days_from_previous: int = Field(description="Days from previous payment")


class RepaymentSchedule(BaseModel):
    """Complete repayment schedule for a loan"""

    loan_amount: float = Field(description="Original loan amount")
    fee: float = Field(description="Establishment fee")
    total_amount: float = Field(description="Total amount to be repaid")
    requested_term: int = Field(description="Requested loan term in days")
    actual_term: int = Field(description="Actual loan term in days")
    n_payments: int = Field(description="Number of payments")
    payments: List[RepaymentPayment] = Field(description="List of payment details")


class LoanExecutionPlan(BaseModel):
    """Complete loan execution plan containing repayment schedule and disbursement account details"""

    application_number: str = Field(description="Application number")
    number_of_salary_sources: int = Field(
        description="Number of unique salary sources/accounts"
    )
    salary_sources: List[SalarySource] = Field(
        description="List of salary sources and account details"
    )
    repayment_schedule: RepaymentSchedule = Field(
        description="Complete repayment schedule"
    )
    created_at: str = Field(description="ISO timestamp when the plan was created")
