from fastapi import APIRouter, Response, status, HTTPException, Depends
from scripts.constants.app_constants import Endpoints, HTTPResponses, CommonConstants
from modules.insights_management.handlers.insights_management_handler import InsightsManagementHandler
from scripts.helpers.auth_dependency import get_current_user
from scripts.logging.log_module import logger as log
import json

insightsManagementRouter = APIRouter()
InsightsManagement = InsightsManagementHandler()


@insightsManagementRouter.get("/")
async def welcome_message():
    try:
        return {"message": "Welcome to Insights Management Services API"}
    except Exception as e:
        log.error(f"Exception Occurred : {str(e)}")
        return Response(
            content=json.dumps({"message": "The operation could not be performed. Please try again later."}),
            status_code=status.HTTP_400_BAD_REQUEST,
            media_type="application/json"
        )


@insightsManagementRouter.get(Endpoints.insights_agency)
async def get_agency_insights(
    period: str,
    year: int | None = None,
    week: int | None = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        result = InsightsManagement.get_agency_insights(period, year, week)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@insightsManagementRouter.get(Endpoints.dashboard_kpis)
async def get_dashboard_kpis(
    period: str,
    year: int | None = None,
    week: int | None = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        result = InsightsManagement.get_dashboard_kpis(period, year, week)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@insightsManagementRouter.get(f"{Endpoints.insights_model}/{{model_id}}")
async def get_model_insights(
    model_id: str,
    period: str,
    year: int | None = None,
    week: int | None = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        result = InsightsManagement.get_model_insights(model_id, period, year, week)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@insightsManagementRouter.get("/insights/model/cost-breakdown/{model_id}")
async def get_model_cost_breakdown(
    model_id: str,
    period: str,
    year: int | None = None,
    week: int | None = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        result = InsightsManagement.get_model_cost_breakdown(model_id, period, year, week)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@insightsManagementRouter.get(Endpoints.dashboard_leaderboards)
async def get_leaderboards(
    period: str,
    year: int | None = None,
    week: int | None = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        result = InsightsManagement.get_leaderboards(period, year, week)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@insightsManagementRouter.get(Endpoints.invoices_list)
async def list_invoices(
    model_id: str | None = None,
    period: str | None = None,
    year: int | None = None,
    week: int | None = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        result = InsightsManagement.list_invoices(model_id, period, year, week)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@insightsManagementRouter.post(Endpoints.invoice_create)
async def create_invoice(
    invoice: dict,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        admin_id = current_user.get("user_id")
        result = InsightsManagement.create_invoice(invoice, admin_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@insightsManagementRouter.put(Endpoints.invoice_update)
async def update_invoice(
    invoice_id: str,
    updates: dict,
    auto_calculate: bool = False,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        admin_id = current_user.get("user_id")
        result = InsightsManagement.update_invoice(invoice_id, updates, admin_id, auto_calculate)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@insightsManagementRouter.post("/invoice/calculate")
async def calculate_invoice(
    invoice_data: dict,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        result = InsightsManagement.calculate_invoice(invoice_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@insightsManagementRouter.post(Endpoints.insights_recompute_costs)
async def recompute_staff_costs(
    period: str,
    year: int | None = None,
    week: int | None = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        result = InsightsManagement.recompute_staff_costs(period, year, week)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@insightsManagementRouter.post("/recompute-costs-month")
async def recompute_staff_costs_month(
    month: str,
    year: int,
    current_user: dict = Depends(get_current_user)
):
    """Recompute staff costs for both periods of a month"""
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        # Use the existing handler instance and derive correct period labels for the month
        handler = InsightsManagement  # already an instance of InsightsManagementHandler
        try:
            periods = handler._get_month_periods(month, year)  # e.g., ["January 1", "January 2"]
            p1 = periods[0] if len(periods) > 0 else f"{month} 1"
            p2 = periods[1] if len(periods) > 1 else f"{month} 2"
        except Exception:
            p1, p2 = f"{month} 1", f"{month} 2"

        result1 = handler.recompute_staff_costs(p1, year, 1)
        result2 = handler.recompute_staff_costs(p2, year, 2)
        
        if result1.get("status") == "Success" and result2.get("status") == "Success":
            return {"status": "Success", "message": f"Staff costs recomputed for {month} {year}"}
        else:
            return {"status": "Failed", "message": "Failed to recompute staff costs for month"}
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@insightsManagementRouter.post(f"{Endpoints.insights_agency}/save")
async def save_agency_insights(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        result = InsightsManagement.save_agency_insights(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@insightsManagementRouter.post(f"{Endpoints.insights_model}/save")
async def save_model_insights(
    data: dict,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        result = InsightsManagement.save_model_insights(data)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@insightsManagementRouter.get(f"{Endpoints.insights_agency}/saved")
async def get_saved_agency_insights(
    period: str,
    year: int,
    week: int = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        result = InsightsManagement.get_saved_agency_insights(period, year, week)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


@insightsManagementRouter.get(f"{Endpoints.insights_model}/saved")
async def get_saved_model_insights(
    model_id: str,
    period: str,
    year: int,
    week: int = None,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["type"] != CommonConstants.admin_role:
            raise HTTPException(status_code=HTTPResponses.FORBIDDEN, detail="Access forbidden for non-admin users")
        
        result = InsightsManagement.get_saved_model_insights(model_id, period, year, week)
        return result
    except Exception as e:
        raise HTTPException(status_code=HTTPResponses.INTERNAL_SERVER_ERROR, detail=str(e))


