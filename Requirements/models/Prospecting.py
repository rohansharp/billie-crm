from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class PreApplicationData(BaseModel):
    loanPurpose: Optional[str] = None
    loanAmount: Optional[float] = None
    loanTerm: Optional[int] = None
    indicativeAcceptance: Optional[bool] = False


class ProspectingState(BaseModel):
    proceedToApplication: bool
    preApplicationData: Optional[PreApplicationData]


class ProspectingSession(BaseModel):
    chat_id: Optional[str]  # ID for this chat that contains the whole conversation
    username: str
    client_id: Optional[str]  # ID for this client. A client can have multiple chats
    state: ProspectingState
    conversation: Optional[List[dict]]
    started_at: datetime
    updated_at: datetime
