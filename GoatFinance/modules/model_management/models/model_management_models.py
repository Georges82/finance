from pydantic import BaseModel, Field, ConfigDict, validator
from typing import Optional, List, Literal


class CutLogic(BaseModel):
    percentage1: Optional[float] = Field(default=None, ge=0)
    threshold: Optional[float] = Field(default=None, ge=0)
    fixedAmount: Optional[float] = Field(default=None, ge=0)
    percentage2: Optional[float] = Field(default=None, ge=0)


class CommissionRules(BaseModel):
    baseCommission: float = Field(..., ge=0)
    bonusEnabled: bool = Field(default=False)
    bonusThreshold: Optional[float] = Field(default=None, ge=0)
    bonusCommission: Optional[float] = Field(default=None, ge=0)


class ModelCreate(BaseModel):
    modelName: str = Field(..., description="Model display name")
    clientAgencyName: str = Field(..., description="Client agency name")
    managerName: Optional[str] = Field(default=None, description="Assigned manager name (optional for reference models)")
    teamLeader: Optional[str] = Field(default=None, description="Assigned team leader name (optional for reference models)")
    teamLeaderId: Optional[str] = Field(default=None, description="Assigned team leader id (FK)")
    referencedModels: Optional[List[str]] = Field(default_factory=list)
    status: Literal["Active", "Inactive"] = Field(default="Active")
    notes: Optional[str] = Field(default=None)
    earningsType: Literal["Type 1", "Type 2"]
    cutLogic: CutLogic
    commissionRules: CommissionRules
    paymentStatus: Optional[Literal["Paid", "Not Paid"]] = Field(default=None, description="Optional at creation; defaults to 'Not Paid'")
    
    @validator('referencedModels')
    def validate_manager_tl_for_non_reference_models(cls, v, values):
        """Validate that manager and team leader are provided for non-reference models"""
        referenced_models = v or []
        is_reference_model = len(referenced_models) > 0
        
        if not is_reference_model:
            manager_name = values.get('managerName')
            team_leader = values.get('teamLeader')
            
            if not manager_name:
                raise ValueError('Manager is required for non-reference models')
            if not team_leader:
                raise ValueError('Team Leader is required for non-reference models')
        
        return v


class ModelUpdate(BaseModel):
    modelName: Optional[str] = None
    clientAgencyName: Optional[str] = None
    managerName: Optional[str] = None
    teamLeader: Optional[str] = None
    teamLeaderId: Optional[str] = None
    referencedModels: Optional[List[str]] = None
    status: Optional[Literal["Active", "Inactive"]] = None
    notes: Optional[str] = None
    earningsType: Optional[Literal["Type 1", "Type 2"]] = None
    cutLogic: Optional[CutLogic] = None
    commissionRules: Optional[CommissionRules] = None
    paymentStatus: Optional[Literal["Paid", "Not Paid"]] = None


class ModelResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    model_id: str
    modelName: str
    clientAgencyName: str
    managerName: str
    teamLeader: str
    referencedModels: List[str]
    status: Literal["Active", "Inactive"]
    notes: Optional[str]
    earningsType: Literal["Type 1", "Type 2"]
    cutLogic: CutLogic
    commissionRules: CommissionRules
    paymentStatus: Literal["Paid", "Not Paid"]
    created_at: Optional[str]
    updated_at: Optional[str]




