from fastapi import APIRouter, Response, status, HTTPException, Depends
from modules.reports_management.models.reports_management_models import (
    WeekReportSaveRequest,
)
from scripts.constants.app_constants import Endpoints, HTTPResponses, CommonConstants
from modules.reports_management.handlers.reports_management_handler import ReportsManagementHandler
from scripts.helpers.auth_dependency import get_current_user
from scripts.logging.log_module import logger as log
import json
from typing import List, Dict, Any

reportsManagementRouter = APIRouter()
ReportsManagement = ReportsManagementHandler()


@reportsManagementRouter.get("/")
async def welcome_message():
    try:
        return {"message": "Welcome to Reports Management Services API"}
    except Exception as e:
        log.error(f"Exception Occurred : {str(e)}")
        return Response(
            content=json.dumps({"message": "The operation could not be performed. Please try again later."}),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json"
        )


@reportsManagementRouter.get(Endpoints.reports_periods)
async def get_periods(year: int | None = None, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")

        result = ReportsManagement.get_salary_periods(year)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@reportsManagementRouter.get(Endpoints.reports_week_get)
async def get_week_report(
    chatter_id: str,
    period: str,
    year: int | None = None,
    week: int = 1,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        result = ReportsManagement.get_week_report(chatter_id, period, year, week)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@reportsManagementRouter.post(Endpoints.reports_week_save)
async def save_week_report(
    payload: WeekReportSaveRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        admin_id = current_user.get("user_id")
        result = ReportsManagement.save_week_report(payload, admin_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@reportsManagementRouter.get(Endpoints.reports_summary)
async def get_reports_summary(
    period: str,
    year: int | None = None,
    week: int | None = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        result = ReportsManagement.get_reports_summary(period, year, week)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@reportsManagementRouter.get(Endpoints.reports_chatter_salary)
async def get_chatter_salary_data(
    chatter_id: str,
    period: str,
    year: int | None = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        result = ReportsManagement.get_chatter_salary_data(chatter_id, period, year)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@reportsManagementRouter.get(Endpoints.payouts_list)
async def list_payouts(
    period: str,
    year: int | None = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        result = ReportsManagement.list_payouts(period, year)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@reportsManagementRouter.put(Endpoints.payouts_update)
async def update_payout(
    chatter_id: str,
    period: str,
    year: int | None = None,
    payment_status: str = "Not Paid",
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        admin_id = current_user.get("user_id")
        result = ReportsManagement.update_payout_status(chatter_id, period, year, payment_status, admin_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@reportsManagementRouter.post("/salary/calculate-daily")
async def calculate_daily_salary(
    chatter_id: str,
    work_date: str,
    work_rows: List[Dict[str, Any]],
    current_user: dict = Depends(get_current_user)
):
    """Calculate daily salary for a chatter based on work rows"""
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        # Debug logging
        log.debug(f"calculate_daily_salary called with chatter_id={chatter_id}, work_date={work_date}")
        log.debug(f"work_rows data: {work_rows}")
        
        # Import the salary calculation helper
        from scripts.helpers.salary_calculation_helper import SalaryCalculationHelper
        
        salary_helper = SalaryCalculationHelper()
        daily_result = salary_helper.calculate_daily_salary(chatter_id, work_date, work_rows)
        
        if "error" in daily_result:
            return {
                "status": "Failed",
                "message": daily_result["error"],
                "data": None
            }
        
        return {
            "status": "Success",
            "message": "Daily salary calculated successfully",
            "data": daily_result
        }
        
    except Exception as e:
        log.error(f"Error calculating daily salary: {str(e)}")
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))

@reportsManagementRouter.post("/salary/calculate-week")
async def calculate_week_salary(
    chatter_id: str,
    period: str,
    year: int,
    week: int,
    current_user: dict = Depends(get_current_user)
):
    """Calculate weekly salary for a chatter"""
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        # Import the salary calculation helper
        from scripts.helpers.salary_calculation_helper import SalaryCalculationHelper
        
        salary_helper = SalaryCalculationHelper()
        week_result = salary_helper.calculate_week_salary(chatter_id, period, year, week)
        
        if "error" in week_result:
            return {
                "status": "Failed",
                "message": week_result["error"],
                "data": None
            }
        
        return {
            "status": "Success",
            "message": "Weekly salary calculated successfully",
            "data": week_result
        }
        
    except Exception as e:
        log.error(f"Error calculating weekly salary: {str(e)}")
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


