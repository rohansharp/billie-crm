from enum import Enum
from pydantic import BaseModel, Field, EmailStr


class AddressType(Enum):
    MAILING = "MAILING"
    RESIDENTIAL = "RESIDENTIAL"


class Address(BaseModel):
    address_type: AddressType = Field(
        ..., description="The type of the address - mailing or residential"
    )
    unit_number: str | None = Field(
        None,
        description="The unit/apartment/flat number for a multiple dwelling address",
    )
    building_name: str | None = Field(
        None, description="The name of a building if available"
    )
    floor_number: str | None = Field(
        None, description="The floor number in a multi-story building"
    )
    street_number: str = Field(
        ..., description="The street number excluding unit number"
    )
    street_name: str = Field(
        ...,
        description="The street name without the type (e.g. 'Smith' not 'Smith St')",
    )
    street_type: str = Field(..., description="The type of street e.g. St, Rd, Blvd")
    suburb: str = Field(..., description="The city or suburb of the address")
    state: str = Field(..., description="The state")
    postcode: str = Field(..., description="The postcode")
    country: str = Field(..., description="The country")
    dp_identifier: str | None = Field(
        None,
        description="Australia Post assigned Delivery Point Identifier. Unique identifier for each address",
    )
    full_address: str | None = Field(
        None, description="The full address as a single string"
    )


EmailAddress = EmailStr
