from pydantic import BaseModel, Field
from typing import Literal, Optional, Dict, Any
from datetime import datetime

OutputFormat = Literal["html", "pdf"]


class DocumentMetadata(BaseModel):
    """
    Metadata for generated documents containing all information about a document
    that was created through the document generation service.
    """

    document_id: str = Field(
        ..., description="Unique identifier for the generated document"
    )
    filename: str = Field(..., description="The filename of the generated document")
    file_path: str = Field(
        ...,
        description="The file path where the document is stored (local path or S3 location)",
    )
    format: OutputFormat = Field(
        ..., description="The output format of the document (html or pdf)"
    )
    generated_at: datetime = Field(
        ..., description="Timestamp when the document was generated"
    )
    template_name: Optional[str] = Field(
        None, description="Name of the template used to generate the document"
    )
    status: Optional[Literal["DRAFT", "FINAL"]] = Field(
        None, description="Status of the document (DRAFT or FINAL)"
    )

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class LoanAgreement(BaseModel):
    """
    Store for loan agreement documents and their acceptance status.
    Contains draft and final versions of loan agreement documents along with acceptance information.
    """

    application_number: str = Field(
        ..., description="Unique application number for the loan"
    )
    draft_document_metadata: Optional[DocumentMetadata] = Field(
        None, description="Draft version of the loan agreement document"
    )
    final_document_metadata: Optional[DocumentMetadata] = Field(
        None, description="Final version of the loan agreement document"
    )
    accepted: bool = Field(
        default=False, description="Whether the loan agreement has been accepted"
    )
    acceptance_timestamp: Optional[datetime] = Field(
        None, description="Timestamp when the loan agreement was accepted"
    )
    acceptance_method: Optional[str] = Field(
        None,
        description="Method used to accept the loan agreement (billie_chatbot, websocket_utterance, etc.)",
    )
    acceptance_metadata: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional metadata about the acceptance (timestamp, method, etc.)",
    )
    ip_address: Optional[str] = Field(
        None, description="IP address of the device that accepted the loan agreement"
    )

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}
