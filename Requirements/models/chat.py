from pydantic import BaseModel
from typing import Optional, List


class Utterance(BaseModel):
    username: Optional[str] = None
    conversation_id: Optional[str] = (
        None  # ID for this chat that contains this and subsequent utterances
    )
    application_number: Optional[str] = (
        None  # ID for the application that this chat is associated with
    )
    customer_id: Optional[str] = (
        None  # ID for this client. A client can have multiple chats
    )
    utterance: str = None
    rationale: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    answer_input_type: Optional[str] = (
        None  # Tells the frontend what type of input the answer field is. e.g. address, email, etc
    )
    prev_seq: Optional[int] = None  # Previous sequence number in the conversation
    end_conversation: Optional[bool] = False  # Whether the conversation has ended
    additional_data: Optional[dict] = (
        {}
    )  # Additional data to be used by the front end to enrich the assistant response


class ClientRequest(BaseModel):
    customer_id: Optional[str]
    conversation_id: Optional[str]


class LLMChatResponse(BaseModel):
    u: Optional[str] = None  # utterance
    r: Optional[str] = None  # rationale
    a: Optional[str] = None  # answer_input_type
    c: Optional[bool] = False  # current_step_complete
    d: Optional[dict] = {}  # additional_data
    e: Optional[str] = None  # end_conversation


class ConversationSummary(BaseModel):
    conversation_purpose: str
    conversation_facts: List[str]
    application_number: Optional[str] = None
