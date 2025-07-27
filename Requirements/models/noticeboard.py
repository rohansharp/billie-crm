from pydantic import BaseModel
from typing import Optional


class NoticeboardPost(BaseModel):
    conversation_id: str
    agent_name: str
    post: str
    conversation_state_seq: Optional[int] = 0
    application_number: Optional[str] = None
    customer_id: Optional[str] = None
    agent_finished: Optional[bool] = False
    force_turn: Optional[bool] = False
    end_conversation: Optional[bool] = False
    end_conversation_text: Optional[str] = ""