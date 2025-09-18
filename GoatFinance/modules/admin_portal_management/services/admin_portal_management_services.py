from fastapi import APIRouter, Response, status, HTTPException, Depends
from modules.admin_portal_management.models.admin_portal_management_models import AdminCreate, LoginAdmin, AdminUpdate
from scripts.constants.app_constants import Endpoints, HTTPResponses
from modules.admin_portal_management.handlers.admin_portal_management_handler import AdminPortalManagementHandler
from scripts.logging.log_module import logger as log
from scripts.helpers.auth_dependency import get_current_user
from scripts.constants.app_constants import CommonConstants
import json

adminPortalManagementRouter = APIRouter()
AdminPortalManagement = AdminPortalManagementHandler()

@adminPortalManagementRouter.get("/")
async def welcome_message():
    try:
        return {"message": "Welcome to Admin Portal Management Services API"}
    except Exception as e:
        log.error(f"Exception Occurred : {str(e)}")
        return Response(
            content=json.dumps({"message": "The operation could not be performed. Please try again later."}),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json"
        )

@adminPortalManagementRouter.post(Endpoints.admin_register)
async def register_admin(admin_data: AdminCreate):
    try:
        return AdminPortalManagement.register_user(admin_data)
    except Exception as e:
        log.error(f"Exception Occurred : {str(e)}")
        return Response(
            content=json.dumps({"message": "The operation could not be performed. Please try again later."}),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json"
        )

@adminPortalManagementRouter.post(Endpoints.admin_login)
async def login_admin(admin: LoginAdmin, response: Response):
    try:
        result = await AdminPortalManagement.login_admin(admin, response)
        return result
    except Exception as e:
        log.error(f"Exception Occurred : {str(e)}")
        return Response(
            content=json.dumps({"message": "The operation could not be performed. Please try again later."}),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json"
        )


@adminPortalManagementRouter.post(Endpoints.admin_forgot)
async def forgot_password(identifier: str):
    try:
        result = await AdminPortalManagement.forgot_password(identifier)
        return result
    except Exception as e:
        log.error(f"Exception Occurred : {str(e)}")
        return Response(
            content=json.dumps({"message": "The operation could not be performed. Please try again later."}),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json"
        )


@adminPortalManagementRouter.post(Endpoints.admin_reset)
async def reset_password(token: str, new_password: str):
    try:
        result = await AdminPortalManagement.reset_password(token, new_password)
        return result
    except Exception as e:
        log.error(f"Exception Occurred : {str(e)}")
        return Response(
            content=json.dumps({"message": "The operation could not be performed. Please try again later."}),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json"
        )
@adminPortalManagementRouter.get(Endpoints.admin_details)
async def get_admin_details(current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        # Use email if available, otherwise use username
        identifier = current_user.get("email") or current_user.get("username")
        user_data = await AdminPortalManagement.get_admin_details(identifier)
        return user_data
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@adminPortalManagementRouter.get(Endpoints.all_admin)
async def get_all_admins(limit: int = 100, offset: int = 0, query: str = "", sort: str = "desc", sort_by: str = "created_at",current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        result = await AdminPortalManagement.get_all_admin(limit, offset, query, sort, sort_by)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@adminPortalManagementRouter.delete(Endpoints.admin_delete)
async def delete_admin(admin_id: str, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        if not admin_id:
            raise HTTPException(status_code=HTTPResponses.BAD_REQUEST, detail="admin_id is required")
        
        result = await AdminPortalManagement.delete_admin(admin_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@adminPortalManagementRouter.put(Endpoints.admin_update)
async def edit_admin_details(admin_id: str, admin_update: AdminUpdate, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin roles")
        result = await AdminPortalManagement.update_admin(admin_id, admin_update)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@adminPortalManagementRouter.get(Endpoints.admin_logout)
async def logout_admin(response: Response):
    try:
        result = await AdminPortalManagement.logout_admin(response)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@adminPortalManagementRouter.post("/admin/migrate/team-leaders")
async def migrate_team_leaders(current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        result = await AdminPortalManagement.migrate_team_leaders()
        return result
    except Exception as e:
        log.error(f"Exception Occurred : {str(e)}")
        return Response(
            content=json.dumps({"message": "The operation could not be performed. Please try again later."}),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json"
        )
