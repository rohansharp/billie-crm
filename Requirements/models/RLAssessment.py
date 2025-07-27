from pydantic import BaseModel, field_validator
from typing import List, Optional


class CompletenessCriteria(BaseModel):
    criteriaCode: str
    criteriaText: str
    determinable: bool
    determination: str
    rationale: str


class Question(BaseModel):
    question: str
    questionRationale: str


class RLAssessment(BaseModel):
    completenessCriteria: List[CompletenessCriteria]
    complete: bool
    objectiveLoanAmountAlignment: Optional[bool]
    objectiveLoanAmountAlignmentRationale: Optional[str]
    discretionary: Optional[bool]
    questions: List[Question]

    @field_validator("objectiveLoanAmountAlignment", "discretionary", mode="before")
    @classmethod
    def parse_empty_string_as_none(cls, v):
        if v == "":
            return None
        return v
