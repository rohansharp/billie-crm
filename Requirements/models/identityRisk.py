from pydantic import BaseModel, Field
from typing import Optional, List
from backend.src.models.customer import Customer


class IdentityRiskAssessment(BaseModel):
    application_number: str
    customer_id: str
    decision: Optional[str] = None
    ekyc_entity_id: Optional[str] = None
    checkedCustomer: Optional[Customer] = Field(
        default=None, description="Customer details with eKYC information"
    )
    # verifiedCustomer: Optional[Dict[str, Any]] = Field(default=None, description="Verified customer details returned from the eKYC process")
    created_at: Optional[str] = None
    sanctionsResult: Optional[str] = Field(
        default=None, description="Sanctions check result from identity verification"
    )
    pepResult: Optional[str] = Field(
        default=None,
        description="PEP (Politically Exposed Person) check result from identity verification",
    )


class IDRiskOutstandingInfoResponse(BaseModel):
    i: str  # information that is outstanding
    id: Optional[List[str]] = Field(
        default=None,
        description="List of ID types. Valid values: 'P' (Passport), 'DL' (Driver's License), 'M' (Medicare)",
    )
    wc: bool = Field(description="Agent work completion status")
