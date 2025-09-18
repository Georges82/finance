from fastapi import APIRouter, Response, status, HTTPException, Depends
from modules.model_management.models.model_management_models import ModelCreate, ModelUpdate
from scripts.constants.app_constants import Endpoints, HTTPResponses
from modules.model_management.handlers.model_management_handler import ModelManagementHandler
from scripts.logging.log_module import logger as log
from scripts.helpers.auth_dependency import get_current_user
from scripts.constants.app_constants import CommonConstants
import json

modelManagementRouter = APIRouter()
ModelManagement = ModelManagementHandler()


@modelManagementRouter.get("/")
async def welcome_message():
    try:
        return {"message": "Welcome to Model Management Services API"}
    except Exception as e:
        log.error(f"Exception Occurred : {str(e)}")
        return Response(
            content=json.dumps({"message": "The operation could not be performed. Please try again later."}),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json"
        )


@modelManagementRouter.post(Endpoints.model_register)
async def register_model(model_data: ModelCreate, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")

        admin_id = current_user.get("user_id")
        if not admin_id:
            raise HTTPException(status_code=HTTPResponses.BAD_REQUEST, detail="Admin ID not found in token")

        result = ModelManagement.register_model(model_data, admin_id)
        return result
    except Exception as e:
        log.error(f"Exception Occurred : {str(e)}")
        return Response(
            content=json.dumps({"message": "The operation could not be performed. Please try again later."}),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json"
        )


@modelManagementRouter.get(Endpoints.model_list)
async def get_all_models(
    limit: int = 100,
    offset: int = 0,
    query: str = "",
    sort: str = "desc",
    sort_by: str = "created_at",
    status_filter: str = None,
    client_agency_name: str = None,
    manager_name: str = None,
    team_leader: str = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")

        result = ModelManagement.get_all_models(limit, offset, query, sort, sort_by, status_filter, client_agency_name, manager_name, team_leader)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@modelManagementRouter.get(Endpoints.model_details)
async def get_model_details(model_id: str, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")

        result = await ModelManagement.get_model_details(model_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@modelManagementRouter.put(Endpoints.model_update)
async def update_model(model_id: str, model_update: ModelUpdate, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")

        admin_id = current_user.get("user_id")
        if not admin_id:
            raise HTTPException(status_code=HTTPResponses.BAD_REQUEST, detail="Admin ID not found in token")

        result = await ModelManagement.update_model(model_id, model_update, admin_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@modelManagementRouter.delete(Endpoints.model_delete)
async def delete_model(model_id: str, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")

        result = await ModelManagement.delete_model(model_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


















