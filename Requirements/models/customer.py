from enum import Enum
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from backend.src.models.BillieDataTypes import Address, EmailAddress


class IndividualStatus(Enum):
    LIVING = "LIVING"
    DECEASED = "DECEASED"
    MISSING = "MISSING"


class Customer(BaseModel):
    customer_id: Optional[str] = Field(
        default=None, description="The unique customer identifier."
    )
    title: Optional[str] = Field(
        default=None,
        description="The title of the customer, e.g., Mr, Mrs, Ms, Dr, etc.",
    )
    preferred_name: Optional[str] = Field(
        default=None,
        description="Name by which a customer prefers to be called. Maybe different from their formal first, middle and last names.",
    )
    first_name: Optional[str] = Field(
        default=None, description="Customer's formal first name."
    )
    middle_name: Optional[str] = Field(
        default=None, description="Customer's formal middle name."
    )
    last_name: Optional[str] = Field(
        default=None, description="Customer's formal last name."
    )
    email_address: Optional[EmailAddress] = Field(
        default=None,
        description="Email address that the customer wishes to be contacted on. Is validated on creation and update.",
    )
    mobile_phone_number: Optional[str] = Field(
        default=None,
        description="The mobile phone number that the customer wishes to be contacted on. Is validated on creation and update.",
    )
    date_of_birth: Optional[str] = Field(
        default=None, description="The date that the customer was born (YYYY-MM-DD)"
    )
    residential_address: Optional[Address] = Field(
        default=None, description="The address where the customer resides."
    )
    mailing_address: Optional[Address] = Field(
        default=None,
        description="The address where the customer wishes to receive mail. Primarily used as the location where cards are sent on manufacture.",
    )
    australian_tax_residency_flag: Optional[bool] = Field(
        default=None,
        exclude=True,
        description="Flag to indicate that the customer is an Australian resident for taxation purposes.",
    )
    tax_file_number: Optional[str] = Field(
        default=None,
        exclude=True,
        description="Customer's tax file number for reporting to the ATO",
    )
    tax_exemption_code: Optional[str] = Field(
        default=None,
        exclude=True,
        description="The code that indicates why a customer has not quoted their tax file number and should not be charged withholding tax",
    )
    foreign_tax_identifier: Optional[str] = Field(
        default=None,
        exclude=True,
        description="The taxation identifier for customers who must pay tax overseas.",
    )
    tax_country: Optional[str] = Field(
        default=None,
        exclude=True,
        description="The country to which the foreign tax identifier belongs",
    )
    staff_flag: Optional[bool] = Field(
        default=None, description="Indicates the customer is a Xinja staff member"
    )
    investor_flag: Optional[bool] = Field(
        default=None, description="Indicates the customer is a Xinja investor"
    )
    founder_flag: Optional[str] = Field(
        default=None, description="Indicates the customer is a founder of Xinja"
    )
    ekyc_entity_id: Optional[str] = Field(
        default=None,
        description="The identifier provided as part of the eKYC process. Provided by Frankie. If there are multiple eKYC attempts this ID correlates to the first of these events in Frankie.",
    )
    ekyc_status: Optional[str] = Field(
        default=None,
        description="Indicates whether the eKYC attempt was successful or not.",
    )
    individual_status: Optional[IndividualStatus] = Field(
        default=None,
        description="Represents the lifecycle of an individual that may be a customer. The lifecycle of this status can change independently of the Status.",
    )


class IdentityDocumentType(Enum):
    DRIVERS_LICENCE = "DRIVERS_LICENCE"
    PASSPORT = "PASSPORT"
    MEDICARE = "MEDICARE"


class CustomerIdentityDocument(BaseModel):
    customer_id: Optional[str] = Field(
        default=None, description="The unique customer identifier."
    )
    document_type: Optional[IdentityDocumentType] = Field(
        default=None,
        description="Type of the identity document, e.g., Driver's License or Passport.",
    )
    document_subtype: Optional[str] = Field(
        default=None,
        description="The subtype of the identity document if required, e.g., Medicare Card Colour.",
    )
    document_number: Optional[str] = Field(
        default=None, description="The unique number of the identity document."
    )
    expiry_date: Optional[str] = Field(
        default=None,
        description="The expiry date of the identity document (YYYY-MM-DD)",
    )
    state_of_issue: Optional[str] = Field(
        default=None, description="The state of issue for the identity document."
    )
    country_of_issue: Optional[str] = Field(
        default=None, description="The country of issue for the identity document."
    )
    additional_info: Optional[dict[str, str]] = Field(
        default=None,
        description="Additional information about the identity document as key-value pairs",
    )

    @field_validator("additional_info", mode="before")
    @classmethod
    def clean_additional_info(cls, v):
        if v is None:
            return v
        if isinstance(v, dict):
            # Ensure that all values in the additional_info dictionary are non-null strings.
            return {k: ("" if val is None else val) for k, val in v.items()}
        return v
