from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    app_name: str
    environment: str
    timestamp: datetime


class SourceItem(BaseModel):
    act: str = Field(..., description="The Act name (e.g. BNS, BNSS, BSA)")
    source: str = Field(..., description="The source PDF document filename")
    page: int = Field(..., description="The page number in the source PDF")
    chunk_id: str = Field(..., description="Unique chunk identifier")
    score: float = Field(..., description="Relevance distance score (lower is closer match)")


class RelevantProvision(BaseModel):
    act: str = Field(..., description="Statutory Act (e.g. Bharatiya Nyaya Sanhita, 2023)")
    section_or_topic: str = Field(..., description="Section number or statutory topic title")
    description: str = Field(..., description="Summary of the provision's rule or definition")
    relevance_reason: str = Field(..., description="Explanation of why this provision may be relevant to the scenario")


class LegalQueryRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=3,
        max_length=4000,
        description="The factual situation or legal question to research",
        examples=["Someone threatened me and demanded money. What legal provisions may be relevant?"]
    )
    top_k: Optional[int] = Field(
        default=8,
        ge=1,
        le=20,
        description="Number of statutory context chunks to retrieve (default: 8)"
    )
    act_filter: Optional[str] = Field(
        default=None,
        description="Optional filter to prioritize or restrict to a specific Act (BNS, BNSS, BSA)"
    )
    user_type: Optional[str] = Field(
        default=None,
        description="Optional persona: 'victim_complainant' | 'citizen_general' | 'student_researcher' | 'legal_advocate' | 'police_officer'"
    )
    purpose: Optional[str] = Field(
        default=None,
        description="Optional purpose: 'seeking_remedy' | 'reporting_crime' | 'academic_study' | 'case_preparation' | 'statutory_reference' | 'general_awareness'"
    )


class LegalQueryResponse(BaseModel):
    question: str = Field(..., description="Original user question or situation")
    answer: str = Field(..., description="Comprehensive grounded legal research answer")
    relevant_provisions: List[RelevantProvision] = Field(
        default_factory=list,
        description="Structured list of potentially applicable statutory provisions"
    )
    why_they_may_apply: Optional[str] = Field(
        default=None,
        description="Detailed legal reasoning connecting facts to retrieved statutory elements"
    )
    additional_facts_needed: List[str] = Field(
        default_factory=list,
        description="Crucial factual details or evidence needed to reach a conclusive legal assessment"
    )
    sources: List[SourceItem] = Field(
        default_factory=list,
        description="Statutory source citations from the knowledge base"
    )
    confidence: str = Field(
        ...,
        description="Retrieval confidence rating: HIGH, MEDIUM, or LOW"
    )
    disclaimer: str = Field(
        ...,
        description="Mandatory legal research informational disclaimer"
    )


class LegalSearchRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=2,
        max_length=4000,
        description="Search query to find statutory passages in the knowledge base"
    )
    k: Optional[int] = Field(
        default=8,
        ge=1,
        le=30,
        description="Maximum number of context chunks to return"
    )
    act: Optional[str] = Field(
        default=None,
        description="Optional Act filter (BNS, BNSS, BSA)"
    )


class SearchResultItem(BaseModel):
    content: str
    source: str
    page: int
    chunk_id: str
    score: float
    act: str


class LegalSearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResultItem]


class VectorstoreStatsResponse(BaseModel):
    collection_name: str
    persist_directory: str
    total_documents: int
    sources: Dict[str, int]
    status: str
