__all__ = [
    "Address",
    "Profile",
    "Institution",
    "AccountClass",
    "Account",
    "Accounts",
    "Links",
    "Connection",
]

from dataclasses import dataclass
from typing import List, Optional


@dataclass
class Address:
    addressLine1: str
    addressLine2: Optional[str]
    addressLine3: Optional[str]
    postcode: str
    city: str
    state: str
    country: str
    countryCode: str
    formattedAddress: str


@dataclass
class Profile:
    fullName: str
    firstName: str
    lastName: str
    middleName: Optional[str]
    phoneNumbers: List[str]
    emailAddresses: List[str]
    physicalAddresses: List[Address]


@dataclass
class Institution:
    type: str
    id: str
    links: dict


@dataclass
class AccountClass:
    type: str
    product: str


@dataclass
class Account:
    type: str
    id: str
    accountNo: str
    name: str
    currency: str
    class_: AccountClass
    balance: str
    availableFunds: str
    lastUpdated: str
    status: str
    links: dict


@dataclass
class Accounts:
    type: str
    data: List[Account]


@dataclass
class Links:
    self: str
    accounts: str
    transactions: str
    user: str


@dataclass
class Connection:
    type: str
    id: str
    status: str
    createdDate: str
    lastUsed: str
    mfaEnabled: bool
    method: str
    expiryDate: str
    profile: Profile
    institution: Institution
    accounts: Accounts
    links: Links
