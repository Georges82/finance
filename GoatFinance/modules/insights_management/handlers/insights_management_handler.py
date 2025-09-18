from scripts.utils.common_utils import PostgresConnection
from scripts.logging.log_module import logger as log
from scripts.constants.app_constants import GFTableNames, CommonConstants, TableNames
from scripts.helpers.salary_calculation_helper import SalaryCalculationHelper
from fastapi import Response, status
from datetime import datetime, timedelta
import time
import json


class InsightsManagementHandler:
    def __init__(self):
        try:
            self.db_object_utility = PostgresConnection()
            self.salary_helper = SalaryCalculationHelper()
        except Exception as e:
            log.error(str(e))

    def postgres_connection(self):
        try:
            return self.db_object_utility.connect_to_postgres_utility()
        except Exception as e:
            log.error("Exception Occurred While Connection to Postgres" + str(e))

    def _scope_condition(self, period: str, year: int | None, week: int | None):
        year = year or datetime.now().year
        # support special month label like "July" to aggregate both halves
        months = {
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        }
        if period in months:
            # period column stores labels like "July 1" and "July 2"
            cond = "(period = %s OR period = %s) AND year = %s"
            params = (f"{period} 1", f"{period} 2", year)
            if week in [1, 2]:
                cond += " AND week = %s"
                params = params + (week,)
            return cond, params
        params = [period, year]
        cond = "period = %s AND year = %s"
        if week in [1, 2]:
            cond += " AND week = %s"
            params.append(week)
        return cond, tuple(params)

    def _get_month_periods(self, month: str, year: int):
        """Get both periods for a given month"""
        return [f"{month} 1", f"{month} 2"]

    def _is_month_scope(self, period: str) -> bool:
        """Check if the period is a month-level scope"""
        months = {
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        }
        return period in months

    def get_agency_insights(self, period: str, year: int | None, week: int | None):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to get agency insights"}
        conn = self.postgres_connection()
        try:
            cond, params = self._scope_condition(period, year, week)

            # Revenue
            inv_rows = conn.fetch_all_records_with_condition(GFTableNames.invoices, cond, params)
            revenue = sum(float(r.get("invoice_amount", 0.0)) for r in inv_rows or [])
            real_revenue = sum(float(r.get("invoice_amount", 0.0)) for r in inv_rows or [] if (r.get("status") or "").lower() == "paid")

            # Cost
            cost_rows = conn.fetch_all_records_with_condition(GFTableNames.model_weekly_costs, cond, params)
            cost = sum(float(r.get("total_cost", 0.0)) for r in cost_rows or [])

            profit = revenue - cost
            real_profit = real_revenue - cost

            # Add month-specific metadata if it's a month scope
            metadata = {}
            if self._is_month_scope(period):
                metadata["scope_type"] = "month"
                metadata["month"] = period
                metadata["periods_included"] = self._get_month_periods(period, year or datetime.now().year)
            else:
                metadata["scope_type"] = "period"
                metadata["period"] = period

            final_resp["status"] = CommonConstants.success
            final_resp["message"] = "Agency insights fetched"
            final_resp["data"] = {
                "revenue": round(revenue, 2),
                "real_revenue": round(real_revenue, 2),
                "cost": round(cost, 2),
                "profit": round(profit, 2),
                "real_profit": round(real_profit, 2),
                "metadata": metadata
            }
            return final_resp
        except Exception as e:
            log.error(f"Error fetching agency insights: {str(e)}")
            return final_resp

    def get_dashboard_kpis(self, period: str, year: int | None, week: int | None):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to get KPIs"}
        conn = self.postgres_connection()
        try:
            # Counts
            total_chatters = conn.fetch_count(GFTableNames.chatters)
            total_models = conn.fetch_count(GFTableNames.models)
            total_clients = conn.count_different_values_in_column("COUNT(DISTINCT client_agency_name) as count", GFTableNames.models) or {"count": 0}

            # Snapshot for selected scope (reuse agency insights)
            snapshot = self.get_agency_insights(period, year, week)

            # Add month-specific KPIs if it's a month scope
            month_kpis = {}
            if self._is_month_scope(period):
                month_kpis = self._get_month_specific_kpis(period, year or datetime.now().year, conn)

            final_resp["status"] = CommonConstants.success
            final_resp["message"] = "KPIs fetched"
            final_resp["data"] = {
                "total_chatters": int(total_chatters or 0),
                "total_models": int(total_models or 0),
                "total_clients": int(total_clients.get("count", 0)),
                "snapshot": snapshot.get("data", {}) if isinstance(snapshot, dict) else {},
                "month_kpis": month_kpis
            }
            return final_resp
        except Exception as e:
            log.error(f"Error fetching KPIs: {str(e)}")
            return final_resp

    def _get_month_specific_kpis(self, month: str, year: int, conn):
        """Get month-specific KPIs like period breakdown, growth metrics, etc."""
        try:
            month_periods = self._get_month_periods(month, year)
            
            # Get data for both periods
            period1_data = self.get_agency_insights(month_periods[0], year, None)
            period2_data = self.get_agency_insights(month_periods[1], year, None)
            
            p1_data = period1_data.get("data", {}) if isinstance(period1_data, dict) else {}
            p2_data = period2_data.get("data", {}) if isinstance(period2_data, dict) else {}
            
            # Calculate period breakdown
            period_breakdown = {
                "period_1": {
                    "revenue": p1_data.get("revenue", 0),
                    "real_revenue": p1_data.get("real_revenue", 0),
                    "cost": p1_data.get("cost", 0),
                    "profit": p1_data.get("profit", 0),
                    "real_profit": p1_data.get("real_profit", 0)
                },
                "period_2": {
                    "revenue": p2_data.get("revenue", 0),
                    "real_revenue": p2_data.get("real_revenue", 0),
                    "cost": p2_data.get("cost", 0),
                    "profit": p2_data.get("profit", 0),
                    "real_profit": p2_data.get("real_profit", 0)
                }
            }
            
            # Calculate growth metrics (period 2 vs period 1)
            p1_revenue = p1_data.get("revenue", 0)
            p2_revenue = p2_data.get("revenue", 0)
            p1_profit = p1_data.get("profit", 0)
            p2_profit = p2_data.get("profit", 0)
            
            growth_metrics = {
                "revenue_growth_pct": round(((p2_revenue - p1_revenue) / p1_revenue * 100) if p1_revenue > 0 else 0, 2),
                "profit_growth_pct": round(((p2_profit - p1_profit) / p1_profit * 100) if p1_profit > 0 else 0, 2),
                "revenue_growth_abs": round(p2_revenue - p1_revenue, 2),
                "profit_growth_abs": round(p2_profit - p1_profit, 2)
            }
            
            return {
                "period_breakdown": period_breakdown,
                "growth_metrics": growth_metrics,
                "month": month,
                "year": year
            }
        except Exception as e:
            log.error(f"Error calculating month-specific KPIs: {str(e)}")
            return {}

    def get_model_insights(self, model_id: str, period: str, year: int | None, week: int | None):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to get model insights"}
        conn = self.postgres_connection()
        try:
            cond, params = self._scope_condition(period, year, week)
            cond = f"model_id = %s AND {cond}"
            params = (model_id,) + params

            inv_rows = conn.fetch_all_records_with_condition(GFTableNames.invoices, cond, params)
            revenue = sum(float(r.get("invoice_amount", 0.0)) for r in inv_rows or [])
            real_revenue = sum(float(r.get("invoice_amount", 0.0)) for r in inv_rows or [] if (r.get("status") or "").lower() == "paid")

            cost_rows = conn.fetch_all_records_with_condition(GFTableNames.model_weekly_costs, cond, params)
            cost = sum(float(r.get("total_cost", 0.0)) for r in cost_rows or [])

            profit = revenue - cost
            real_profit = real_revenue - cost

            # Add month-specific metadata if it's a month scope
            metadata = {}
            if self._is_month_scope(period):
                metadata["scope_type"] = "month"
                metadata["month"] = period
                metadata["periods_included"] = self._get_month_periods(period, year or datetime.now().year)

            final_resp["status"] = CommonConstants.success
            final_resp["message"] = "Model insights fetched"
            final_resp["data"] = {
                "revenue": round(revenue, 2),
                "real_revenue": round(real_revenue, 2),
                "cost": round(cost, 2),
                "profit": round(profit, 2),
                "real_profit": round(real_profit, 2),
                "metadata": metadata
            }
            return final_resp
        except Exception as e:
            log.error(f"Error fetching model insights: {str(e)}")
            return final_resp

    def get_leaderboards(self, period: str, year: int | None, week: int | None):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to get leaderboards"}
        conn = self.postgres_connection()
        try:
            cond, params = self._scope_condition(period, year, week)

            # Top Model by Revenue
            inv_rows = conn.fetch_all_records_with_condition(GFTableNames.invoices, cond, params)
            revenue_by_model = {}
            for r in inv_rows or []:
                mid = r.get("model_id")
                revenue_by_model[mid] = revenue_by_model.get(mid, 0.0) + float(r.get("invoice_amount", 0.0))

            # Costs per model
            cost_rows = conn.fetch_all_records_with_condition(GFTableNames.model_weekly_costs, cond, params)
            cost_by_model = {}
            for r in cost_rows or []:
                mid = r.get("model_id")
                cost_by_model[mid] = cost_by_model.get(mid, 0.0) + float(r.get("total_cost", 0.0))

            # Profits by model
            profit_by_model = {mid: revenue_by_model.get(mid, 0.0) - cost_by_model.get(mid, 0.0) for mid in revenue_by_model.keys()}

            # Most Expensive Chatter
            chatter_rows = conn.fetch_all_records_with_condition(GFTableNames.weekly_chatter_summaries, cond, params)
            payout_by_chatter = {}
            for r in chatter_rows or []:
                cid = r.get("chatter_id")
                payout_by_chatter[cid] = payout_by_chatter.get(cid, 0.0) + float(r.get("total_payout", 0.0))

            def top_n(d: dict, n=1):
                return sorted([{ "id": k, "value": round(v, 2) } for k, v in d.items()], key=lambda x: x["value"], reverse=True)[:n]

            # Add month-specific leaderboards if it's a month scope
            month_leaderboards = {}
            if self._is_month_scope(period):
                month_leaderboards = self._get_month_specific_leaderboards(period, year or datetime.now().year, conn)

            final_resp["status"] = CommonConstants.success
            final_resp["message"] = "Leaderboards fetched"
            final_resp["data"] = {
                "top_model_by_revenue": top_n(revenue_by_model, 1),
                "top_model_by_profit": top_n(profit_by_model, 1),
                "most_expensive_chatter": top_n(payout_by_chatter, 1),
                "month_leaderboards": month_leaderboards
            }
            return final_resp
        except Exception as e:
            log.error(f"Error fetching leaderboards: {str(e)}")
            return final_resp

    def _get_month_specific_leaderboards(self, month: str, year: int, conn):
        """Get month-specific leaderboards like top performers by period, etc."""
        try:
            month_periods = self._get_month_periods(month, year)
            
            # Get top performers for each period
            period_1_leaderboards = self.get_leaderboards(month_periods[0], year, None)
            period_2_leaderboards = self.get_leaderboards(month_periods[1], year, None)
            
            p1_data = period_1_leaderboards.get("data", {}) if isinstance(period_1_leaderboards, dict) else {}
            p2_data = period_2_leaderboards.get("data", {}) if isinstance(period_2_leaderboards, dict) else {}
            
            return {
                "period_1_top_model": p1_data.get("top_model_by_revenue", []),
                "period_2_top_model": p2_data.get("top_model_by_revenue", []),
                "period_1_top_profit": p1_data.get("top_model_by_profit", []),
                "period_2_top_profit": p2_data.get("top_model_by_profit", []),
                "month": month,
                "year": year
            }
        except Exception as e:
            log.error(f"Error calculating month-specific leaderboards: {str(e)}")
            return {}

    def list_invoices(self, model_id: str | None, period: str | None, year: int | None, week: int | None):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to list invoices"}
        conn = self.postgres_connection()
        try:
            conditions = []
            params = []
            if model_id:
                conditions.append("model_id = %s")
                params.append(model_id)
            if period:
                conditions.append("period = %s")
                params.append(period)
            if year:
                conditions.append("year = %s")
                params.append(year)
            if week in [1, 2]:
                conditions.append("week = %s")
                params.append(week)

            condition = " AND ".join(conditions) if conditions else None
            rows = conn.fetch_all_records_with_condition(GFTableNames.invoices, condition, tuple(params)) if condition else conn.fetch_all_records(GFTableNames.invoices)
            final_resp["status"] = CommonConstants.success
            final_resp["message"] = "Invoices fetched"
            final_resp["data"] = rows or []
            return final_resp
        except Exception as e:
            log.error(f"Error listing invoices: {str(e)}")
            return final_resp

    def _auto_invoice_from_cut(self, net_amount: float, model_id: str, conn):
        # If no revenue, invoice should be zero regardless of rules
        if net_amount <= 0:
            return 0.0
        rows = conn.fetch_specified_columns_with_condition(GFTableNames.models, ["earnings_type", "cut_logic"], "model_id = %s", (model_id,))
        if not rows:
            return 0.0
        row = rows[0]
        etype = row.get("earnings_type")
        logic = row.get("cut_logic")
        if isinstance(logic, str):
            try:
                import json as _json
                logic = _json.loads(logic)
            except Exception:
                logic = {}
        if etype == "Type 1":
            threshold = float(logic.get("threshold", 0.0))
            pct = float(logic.get("percentage1", 0.0))
            fixed_else = float(logic.get("fixedAmount", 0.0))
            return round(net_amount * (pct / 100.0), 2) if net_amount >= threshold else round(fixed_else, 2)
        else:
            pct = float(logic.get("percentage2", 0.0) or logic.get("percentage", 0.0))
            return round(net_amount * (pct / 100.0), 2)

    def _invoice_from_reference_children(self, reference_children: list, conn) -> tuple[float, float]:
        """Compute (net_amount_sum, invoice_amount_sum) from reference children rows.
        Each child item should contain: { model_id, net_sales }.
        """
        try:
            total_net = 0.0
            total_invoice = 0.0
            for child in reference_children or []:
                child_mid = child.get("model_id")
                child_net = float(child.get("net_sales", 0.0) or 0.0)
                total_net += child_net
                total_invoice += self._auto_invoice_from_cut(child_net, child_mid, conn)
            return round(total_net, 2), round(total_invoice, 2)
        except Exception as e:
            log.warning(f"Failed computing invoice from reference children: {e}")
            return 0.0, 0.0

    def _notes_with_ref_children(self, existing: str | None, ref_children: list) -> str:
        # Overwrite with fresh children payload (no merge) to avoid stale data
        try:
            return json.dumps({"reference_children": ref_children})
        except Exception as e:
            log.warning(f"Failed to encode reference_children in notes: {e}")
            return json.dumps({"reference_children": []})

    def create_invoice(self, invoice: dict, admin_id: str):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to create invoice"}
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()
            # Auto-calc support incl. reference children
            ref_children = invoice.get("reference_children")
            if isinstance(ref_children, list) and len(ref_children) > 0:
                net, invoice_amount = self._invoice_from_reference_children(ref_children, conn)
                # Persist children in notes JSON for retrieval
                invoice_notes = self._notes_with_ref_children(invoice.get("notes"), ref_children)
            else:
                # Fallback to parent model rule
                net = float(invoice.get("net_amount", 0.0))
                if invoice.get("invoice_amount") is None:
                    invoice_amount = self._auto_invoice_from_cut(net, invoice.get("model_id"), conn)
                else:
                    invoice_amount = float(invoice.get("invoice_amount", 0.0))
                invoice_notes = invoice.get("notes")

            data = {
                "invoice_id": None,
                "model_id": invoice["model_id"],
                "period": invoice["period"],
                "year": int(invoice["year"]),
                "week": invoice.get("week"),
                "net_amount": net,
                "invoice_amount": invoice_amount,
                "status": invoice.get("status", "Unpaid"),
                "notes": invoice_notes,
                "created_by": admin_id,
            }
            res = conn.insert_update_to_table(GFTableNames.invoices, list(data.keys()), list(data.values()), ["model_id", "period", "year", "week"])
            if res.get("status") == "success":
                # Auto trigger staff cost recompute for affected periods
                try:
                    # Determine period and week from invoice data
                    period = invoice.get("period")
                    year = int(invoice.get("year", datetime.now().year))
                    week = invoice.get("week")
                    
                    if period and year:
                        # Recompute for the specific period/week
                        if week in [1, 2]:
                            self.recompute_staff_costs(period, year, week)
                        else:
                            # For period-level invoices, recompute both weeks
                            self.recompute_staff_costs(period, year, 1)
                            self.recompute_staff_costs(period, year, 2)
                            
                except Exception as e:
                    log.warning(f"Failed to trigger staff cost recomputation after invoice creation: {e}")
                else:
                    log.info(f"Auto-triggered staff cost recompute after invoice creation for {period} {year}")
                
                conn.commit_transaction()
                final_resp["status"] = CommonConstants.success
                final_resp["message"] = "Invoice created"
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_201_CREATED, media_type="application/json")
            else:
                conn.rollback_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error creating invoice: {str(e)}")
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")

    def calculate_invoice(self, invoice_data: dict):
        """Calculate invoice amount without saving to database"""
        try:
            conn = self.postgres_connection()
            model_id = invoice_data.get("model_id")
            net_amount = float(invoice_data.get("net_amount", 0.0) or 0.0)
            
            if not model_id:
                return {
                    "status": CommonConstants.failed,
                    "message": "Model ID is required for calculation"
                }
            
            # Check if this is a reference model with reference_children
            ref_children = invoice_data.get("reference_children")
            if isinstance(ref_children, list) and len(ref_children) > 0:
                # For reference models, calculate from children
                total_net, calculated_amount = self._invoice_from_reference_children(ref_children, conn)
                net_amount = total_net  # Use the calculated total from children
            else:
                # For regular models, use the model's own rules
                calculated_amount = self._auto_invoice_from_cut(net_amount, model_id, conn)
            
            return {
                "status": CommonConstants.success,
                "message": "Invoice calculated successfully",
                "data": {
                    "model_id": model_id,
                    "net_amount": net_amount,
                    "calculated_invoice_amount": calculated_amount
                }
            }
        except Exception as e:
            log.error(f"Error calculating invoice: {str(e)}")
            return {
                "status": CommonConstants.failed,
                "message": f"Failed to calculate invoice: {str(e)}"
            }

    def update_invoice(self, invoice_id: str, updates: dict, admin_id: str, auto_calculate: bool = False):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to update invoice"}
        conn = self.postgres_connection()
        try:
            # Optionally auto-compute invoice_amount (and net) from reference children or parent rules
            ref_children = updates.get("reference_children")
            if isinstance(ref_children, list) and len(ref_children) > 0:
                try:
                    net_val, inv_val = self._invoice_from_reference_children(ref_children, conn)
                    updates["net_amount"] = net_val
                    updates["invoice_amount"] = inv_val
                    # Merge/persist children into notes JSON
                    try:
                        inv_row = conn.fetch_single_record_with_condition(
                            GFTableNames.invoices,
                            "invoice_id = %s",
                            (invoice_id,)
                        )
                        existing_notes = inv_row.get("notes") if inv_row else None
                        updates["notes"] = self._notes_with_ref_children(existing_notes, ref_children)
                    except Exception as __e:
                        log.warning(f"Failed to merge ref children into notes: {__e}")
                except Exception as _e:
                    log.warning(f"Failed to auto-calc from reference_children on update: {_e}")
            elif auto_calculate and "invoice_amount" not in updates and "net_amount" in updates:
                # Only auto-calculate invoice_amount during generate operations when it's not being manually set by admin
                try:
                    inv_rows = conn.fetch_all_records_with_condition(
                        GFTableNames.invoices,
                        "invoice_id = %s",
                        (invoice_id,)
                    )
                    if inv_rows and len(inv_rows) > 0:
                        inv_row = inv_rows[0]
                        model_id = inv_row.get("model_id")
                        net_val = float(updates.get("net_amount", inv_row.get("net_amount", 0.0)) or 0.0)
                        auto_amt = self._auto_invoice_from_cut(net_val, model_id, conn)
                        # Inject computed invoice_amount into updates
                        updates["invoice_amount"] = auto_amt
                except Exception as _e:
                    log.warning(f"Failed to auto-calc invoice_amount on update: {_e}")

            # Ensure we don't attempt to update non-existent columns
            if "reference_children" in updates:
                updates.pop("reference_children", None)

            set_parts = []
            params = []
            for k, v in updates.items():
                set_parts.append(f"{k} = %s")
                params.append(v)
            set_parts.append("updated_at = CURRENT_TIMESTAMP")
            set_parts.append("updated_by = %s")
            params.append(admin_id)

            values_condition = ", ".join(set_parts)
            params.append(invoice_id)
            res = conn.update_table(GFTableNames.invoices, values_condition, "invoice_id = %s", tuple(params))
            if res.get("status") == "Success":
                # Auto trigger staff cost recompute for affected periods
                try:
                    # Get the invoice details to determine affected periods
                    invoice_row = conn.fetch_single_record_with_condition(
                        GFTableNames.invoices, 
                        "invoice_id = %s", 
                        (invoice_id,)
                    )
                    if invoice_row:
                        invoice_date = invoice_row.get("invoice_date")
                        if invoice_date:
                            # Determine period and week from invoice date
                            from datetime import datetime, timedelta
                            date_obj = datetime.strptime(invoice_date, "%Y-%m-%d")
                            year = date_obj.year
                            month = date_obj.month
                            day = date_obj.day
                            
                            # Determine period (1st-15th = Period 1, 16th-end = Period 2)
                            if day <= 15:
                                period = f"Period 1"
                                week = 1
                            else:
                                period = f"Period 2"
                                week = 2
                            
                            # Recompute for the specific week
                            self.recompute_staff_costs(period, year, week)
                            
                            # Also recompute for the entire month to ensure consistency
                            month_start = date_obj.replace(day=1)
                            month_end = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
                            
                            # Recompute for both periods of the month
                            self.recompute_staff_costs("Period 1", year, 1)
                            self.recompute_staff_costs("Period 2", year, 2)
                            
                except Exception as e:
                    log.warning(f"Failed to trigger staff cost recomputation after invoice update: {e}")
                else:
                    log.info(f"Auto-triggered staff cost recompute after invoice update for {period} {year}")
                
                final_resp["status"] = CommonConstants.success
                final_resp["message"] = "Invoice updated"
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_200_OK, media_type="application/json")
            else:
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")
        except Exception as e:
            log.error(f"Error updating invoice: {str(e)}")
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")

    def recompute_staff_costs(self, period: str, year: int | None, week: int | None):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to recompute staff costs"}
        conn = self.postgres_connection()
        try:
            # Load managers (Managers + Team Leaders) and assistants
            mgr_rows = conn.fetch_all_records_with_condition("managers", "status = %s AND soft_delete = %s", ("Active", "active"))
            asst_rows = conn.fetch_all_records("assistants")

            # For each model and scope, compute TL/Manager/Assistant costs based on invoices (net)
            cond, params = self._scope_condition(period, year, week)
            inv_rows = conn.fetch_all_records_with_condition(GFTableNames.invoices, cond, params)

            # Group net by model - include both reference models and their children separately
            net_by_model = {}
            for r in inv_rows or []:
                try:
                    mid = r.get("model_id")
                    net_amount = float(r.get("net_amount", 0.0) or 0.0)
                    
                    # Always include the invoice model itself
                    net_by_model[mid] = net_by_model.get(mid, 0.0) + net_amount
                    
                    # Also check for reference children and include them separately
                    notes = r.get("notes")
                    if notes:
                        try:
                            j = json.loads(notes)
                            if isinstance(j, dict):
                                ref_children = j.get("reference_children")
                                if isinstance(ref_children, list) and len(ref_children) > 0:
                                    # Include children with their individual net sales
                                    for child in ref_children:
                                        cmid = child.get("model_id")
                                        cnet = float(child.get("net_sales", 0.0) or 0.0)
                                        if cmid:
                                            net_by_model[cmid] = net_by_model.get(cmid, 0.0) + cnet
                        except Exception:
                            pass
                except Exception as e:
                    # Fallback to parent net on any error
                    mid = r.get("model_id")
                    net_by_model[mid] = net_by_model.get(mid, 0.0) + float(r.get("net_amount", 0.0))

            # Helper: Apply manager/TL rule to a net
            def apply_rule(net: float, row: dict) -> float:
                salary_type = (row.get("salary_type") or "Commission-based").strip()
                if salary_type == "Commission-based":
                    threshold = float(row.get("revenue_threshold", 0.0) or 0.0)
                    pct = float(row.get("commission_rate", 0.0) or 0.0)
                    fixed_else = float(row.get("fixed_salary", 0.0) or 0.0)
                    if net >= threshold:
                        return round(net * (pct / 100.0), 2)
                    return round(fixed_else, 2)
                # Future: if TL/Manager salary_type == Fixed, decide how to attribute per model
                return 0.0

            # Compute per model TL and Manager costs
            tl_costs = {}
            mgr_costs = {}

            # Managers: apply per model using models.manager_name (by ID/name lookup)
            managers_only = [m for m in (mgr_rows or []) if (m.get("role") or "").strip() == "Manager"]
            managers_by_name = { (m.get("name") or "").strip(): m for m in managers_only }
            managers_by_id = { m.get("manager_id"): m for m in managers_only }
            # Prefer manager_id on models; fallback to manager_name
            model_mgr_rows = conn.fetch_specified_columns("models", ["model_id", "manager_id", "manager_name"]) or []
            for mr in model_mgr_rows:
                mid = mr.get("model_id")
                if not mid:
                    continue
                mrow = None
                mgr_id = mr.get("manager_id")
                if mgr_id:
                    mrow = managers_by_id.get(mgr_id)
                if not mrow:
                    mgr_name = (mr.get("manager_name") or "").strip()
                    if mgr_name:
                        mrow = managers_by_name.get(mgr_name)
                if not mrow:
                    continue
                net = net_by_model.get(mid, 0.0)
                if net <= 0:
                    continue
                mgr_costs[mid] = mgr_costs.get(mid, 0.0) + apply_rule(net, mrow)

            # TL assignment via models.team_leader_id (preferred) with fallback to name
            model_rows = conn.fetch_specified_columns("models", ["model_id", "team_leader_id", "team_leader"]) or []
            tl_table = conn.fetch_specified_columns(GFTableNames.team_leaders, ["team_leader_id", "name", "salary_type", "revenue_threshold", "commission_rate", "fixed_salary"]) or []
            team_leaders_by_id = { r.get("team_leader_id"): r for r in tl_table }
            team_leaders_by_name = { (r.get("name") or "").strip(): r for r in tl_table }
            managers_by_name = { (m.get("name") or "").strip(): m for m in (mgr_rows or []) }
            managers_by_id = { m.get("manager_id"): m for m in (mgr_rows or []) }
            for mr in model_rows:
                mid = mr.get("model_id")
                if not mid:
                    continue
                tl_row = None
                tl_id = mr.get("team_leader_id")
                if tl_id:
                    tl_row = managers_by_id.get(tl_id) or team_leaders_by_id.get(tl_id)
                if not tl_row:
                    tl_name = (mr.get("team_leader") or "").strip()
                    if tl_name:
                        tl_row = team_leaders_by_name.get(tl_name) or managers_by_name.get(tl_name)
                if not tl_row:
                    continue
                net = net_by_model.get(mid, 0.0)
                tl_costs[mid] = tl_costs.get(mid, 0.0) + apply_rule(net, tl_row)

            # Assistant costs: split fixed salary across all models, adjusted by period frequency
            asst_per_model = {}
            num_models = max(1, len(net_by_model))
            for a in asst_rows or []:
                fixed = float(a.get("fixed_salary", 0.0) or 0.0)
                freq = (a.get("salary_period") or "Monthly").lower()
                # Compute share for the current scope
                if week in [1, 2]:
                    if freq == "weekly":
                        share = fixed
                    elif freq == "bi-weekly":
                        share = round(fixed / 2.0, 2)
                    else:
                        share = round(fixed / 4.0, 2)  # monthly -> per week approximation
                else:
                    # period level (bi-weekly)
                    if freq == "weekly":
                        share = round(fixed * 2.0, 2)
                    elif freq == "bi-weekly":
                        share = fixed
                    else:
                        share = round(fixed / 2.0, 2)  # monthly -> period
                per_model_share = round(share / num_models, 2)
                for mid in net_by_model.keys():
                    asst_per_model[mid] = asst_per_model.get(mid, 0.0) + per_model_share

            # Update model_weekly_costs for each model
            # Derive chatter cost FROM daily_costs (scoped), grouped by model and week
            # Use date-range scoping to avoid relying on period/year/week columns in daily_costs
            dc_rows = []
            try:
                yr = year or datetime.now().year
                dr = self.salary_helper.get_period_date_range(period, yr)
                p_start = dr["start"].date()
                p_end = dr["end"].date()
                if week in [1, 2]:
                    week1_end = p_start + timedelta(days=6)
                    if week == 1:
                        d_start, d_end = p_start, min(week1_end, p_end)
                    else:
                        d_start, d_end = p_start + timedelta(days=7), p_end
                else:
                    d_start, d_end = p_start, p_end
                condition = "cost_date BETWEEN %s AND %s"
                params = (d_start, d_end)
                dc_rows = conn.fetch_all_records_with_condition(GFTableNames.daily_costs, condition, params)
                log.info(f"Recompute scope daily_costs rows: {len(dc_rows)} for {period} {yr} week={week}")
            except Exception:
                dc_rows = []
            chatter_cost_map = {}
            for r in dc_rows or []:
                mid = r.get("model_id")
                w = r.get("week")
                amt = float(r.get("total_cost", 0.0) or 0.0)
                if mid and w in [1, 2]:
                    key = (mid, w)
                    chatter_cost_map[key] = chatter_cost_map.get(key, 0.0) + amt

            # Note: Removed reference model redistribution logic to prevent double counting
            # Each model (including reference models) should show its own individual chatter salary
            # as stored in daily_costs table, without redistribution to child models

            log.info(f"net_by_model keys: {list(net_by_model.keys())}")
            log.info(f"chatter_cost_map keys: {list(chatter_cost_map.keys())}")
            for mid in net_by_model.keys():
                for target_week in ([week] if week in [1, 2] else [1, 2]):
                    chatter_total = chatter_cost_map.get((mid, target_week), 0.0)
                    tl_total = tl_costs.get(mid, 0.0)
                    mgr_total = mgr_costs.get(mid, 0.0)
                    asst_total = asst_per_model.get(mid, 0.0)
                    total = round(chatter_total + tl_total + mgr_total + asst_total, 2)

                    # Upsert without requiring a DB unique constraint: UPDATE first, INSERT if no row
                    yr = year or datetime.now().year
                    log.info(f"Upsert model_weekly_costs key (model_id={mid}, period={period}, year={yr}, week={target_week}) totals: chatter={chatter_total}, tl={tl_total}, mgr={mgr_total}, asst={asst_total}, total={total}")
                    update_query = (
                        f"UPDATE {GFTableNames.model_weekly_costs} "
                        "SET chatter_cost_total = %s, tl_cost_total = %s, manager_cost_total = %s, "
                        "assistant_cost_total = %s, total_cost = %s, updated_at = %s "
                        "WHERE model_id = %s AND period = %s AND year = %s AND week = %s"
                    )
                    update_vals = [
                        round(chatter_total, 2),
                        round(tl_total, 2),
                        round(mgr_total, 2),
                        round(asst_total, 2),
                        total,
                        datetime.now(),
                        mid,
                        period,
                        yr,
                        target_week,
                    ]
                    updated_rows = conn.execute_query_for_trigger(update_query, result=True, data=update_vals)
                    log.info(f"model_weekly_costs update rowcount = {updated_rows}")
                    if not updated_rows or (isinstance(updated_rows, int) and updated_rows == 0):
                        # Deterministic id based on key
                        key_hash = abs(hash((mid, period, yr, target_week))) % 1000000000000
                        mwc_id = f"mwc_{key_hash}"
                        # Use direct SQL INSERT to bypass trigger expecting cost_id (ensure no conflicting trigger)
                        insert_sql = (
                            f"INSERT INTO {GFTableNames.model_weekly_costs} "
                            "(id, model_id, period, year, week, chatter_cost_total, tl_cost_total, manager_cost_total, assistant_cost_total, total_cost, updated_at) "
                            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
                        )
                        insert_vals = [
                            mwc_id,
                            mid,
                            period,
                            yr,
                            target_week,
                            round(chatter_total, 2),
                            round(tl_total, 2),
                            round(mgr_total, 2),
                            round(asst_total, 2),
                            total,
                            datetime.now(),
                        ]
                        ok = conn.execute_query_for_trigger(insert_sql, result=True, data=insert_vals)
                        log.info(f"model_weekly_costs direct insert rowcount = {ok} id={mwc_id}")

            # NEW: Save individual manager and team leader salaries to their respective tables
            self._save_manager_salaries(conn, mgr_rows, period, year, week, net_by_model, mgr_costs, tl_costs)
            self._save_assistant_salaries(conn, asst_rows, period, year, week, asst_per_model)

            final_resp["status"] = CommonConstants.success
            final_resp["message"] = "Staff costs recomputed"
            return final_resp
        except Exception as e:
            log.error(f"Error recomputing staff costs: {str(e)}")
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")

    def get_model_cost_breakdown(self, model_id: str, period: str, year: int | None, week: int | None):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to get cost breakdown"}
        conn = self.postgres_connection()
        try:
            # Build scope
            scope_cond, scope_params = self._scope_condition(period, year, week)

            # Check if this is a reference model and get child models for manager/TL/assistant cost calculation
            child_model_ids = []
            try:
                inv_cond = f"model_id = %s AND {scope_cond}"
                inv_params = (model_id,) + scope_params
                inv_rows = conn.fetch_all_records_with_condition(GFTableNames.invoices, inv_cond, inv_params)
                if inv_rows:
                    notes = inv_rows[0].get("notes")
                    if notes:
                        try:
                            j = json.loads(notes)
                            children = j.get("reference_children") if isinstance(j, dict) else None
                            if isinstance(children, list) and len(children) > 0:
                                child_model_ids = [c.get("model_id") for c in children if c.get("model_id")]
                        except Exception:
                            pass
            except Exception:
                pass

            # For chatter cost: always use the requested model_id directly
            chatter_cond = f"model_id = %s AND {scope_cond}"
            chatter_params = (model_id,) + scope_params
            chatter_rows = conn.fetch_all_records_with_condition(GFTableNames.model_weekly_costs, chatter_cond, chatter_params)
            chatter = sum(float(r.get("chatter_cost_total", 0.0)) for r in chatter_rows or [])

            # For manager/TL/assistant costs: use child models if this is a reference model, otherwise use the model itself
            if child_model_ids:
                # Reference model: calculate manager/TL/assistant costs from child models
                placeholders = ",".join(["%s"] * len(child_model_ids))
                staff_cond = f"model_id IN ({placeholders}) AND {scope_cond}"
                staff_params = tuple(child_model_ids) + scope_params
                staff_rows = conn.fetch_all_records_with_condition(GFTableNames.model_weekly_costs, staff_cond, staff_params)
            else:
                # Regular model: use its own costs
                staff_rows = chatter_rows

            tl = sum(float(r.get("tl_cost_total", 0.0)) for r in staff_rows or [])
            mgr = sum(float(r.get("manager_cost_total", 0.0)) for r in staff_rows or [])
            asst = sum(float(r.get("assistant_cost_total", 0.0)) for r in staff_rows or [])
            total = chatter + tl + mgr + asst

            final_resp["status"] = CommonConstants.success
            final_resp["message"] = "Cost breakdown fetched"
            final_resp["data"] = {
                "model_id": model_id,
                "period": period,
                "year": year or datetime.now().year,
                "chatter_cost": round(chatter, 2),
                "tl_cost": round(tl, 2),
                "manager_cost": round(mgr, 2),
                "assistant_cost": round(asst, 2),
                "total_cost": round(total, 2),
            }
            return final_resp
        except Exception as e:
            log.error(f"Error fetching cost breakdown: {str(e)}")
            return final_resp

    def _save_manager_salaries(self, conn, mgr_rows, period, year, week, net_by_model, mgr_costs, tl_costs):
        """Save calculated manager and team leader salaries to manager_salaries table"""
        try:
            # Get model assignments for team leaders and managers
            model_rows = conn.fetch_specified_columns("models", ["model_id", "team_leader_id", "manager_id", "team_leader", "manager_name"])
            tl_assignments = {}
            mgr_assignments = {}
            
            # Create name to ID mapping for managers
            manager_name_to_id = {}
            for manager in mgr_rows or []:
                manager_name_to_id[manager.get("name")] = manager.get("manager_id")
            
            # COMMENTED OUT: Reference model children mappings logic
            # This was added to calculate manager/TL salaries for child models of reference models
            # Since insights page now only shows regular models, this logic is not needed
            # Uncomment this section if reference models need to be shown in insights page in the future
            """
            reference_children_map = {}
            try:
                # Get all invoices for this period to find reference children
                cond, params = self._scope_condition(period, year, week)
                inv_rows = conn.fetch_all_records_with_condition(GFTableNames.invoices, cond, params)
                
                for r in inv_rows or []:
                    notes = r.get("notes")
                    if notes:
                        try:
                            j = json.loads(notes)
                            if isinstance(j, dict):
                                ref_children = j.get("reference_children")
                                if isinstance(ref_children, list) and len(ref_children) > 0:
                                    parent_model_id = r.get("model_id")
                                    if parent_model_id:
                                        reference_children_map[parent_model_id] = [child.get("model_id") for child in ref_children if child.get("model_id")]
                        except Exception:
                            pass
            except Exception:
                pass
            """
            
            for mr in model_rows or []:
                mid = mr.get("model_id")
                tl_id = mr.get("team_leader_id")
                mgr_id = mr.get("manager_id")
                tl_name = mr.get("team_leader")
                mgr_name = mr.get("manager_name")
                
                # Team leader assignments - try ID first, then name
                if tl_id and mid:
                    if tl_id not in tl_assignments:
                        tl_assignments[tl_id] = []
                    tl_assignments[tl_id].append(mid)
                elif tl_name and mid:
                    # Find TL ID by name
                    for manager in mgr_rows or []:
                        if manager.get("name") == tl_name and manager.get("role") == "Team Leader":
                            tl_id = manager.get("manager_id")
                            if tl_id not in tl_assignments:
                                tl_assignments[tl_id] = []
                            tl_assignments[tl_id].append(mid)
                            break
                
                # Manager assignments - try ID first, then name
                if mgr_id and mid:
                    if mgr_id not in mgr_assignments:
                        mgr_assignments[mgr_id] = []
                    mgr_assignments[mgr_id].append(mid)
                elif mgr_name and mid:
                    # Find manager ID by name
                    mgr_id = manager_name_to_id.get(mgr_name)
                    if mgr_id:
                        if mgr_id not in mgr_assignments:
                            mgr_assignments[mgr_id] = []
                        mgr_assignments[mgr_id].append(mid)
            
            # COMMENTED OUT: Reference model manager/TL assignment logic
            # This was added to assign managers/TLs from reference models to their child models
            # Since insights page now only shows regular models, this logic is not needed
            # Uncomment this section if reference models need to be shown in insights page in the future
            """
            for parent_model_id, child_model_ids in reference_children_map.items():
                # Get the parent model's manager/TL assignments
                parent_model_row = None
                for mr in model_rows or []:
                    if mr.get("model_id") == parent_model_id:
                        parent_model_row = mr
                        break
                
                if parent_model_row:
                    parent_tl_id = parent_model_row.get("team_leader_id")
                    parent_mgr_id = parent_model_row.get("manager_id")
                    parent_tl_name = parent_model_row.get("team_leader")
                    parent_mgr_name = parent_model_row.get("manager_name")
                    
                    # Assign parent's TL to all child models
                    if parent_tl_id:
                        for child_mid in child_model_ids:
                            if parent_tl_id not in tl_assignments:
                                tl_assignments[parent_tl_id] = []
                            if child_mid not in tl_assignments[parent_tl_id]:
                                tl_assignments[parent_tl_id].append(child_mid)
                    elif parent_tl_name:
                        # Find TL ID by name and assign to children
                        for manager in mgr_rows or []:
                            if manager.get("name") == parent_tl_name and manager.get("role") == "Team Leader":
                                tl_id = manager.get("manager_id")
                                for child_mid in child_model_ids:
                                    if tl_id not in tl_assignments:
                                        tl_assignments[tl_id] = []
                                    if child_mid not in tl_assignments[tl_id]:
                                        tl_assignments[tl_id].append(child_mid)
                                break
                    
                    # Assign parent's manager to all child models
                    if parent_mgr_id:
                        for child_mid in child_model_ids:
                            if parent_mgr_id not in mgr_assignments:
                                mgr_assignments[parent_mgr_id] = []
                            if child_mid not in mgr_assignments[parent_mgr_id]:
                                mgr_assignments[parent_mgr_id].append(child_mid)
                    elif parent_mgr_name:
                        # Find manager ID by name and assign to children
                        mgr_id = manager_name_to_id.get(parent_mgr_name)
                        if mgr_id:
                            for child_mid in child_model_ids:
                                if mgr_id not in mgr_assignments:
                                    mgr_assignments[mgr_id] = []
                                if child_mid not in mgr_assignments[mgr_id]:
                                    mgr_assignments[mgr_id].append(child_mid)
            """

            for manager in mgr_rows or []:
                manager_id = manager.get("manager_id")
                role = manager.get("role", "").strip()
                
                # Calculate total salary for this manager/team leader
                total_salary = 0.0
                week1_salary = 0.0
                week2_salary = 0.0
                
                if role == "Manager":
                    # Managers get commission only from their assigned models with revenue in this period
                    assigned_models = mgr_assignments.get(manager_id, [])
                    for mid in assigned_models:
                        # Only include models that have revenue in this period
                        if mid in net_by_model and net_by_model[mid] > 0:
                            # Get actual weekly costs from model_weekly_costs table
                            week1_cost = conn.fetch_all_records_with_condition(
                                GFTableNames.model_weekly_costs,
                                "model_id = %s AND period = %s AND year = %s AND week = %s",
                                (mid, period, year or datetime.now().year, 1)
                            )
                            week2_cost = conn.fetch_all_records_with_condition(
                                GFTableNames.model_weekly_costs,
                                "model_id = %s AND period = %s AND year = %s AND week = %s",
                                (mid, period, year or datetime.now().year, 2)
                            )
                            
                            if week1_cost and len(week1_cost) > 0:
                                week1_salary += float(week1_cost[0].get("manager_cost_total", 0.0))
                            if week2_cost and len(week2_cost) > 0:
                                week2_salary += float(week2_cost[0].get("manager_cost_total", 0.0))
                    
                    total_salary = week1_salary + week2_salary
                    
                elif role == "Team Leader":
                    # Team leaders get commission only from their assigned models with revenue in this period
                    assigned_models = tl_assignments.get(manager_id, [])
                    for mid in assigned_models:
                        # Only include models that have revenue in this period
                        if mid in net_by_model and net_by_model[mid] > 0:
                            # Get actual weekly costs from model_weekly_costs table
                            week1_cost = conn.fetch_all_records_with_condition(
                                GFTableNames.model_weekly_costs,
                                "model_id = %s AND period = %s AND year = %s AND week = %s",
                                (mid, period, year or datetime.now().year, 1)
                            )
                            week2_cost = conn.fetch_all_records_with_condition(
                                GFTableNames.model_weekly_costs,
                                "model_id = %s AND period = %s AND year = %s AND week = %s",
                                (mid, period, year or datetime.now().year, 2)
                            )
                            
                            if week1_cost and len(week1_cost) > 0:
                                week1_salary += float(week1_cost[0].get("tl_cost_total", 0.0))
                            if week2_cost and len(week2_cost) > 0:
                                week2_salary += float(week2_cost[0].get("tl_cost_total", 0.0))
                    
                    total_salary = week1_salary + week2_salary

                # Save to manager_salaries table
                # Only save if there's actual salary to pay
                if total_salary > 0:
                    conn.insert_update_to_table(
                        GFTableNames.manager_salaries,
                        [
                            "manager_id", "period", "year", 
                            "week1_salary", "week2_salary", "total_salary", 
                            "payment_status"
                        ],
                        [
                            manager_id, 
                            period, 
                            year or datetime.now().year,
                            round(week1_salary, 2),
                            round(week2_salary, 2),
                            round(total_salary, 2),
                            "Not Paid"  # Default status
                        ],
                        ["manager_id", "period", "year"]
                    )
                    log.info(f"Saved salary for {role} {manager_id}: ${total_salary:.2f} for {period} {year}")
                    
        except Exception as e:
            log.error(f"Error saving manager salaries: {str(e)}")

    def _save_assistant_salaries(self, conn, asst_rows, period, year, week, asst_per_model):
        """Save calculated assistant salaries to assistant_salaries table"""
        try:
            # Calculate total assistant cost across all models
            total_assistant_cost = sum(asst_per_model.values())
            num_models = max(1, len(asst_per_model))
            
            for assistant in asst_rows or []:
                assistant_id = assistant.get("assistant_id")
                fixed_salary = float(assistant.get("fixed_salary", 0.0) or 0.0)
                salary_period = (assistant.get("salary_period") or "Monthly").lower()
                
                # Calculate salary based on period frequency
                if week in [1, 2]:
                    if salary_period == "weekly":
                        salary = fixed_salary
                    elif salary_period == "bi-weekly":
                        salary = round(fixed_salary / 2.0, 2)
                    else:  # monthly
                        salary = round(fixed_salary / 4.0, 2)
                else:
                    # period level (bi-weekly)
                    if salary_period == "weekly":
                        salary = round(fixed_salary * 2.0, 2)
                    elif salary_period == "bi-weekly":
                        salary = fixed_salary
                    else:  # monthly
                        salary = round(fixed_salary / 2.0, 2)
                
                # Split between weeks
                week1_salary = salary / 2.0
                week2_salary = salary / 2.0
                
                # Save to assistant_salaries table
                conn.insert_update_to_table(
                    GFTableNames.assistant_salaries,
                    [
                        "assistant_id", "period", "year", 
                        "week1_salary", "week2_salary", "total_salary", 
                        "payment_status"
                    ],
                    [
                        assistant_id, 
                        period, 
                        year or datetime.now().year,
                        round(week1_salary, 2),
                        round(week2_salary, 2),
                        round(salary, 2),
                        "Not Paid"  # Default status
                    ],
                    ["assistant_id", "period", "year"]
                )
                log.info(f"Saved salary for Assistant {assistant_id}: ${salary:.2f} for {period} {year}")
                
        except Exception as e:
            log.error(f"Error saving assistant salaries: {str(e)}")

    def save_agency_insights(self, data: dict) -> dict:
        """Save agency insights data for a specific period"""
        try:
            conn = self.postgres_connection()
            
            # Insert or update agency insights
            conn.insert_update_to_table(
                GFTableNames.agency_insights,
                [
                    "period", "year", "week", "revenue", "real_revenue", 
                    "cost", "profit", "real_profit", "created_at", "updated_at"
                ],
                [
                    data.get("period"),
                    data.get("year"),
                    data.get("week"),
                    data.get("revenue", 0.0),
                    data.get("real_revenue", 0.0),
                    data.get("cost", 0.0),
                    data.get("profit", 0.0),
                    data.get("real_profit", 0.0),
                    datetime.now(),
                    datetime.now()
                ],
                ["period", "year", "week"]
            )
            
            log.info(f"Saved agency insights for {data.get('period')} {data.get('year')} week {data.get('week')}")
            return {"status": "Success", "message": "Agency insights saved successfully"}
            
        except Exception as e:
            log.error(f"Error saving agency insights: {str(e)}")
            return {"status": "Error", "message": f"Failed to save agency insights: {str(e)}"}

    def save_model_insights(self, data: dict) -> dict:
        """Save model insights data for a specific period"""
        try:
            conn = self.postgres_connection()
            
            # Insert or update model insights
            conn.insert_update_to_table(
                GFTableNames.model_insights,
                [
                    "model_id", "period", "year", "week", "net_sales", 
                    "invoice_value", "invoice_status", "revenue", "profit", 
                    "created_at", "updated_at"
                ],
                [
                    data.get("model_id"),
                    data.get("period"),
                    data.get("year"),
                    data.get("week"),
                    data.get("net_sales", 0.0),
                    data.get("invoice_value", 0.0),
                    data.get("invoice_status", "Unpaid"),
                    data.get("revenue", 0.0),
                    data.get("profit", 0.0),
                    datetime.now(),
                    datetime.now()
                ],
                ["model_id", "period", "year", "week"]
            )
            
            log.info(f"Saved model insights for Model {data.get('model_id')} - {data.get('period')} {data.get('year')} week {data.get('week')}")
            return {"status": "Success", "message": "Model insights saved successfully"}
            
        except Exception as e:
            log.error(f"Error saving model insights: {str(e)}")
            return {"status": "Error", "message": f"Failed to save model insights: {str(e)}"}

    def get_saved_agency_insights(self, period: str, year: int, week: int = None) -> dict:
        """Get saved agency insights data for a specific period"""
        try:
            conn = self.postgres_connection()
            
            # Build condition for query
            condition = "period = %s AND year = %s"
            params = [period, year]
            
            if week is not None:
                condition += " AND week = %s"
                params.append(week)
            else:
                condition += " AND week IS NULL"
            
            # Fetch saved data
            rows = conn.fetch_all_records_with_condition(
                GFTableNames.agency_insights, 
                condition, 
                params
            )
            
            if rows and len(rows) > 0:
                data = rows[0]
                return {
                    "status": "Success",
                    "data": {
                        "revenue": float(data.get("revenue", 0.0)),
                        "real_revenue": float(data.get("real_revenue", 0.0)),
                        "cost": float(data.get("cost", 0.0)),
                        "profit": float(data.get("profit", 0.0)),
                        "real_profit": float(data.get("real_profit", 0.0)),
                        "period": data.get("period"),
                        "year": data.get("year"),
                        "week": data.get("week")
                    }
                }
            else:
                return {"status": "NotFound", "message": "No saved data found for this period"}
                
        except Exception as e:
            log.error(f"Error getting saved agency insights: {str(e)}")
            return {"status": "Error", "message": f"Failed to get saved agency insights: {str(e)}"}

    def get_saved_model_insights(self, model_id: str, period: str, year: int, week: int = None) -> dict:
        """Get saved model insights data for a specific period"""
        try:
            conn = self.postgres_connection()
            
            # Build condition for query
            condition = "model_id = %s AND period = %s AND year = %s"
            params = [model_id, period, year]
            
            if week is not None:
                condition += " AND week = %s"
                params.append(week)
            else:
                condition += " AND week IS NULL"
            
            # Fetch saved data
            rows = conn.fetch_all_records_with_condition(
                GFTableNames.model_insights, 
                condition, 
                params
            )
            
            if rows and len(rows) > 0:
                data = rows[0]
                return {
                    "status": "Success",
                    "data": {
                        "model_id": data.get("model_id"),
                        "net_sales": float(data.get("net_sales", 0.0)),
                        "invoice_value": float(data.get("invoice_value", 0.0)),
                        "invoice_status": data.get("invoice_status"),
                        "revenue": float(data.get("revenue", 0.0)),
                        "profit": float(data.get("profit", 0.0)),
                        "period": data.get("period"),
                        "year": data.get("year"),
                        "week": data.get("week")
                    }
                }
            else:
                return {"status": "NotFound", "message": "No saved data found for this model and period"}
                
        except Exception as e:
            log.error(f"Error getting saved model insights: {str(e)}")
            return {"status": "Error", "message": f"Failed to get saved model insights: {str(e)}"}
