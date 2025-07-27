from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict
from datetime import datetime
from backend.src.models.customer import Customer, CustomerIdentityDocument
from enum import Enum


class DocumentType(str, Enum):
    DRIVERS_LICENCE = "DRIVERS_LICENCE"
    MEDICARE = "MEDICARE"
    PASSPORT = "PASSPORT"


class Prompts(BaseModel):
    main: str = Field(default="")
    completeness_check: str = Field(default="")
    confirmation: Optional[str] = Field(default=None)
    output_json: Optional[str] = Field(default=None)
    mapping_out: Optional[Dict[str, str]] = Field(default=None)


class BusinessLogic(BaseModel):
    module_name: str
    method_name: str
    mapping_in: Dict[str, str]
    mapping_out: Dict[str, str]


class ProcessStep(BaseModel):
    stepName: str
    description: Optional[str] = Field(default="")
    complete: bool = False
    type: str = Field(default="llm")
    prompts: Optional[Prompts] = None
    business_logic: Optional[BusinessLogic] = None
    completion_event_name: Optional[str] = None
    answer_input_type: Optional[str] = None


class ProcessStage(BaseModel):
    stageName: str
    complete: bool = False
    steps: List[ProcessStep] = Field(default_factory=list)
    prompt: str = Field(default="")


class ApplicationProcess(BaseModel):
    applicationProcessState: List[ProcessStage] = Field(default_factory=list)
    currentProcessStage: Optional[str] = Field(default=None)
    currentProcessStep: Optional[str] = Field(default=None)
    conversation: List[Dict[str, str]] = Field(default_factory=list)
    started_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class ApplicationDetail(BaseModel):
    applicationNumber: Optional[str] = None
    loanPurpose: Optional[str] = None
    loanAmount: Optional[float] = None
    loanFee: Optional[float] = None
    loanTotalPayable: Optional[float] = None
    loanTerm: Optional[int] = None
    customerAttestationAcceptance: Optional[bool] = None
    statementCaptureConsentProvided: Optional[bool] = None
    statementCaptureCompleted: Optional[bool] = None
    productOfferAcceptance: Optional[bool] = None
    customerId: Optional[str] = None
    applicationOutcome: Optional[str] = None
    customer: Optional[Customer] = None
    customerIdentityDocuments: Optional[List[CustomerIdentityDocument]] = None

    @field_validator("loanAmount")
    @classmethod
    def calculate_loan_fee_and_total(cls, v):
        """Calculates loan fee and total payable amount when loanAmount is set."""
        try:
            if v is None:
                return 0

            loan_amount = float(v)
            # Return the original value - we'll calculate the fee and total
            # in a separate validator that runs after all fields are set
            return loan_amount
        except (ValueError, TypeError):
            return 0

    @field_validator("loanFee", "loanTotalPayable", mode="before")
    @classmethod
    def calculate_derived_values(cls, v, info):
        """Calculate fee and total based on loan amount."""
        loan_amount = info.data.get("loanAmount", 0) or 0

        if info.field_name == "loanFee":
            return round(float(loan_amount) * 0.05, 2)
        elif info.field_name == "loanTotalPayable":
            fee = round(float(loan_amount) * 0.05, 2)
            return round(float(loan_amount) + fee, 2)
        return v


# TODO Date conversion logic here to get around the date format
# TODO loan fee and total payable logic here
