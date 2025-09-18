from fastapi import APIRouter, Response, status, HTTPException, Depends, Query
from modules.manager_management.models.manager_management_models import (
    ManagerCreate, ManagerUpdate, AssistantCreate, AssistantUpdate
)
from scripts.constants.app_constants import Endpoints, HTTPResponses
from modules.manager_management.handlers.manager_management_handler import ManagerManagementHandler
from scripts.logging.log_module import logger as log
from scripts.helpers.auth_dependency import get_current_user
from scripts.constants.app_constants import CommonConstants
import json
from datetime import datetime

managerManagementRouter = APIRouter()
ManagerManagement = ManagerManagementHandler()

@managerManagementRouter.get("/")
async def welcome_message():
    try:
        return {"message": "Welcome to Manager Management Services API"}
    except Exception as e:
        log.error(f"Exception Occurred : {str(e)}")
        return Response(
            content=json.dumps({"message": "The operation could not be performed. Please try again later."}),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json"
        )

# Manager Endpoints
@managerManagementRouter.post(Endpoints.manager_register)
async def register_manager(manager_data: ManagerCreate, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        admin_id = current_user.get("user_id")
        if not admin_id:
            raise HTTPException(status_code=HTTPResponses.BAD_REQUEST, detail="Admin ID not found in token")
        
        result = ManagerManagement.register_manager(manager_data, admin_id)
        return result
    except Exception as e:
        log.error(f"Exception Occurred : {str(e)}")
        return Response(
            content=json.dumps({"message": "The operation could not be performed. Please try again later."}),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json"
        )

@managerManagementRouter.get(Endpoints.manager_list)
async def get_all_managers(
    limit: int = 100, 
    offset: int = 0, 
    query: str = "", 
    sort: str = "desc", 
    sort_by: str = "created_at",
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        # Handler method is synchronous; do not await
        result = ManagerManagement.get_all_managers(limit, offset, query, sort, sort_by)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@managerManagementRouter.get(Endpoints.manager_details)
async def get_manager_details(manager_id: str, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        result = await ManagerManagement.get_manager_details(manager_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@managerManagementRouter.put(Endpoints.manager_update)
async def update_manager(manager_id: str, manager_update: ManagerUpdate, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        admin_id = current_user.get("user_id")
        if not admin_id:
            raise HTTPException(status_code=HTTPResponses.BAD_REQUEST, detail="Admin ID not found in token")
        
        result = await ManagerManagement.update_manager(manager_id, manager_update, admin_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@managerManagementRouter.delete(Endpoints.manager_delete)
async def delete_manager(manager_id: str, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        result = await ManagerManagement.delete_manager(manager_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

# Assistant Endpoints
@managerManagementRouter.post(Endpoints.assistant_register)
async def register_assistant(assistant_data: AssistantCreate, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        admin_id = current_user.get("user_id")
        if not admin_id:
            raise HTTPException(status_code=HTTPResponses.BAD_REQUEST, detail="Admin ID not found in token")
        
        result = ManagerManagement.register_assistant(assistant_data, admin_id)
        return result
    except Exception as e:
        log.error(f"Exception Occurred : {str(e)}")
        return Response(
            content=json.dumps({"message": "The operation could not be performed. Please try again later."}),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json"
        )

@managerManagementRouter.get(Endpoints.assistant_list)
async def get_all_assistants(
    limit: int = 100, 
    offset: int = 0, 
    query: str = "", 
    sort: str = "desc", 
    sort_by: str = "created_at",
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        result = await ManagerManagement.get_all_assistants(limit, offset, query, sort, sort_by)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@managerManagementRouter.get(Endpoints.assistant_details)
async def get_assistant_details(assistant_id: str, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        result = await ManagerManagement.get_assistant_details(assistant_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@managerManagementRouter.put(Endpoints.assistant_update)
async def update_assistant(assistant_id: str, assistant_update: AssistantUpdate, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        admin_id = current_user.get("user_id")
        if not admin_id:
            raise HTTPException(status_code=HTTPResponses.BAD_REQUEST, detail="Admin ID not found in token")
        
        result = await ManagerManagement.update_assistant(assistant_id, assistant_update, admin_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@managerManagementRouter.delete(Endpoints.assistant_delete)
async def delete_assistant(assistant_id: str, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        result = await ManagerManagement.delete_assistant(assistant_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

# Salary Management Endpoints
@managerManagementRouter.get(Endpoints.manager_salary_periods)
async def get_manager_salary_periods(year: int = None, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        # Return full year split into bi-monthly periods: 1 and 2 for each month
        # Use the same format as stored in database: "January 1", "January 2", etc.
        periods = [
            {"id": "January 1", "name": "Jan 1"}, {"id": "January 2", "name": "Jan 2"},
            {"id": "February 1", "name": "Feb 1"}, {"id": "February 2", "name": "Feb 2"},
            {"id": "March 1", "name": "Mar 1"}, {"id": "March 2", "name": "Mar 2"},
            {"id": "April 1", "name": "Apr 1"}, {"id": "April 2", "name": "Apr 2"},
            {"id": "May 1", "name": "May 1"}, {"id": "May 2", "name": "May 2"},
            {"id": "June 1", "name": "Jun 1"}, {"id": "June 2", "name": "Jun 2"},
            {"id": "July 1", "name": "Jul 1"}, {"id": "July 2", "name": "Jul 2"},
            {"id": "August 1", "name": "Aug 1"}, {"id": "August 2", "name": "Aug 2"},
            {"id": "September 1", "name": "Sep 1"}, {"id": "September 2", "name": "Sep 2"},
            {"id": "October 1", "name": "Oct 1"}, {"id": "October 2", "name": "Oct 2"},
            {"id": "November 1", "name": "Nov 1"}, {"id": "November 2", "name": "Nov 2"},
            {"id": "December 1", "name": "Dec 1"}, {"id": "December 2", "name": "Dec 2"},
        ]
        
        return {
            "status": "Success",
            "message": "Salary periods retrieved successfully",
            "data": {
                "periods": periods,
                "current_period": "aug1",
                "year": year or datetime.now().year
            }
        }
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@managerManagementRouter.post(Endpoints.manager_salary_calculate)
async def calculate_manager_salary(
    manager_id: str,
    period: str,
    year: int = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        # Use the insights handler to calculate real salary
        from modules.insights_management.handlers.insights_management_handler import InsightsManagementHandler
        insights_handler = InsightsManagementHandler()
        
        # Trigger salary recalculation for this period
        result = insights_handler.recompute_staff_costs(period, year, None)
        
        if result["status"] == CommonConstants.success:
            # Get the calculated salary from manager_salaries table
            from scripts.utils.common_utils import PostgresConnection
            conn = PostgresConnection().connect_to_postgres_utility()
            
            salary_data = conn.fetch_all_records_with_condition(
                "manager_salaries",
                "manager_id = %s AND period = %s AND year = %s",
                (manager_id, period, year or datetime.now().year)
            )
            
            if salary_data and len(salary_data) > 0:
                salary_record = salary_data[0]
                calculated_amount = float(salary_record.get("total_salary", 0.0))
                
                return {
                    "status": "Success",
                    "message": "Salary calculated successfully",
                    "data": {
                        "manager_id": manager_id,
                        "period": period,
                        "year": year or datetime.now().year,
                        "calculated_amount": calculated_amount,
                        "week1_salary": float(salary_record.get("week1_salary", 0.0)),
                        "week2_salary": float(salary_record.get("week2_salary", 0.0)),
                        "payment_status": salary_record.get("payment_status", "Not Paid")
                    }
                }
            else:
                return {
                    "status": "Success",
                    "message": "No salary data found for this manager and period",
                    "data": {
                        "manager_id": manager_id,
                        "period": period,
                        "year": year or datetime.now().year,
                        "calculated_amount": 0.0
                    }
                }
        else:
            raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=result.get("message", "Failed to calculate salary"))
            
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@managerManagementRouter.post(Endpoints.assistant_salary_calculate)
async def calculate_assistant_salary(
    assistant_id: str,
    period: str,
    year: int = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        # Use the insights handler to calculate real salary
        from modules.insights_management.handlers.insights_management_handler import InsightsManagementHandler
        insights_handler = InsightsManagementHandler()
        
        # Trigger salary recalculation for this period
        result = insights_handler.recompute_staff_costs(period, year, None)
        
        if result["status"] == CommonConstants.success:
            # Get the calculated salary from assistant_salaries table
            from scripts.utils.common_utils import PostgresConnection
            conn = PostgresConnection().connect_to_postgres_utility()
            
            salary_data = conn.fetch_all_records_with_condition(
                "assistant_salaries",
                "assistant_id = %s AND period = %s AND year = %s",
                (assistant_id, period, year or datetime.now().year)
            )
            
            if salary_data and len(salary_data) > 0:
                salary_record = salary_data[0]
                calculated_amount = float(salary_record.get("total_salary", 0.0))
                
                return {
                    "status": "Success",
                    "message": "Salary calculated successfully",
                    "data": {
                        "assistant_id": assistant_id,
                        "period": period,
                        "year": year or datetime.now().year,
                        "calculated_amount": calculated_amount,
                        "week1_salary": float(salary_record.get("week1_salary", 0.0)),
                        "week2_salary": float(salary_record.get("week2_salary", 0.0)),
                        "payment_status": salary_record.get("payment_status", "Not Paid")
                    }
                }
            else:
                return {
                    "status": "Success",
                    "message": "No salary data found for this assistant and period",
                    "data": {
                        "assistant_id": assistant_id,
                        "period": period,
                        "year": year or datetime.now().year,
                        "calculated_amount": 0.0
                    }
                }
        else:
            raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=result.get("message", "Failed to calculate salary"))
            
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

# Additional endpoints for salary updates and auto-updates can be added here
# following the same pattern as the chatter management module

@managerManagementRouter.get("/managers/with-salaries")
async def get_managers_with_period_salaries(
    periods: str = Query(..., description="Comma-separated period IDs (e.g., 'jul1,jul2,aug1')"),
    year: int = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        period_list = [p.strip() for p in periods.split(',')]
        year = year or datetime.now().year
        
        handler = ManagerManagementHandler()
        result = handler.get_managers_with_period_salaries(period_list, year)
        
        return result
    except Exception as e:
        log.error(f"Error fetching managers with salaries: {str(e)}")
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@managerManagementRouter.put("/manager/salary/payment-status")
async def update_manager_payment_status(
    manager_id: str,
    period: str,
    year: int = None,
    payment_status: str = Query('Not Paid', regex="^(Paid|Not Paid)$"),
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")

        year = year or datetime.now().year
        handler = ManagerManagementHandler()
        result = handler.update_manager_salary_payment_status(
            manager_id=manager_id,
            period=period,
            year=year,
            payment_status=payment_status,
            admin_id=current_user.get("user_id")
        )
        return result
    except Exception as e:
        log.error(f"Error updating payment status: {str(e)}")
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@managerManagementRouter.get("/assistants/with-salaries")
async def get_assistants_with_period_salaries(
    periods: str = Query(..., description="Comma-separated period IDs (e.g., 'jan1,jul1')"),
    year: int = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        period_list = [p.strip() for p in periods.split(',')]
        year = year or datetime.now().year
        handler = ManagerManagementHandler()
        result = handler.get_assistants_with_period_salaries(period_list, year)
        return result
    except Exception as e:
        log.error(f"Error fetching assistants with salaries: {str(e)}")
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@managerManagementRouter.put("/assistant/salary/payment-status")
async def update_assistant_payment_status(
    assistant_id: str,
    period: str,
    year: int = None,
    payment_status: str = Query('Not Paid', regex="^(Paid|Not Paid)$"),
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        year = year or datetime.now().year
        handler = ManagerManagementHandler()
        result = handler.update_assistant_salary_payment_status(
            assistant_id=assistant_id,
            period=period,
            year=year,
            payment_status=payment_status,
            admin_id=current_user.get("user_id")
        )
        return result
    except Exception as e:
        log.error(f"Error updating assistant payment status: {str(e)}")
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

# Team Leader Endpoints
@managerManagementRouter.get("/team-leaders")
async def get_all_team_leaders(
    limit: int = 100, 
    offset: int = 0, 
    query: str = "", 
    sort: str = "desc", 
    sort_by: str = "created_at",
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        # Get team leaders (managers with role = 'Team Leader')
        result = ManagerManagement.get_all_managers(limit, offset, query, sort, sort_by, role_filter="Team Leader")
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@managerManagementRouter.get("/team-leaders/{team_leader_id}")
async def get_team_leader_details(team_leader_id: str, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        result = await ManagerManagement.get_manager_details(team_leader_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

# Team Leader Endpoints (singular form - for frontend compatibility)
@managerManagementRouter.get("/team-leader/list")
async def get_all_team_leaders_list(
    limit: int = 100, 
    offset: int = 0, 
    query: str = "", 
    sort: str = "desc", 
    sort_by: str = "created_at",
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        # Get team leaders (managers with role = 'Team Leader')
        result = ManagerManagement.get_all_managers(limit, offset, query, sort, sort_by, role_filter="Team Leader")
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@managerManagementRouter.post("/team-leader/register")
async def register_team_leader(manager_data: ManagerCreate, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        admin_id = current_user.get("user_id")
        if not admin_id:
            raise HTTPException(status_code=HTTPResponses.BAD_REQUEST, detail="Admin ID not found in token")
        
        # Ensure the role is set to Team Leader
        manager_data.role = "Team Leader"
        
        result = ManagerManagement.register_manager(manager_data, admin_id)
        return result
    except Exception as e:
        log.error(f"Exception Occurred : {str(e)}")
        return Response(
            content=json.dumps({"message": "The operation could not be performed. Please try again later."}),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json"
        )

@managerManagementRouter.put("/team-leader/update")
async def update_team_leader(
    team_leader_id: str, 
    manager_update: ManagerUpdate, 
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        admin_id = current_user.get("user_id")
        if not admin_id:
            raise HTTPException(status_code=HTTPResponses.BAD_REQUEST, detail="Admin ID not found in token")
        
        # Ensure the role is set to Team Leader
        manager_update.role = "Team Leader"
        
        result = await ManagerManagement.update_manager(team_leader_id, manager_update, admin_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@managerManagementRouter.delete("/team-leader/delete")
async def delete_team_leader(team_leader_id: str, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        result = await ManagerManagement.delete_manager(team_leader_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@managerManagementRouter.get("/team-leader/details")
async def get_team_leader_details_singular(team_leader_id: str, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        result = await ManagerManagement.get_manager_details(team_leader_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))
