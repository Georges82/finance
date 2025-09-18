from fastapi import APIRouter, Response, status, HTTPException, Depends
from modules.chatter_management.models.chatter_management_models import (
    ChatterCreate, ChatterUpdate, ChatterRateAdd, ChatterRateUpdate, ChatterRatesUpdate
)
from scripts.constants.app_constants import Endpoints, HTTPResponses
from modules.chatter_management.handlers.chatter_management_handler import ChatterManagementHandler
from scripts.helpers.salary_calculation_helper import SalaryCalculationHelper
from scripts.logging.log_module import logger as log
from scripts.helpers.auth_dependency import get_current_user
from scripts.constants.app_constants import CommonConstants
import json
from datetime import datetime

chatterManagementRouter = APIRouter()
ChatterManagement = ChatterManagementHandler()
SalaryHelper = SalaryCalculationHelper()

@chatterManagementRouter.get("/")
async def welcome_message():
    try:
        return {"message": "Welcome to Chatter Management Services API"}
    except Exception as e:
        log.error(f"Exception Occurred : {str(e)}")
        return Response(
            content=json.dumps({"message": "The operation could not be performed. Please try again later."}),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json"
        )

@chatterManagementRouter.post(Endpoints.chatter_register)
async def register_chatter(chatter_data: ChatterCreate, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        admin_id = current_user.get("user_id")
        if not admin_id:
            raise HTTPException(status_code=HTTPResponses.BAD_REQUEST, detail="Admin ID not found in token")
        
        result = ChatterManagement.register_chatter(chatter_data, admin_id)
        return result
    except Exception as e:
        log.error(f"Exception Occurred : {str(e)}")
        return Response(
            content=json.dumps({"message": "The operation could not be performed. Please try again later."}),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json"
        )

@chatterManagementRouter.get(Endpoints.chatter_list)
async def get_all_chatters(
    limit: int = 100, 
    offset: int = 0, 
    query: str = "", 
    sort: str = "desc", 
    sort_by: str = "created_at",
    status_filter: str = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        result = await ChatterManagement.get_all_chatters(limit, offset, query, sort, sort_by, status_filter)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@chatterManagementRouter.get("/chatter/list-with-salary")
async def get_chatters_with_salary(
    limit: int = 100, 
    offset: int = 0, 
    query: str = "", 
    sort: str = "desc", 
    sort_by: str = "created_at",
    period: str = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        result = await ChatterManagement.get_chatters_with_salary_data(limit, offset, query, sort, sort_by, period)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@chatterManagementRouter.get(Endpoints.chatter_details)
async def get_chatter_details(chatter_id: str, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        result = await ChatterManagement.get_chatter_details(chatter_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@chatterManagementRouter.put(Endpoints.chatter_update)
async def update_chatter(chatter_id: str, chatter_update: ChatterUpdate, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        admin_id = current_user.get("user_id")
        if not admin_id:
            raise HTTPException(status_code=HTTPResponses.BAD_REQUEST, detail="Admin ID not found in token")
        
        result = await ChatterManagement.update_chatter(chatter_id, chatter_update, admin_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@chatterManagementRouter.delete(Endpoints.chatter_delete)
async def delete_chatter(chatter_id: str, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        result = await ChatterManagement.delete_chatter(chatter_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@chatterManagementRouter.get(Endpoints.chatter_rates)
async def get_chatter_rates(chatter_id: str, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        result = await ChatterManagement.get_chatter_rates(chatter_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@chatterManagementRouter.put(Endpoints.chatter_rate_update)
async def update_chatter_rate(
    chatter_id: str,
    rate_update: ChatterRatesUpdate, 
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        admin_id = current_user.get("user_id")
        if not admin_id:
            raise HTTPException(status_code=HTTPResponses.BAD_REQUEST, detail="Admin ID not found in token")
        
        result = await ChatterManagement.update_chatter_rates(rate_update, chatter_id, admin_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@chatterManagementRouter.post(Endpoints.chatter_rate_add)
async def add_chatter_rate(
    chatter_id: str,
    rate_data: ChatterRateAdd,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        admin_id = current_user.get("user_id")
        if not admin_id:
            raise HTTPException(status_code=HTTPResponses.BAD_REQUEST, detail="Admin ID not found in token")
        
        # Convert Pydantic model to dict and add chatter_id
        rate_dict = rate_data.model_dump()
        rate_dict["chatter_id"] = chatter_id
        
        result = await ChatterManagement.add_chatter_rate(rate_dict, admin_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@chatterManagementRouter.delete(Endpoints.chatter_rate_delete)
async def delete_chatter_rate(rate_id: str, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        result = await ChatterManagement.delete_chatter_rate(rate_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@chatterManagementRouter.get("/salary/periods")
async def get_salary_periods(year: int = None, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        periods = SalaryHelper.generate_salary_periods(year)
        current_period = SalaryHelper.get_current_salary_period()
        
        return {
            "status": "Success",
            "message": "Salary periods retrieved successfully",
            "data": {
                "periods": periods,
                "current_period": current_period,
                "year": year or datetime.now().year
            }
        }
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@chatterManagementRouter.post("/salary/calculate")
async def calculate_chatter_salary(
    chatter_id: str,
    period: str,
    year: int = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        salary_amount = SalaryHelper.calculate_chatter_salary(chatter_id, period, year)
        
        return {
            "status": "Success",
            "message": "Salary calculated successfully",
            "data": {
                "chatter_id": chatter_id,
                "period": period,
                "year": year or datetime.now().year,
                "calculated_amount": salary_amount
            }
        }
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@chatterManagementRouter.post("/salary/update")
async def update_chatter_salary(
    chatter_id: str,
    period: str,
    year: int = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        success = SalaryHelper.update_chatter_salary_for_period(chatter_id, period, year)
        
        if success:
            return {
                "status": "Success",
                "message": f"Salary updated successfully for {period}",
                "data": {
                    "chatter_id": chatter_id,
                    "period": period,
                    "year": year or datetime.now().year
                }
            }
        else:
            raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail="Failed to update salary")
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@chatterManagementRouter.post("/salary/update-all")
async def update_all_chatters_salary(
    period: str,
    year: int = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        results = SalaryHelper.update_all_chatters_salary_for_period(period, year)
        
        successful_updates = sum(1 for success in results.values() if success)
        total_chatters = len(results)
        
        return {
            "status": "Success",
            "message": f"Updated salaries for {successful_updates}/{total_chatters} chatters",
            "data": {
                "period": period,
                "year": year or datetime.now().year,
                "total_chatters": total_chatters,
                "successful_updates": successful_updates,
                "results": results
            }
        }
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@chatterManagementRouter.post("/salary/auto-update")
async def auto_update_current_period(current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        results = SalaryHelper.auto_update_salaries_for_current_period()
        current_period = SalaryHelper.get_current_salary_period()
        
        successful_updates = sum(1 for success in results.values() if success)
        total_chatters = len(results)
        
        return {
            "status": "Success",
            "message": f"Auto-updated salaries for current period: {current_period}",
            "data": {
                "current_period": current_period,
                "total_chatters": total_chatters,
                "successful_updates": successful_updates,
                "results": results
            }
        }
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))
