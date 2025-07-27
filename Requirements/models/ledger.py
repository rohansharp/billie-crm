from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Union


class LedgerMessage(BaseModel):
    conv: str = Field(..., description="The conversation ID")
    agt: str = Field(
        ..., description="The internal agent ID that put the message in the ledger"
    )
    usr: str = Field(..., description="The user ID who initiated the conversation")
    seq: int = Field(..., description="The sequence number of the message")
    cause: Optional[str] = Field(
        None, description="The cause ID of the message (a user initiated action)"
    )
    c_seq: Optional[int] = Field(
        None, description="The sequence number from this cause"
    )
    cls: str = Field(
        ...,
        description="The class of event being sent",
        pattern="^(msg|thought|obs|cmd|err)$",
    )
    typ: Optional[str] = Field(
        ..., description="The agent specific type of message being sent"
    )
    rec: Optional[List[str]] = Field(
        None,
        description="The list of specific recipient agents to receive this message",
    )
    payload: Union[dict, str] = Field(
        ..., description="The payload to be sent in the message"
    )

    model_config = ConfigDict(frozen=True)
