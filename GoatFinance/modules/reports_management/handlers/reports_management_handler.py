from scripts.utils.common_utils import PostgresConnection
from scripts.logging.log_module import logger as log
from scripts.constants.app_constants import GFTableNames, CommonConstants
from modules.reports_management.models.reports_management_models import WeekReportSaveRequest
from scripts.helpers.salary_calculation_helper import SalaryCalculationHelper
from fastapi import Response, status
import json
from datetime import datetime, timedelta


class ReportsManagementHandler:
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

    def _period_week_dates(self, period: str, year: int, week: int):
        dr = self.salary_helper.get_period_date_range(period, year)
        start = dr["start"].date()
        end = dr["end"].date()
        week1_end = start + timedelta(days=6)
        if week == 1:
            return start, min(week1_end, end)
        else:
            w2_start = start + timedelta(days=7)
            return w2_start, end

    def get_salary_periods(self, year: int | None):
        try:
            periods = self.salary_helper.generate_salary_periods(year)
            current_period = self.salary_helper.get_current_salary_period()
            # include date ranges and week ranges
            enriched = []
            yr = year or datetime.now().year
            for p in periods:
                dr = self.salary_helper.get_period_date_range(p, yr)
                w1s, w1e = dr["start"].date(), (dr["start"] + timedelta(days=6)).date()
                w2s, w2e = (dr["start"] + timedelta(days=7)).date(), dr["end"].date()
                enriched.append({
                    "label": p,
                    "year": yr,
                    "start": str(dr["start"].date()),
                    "end": str(dr["end"].date()),
                    "week1_start": str(w1s),
                    "week1_end": str(min(w1e, dr["end"].date())),
                    "week2_start": str(w2s),
                    "week2_end": str(w2e)
                })
            return {
                "status": CommonConstants.success,
                "message": "Salary periods retrieved successfully",
                "data": {"periods": enriched, "current_period": current_period, "year": yr},
            }
        except Exception as e:
            log.error(f"Error fetching salary periods: {str(e)}")
            return Response(
                content=json.dumps({"status": CommonConstants.failed, "message": "Failed to get salary periods"}),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                media_type="application/json",
            )

    def get_week_report(self, chatter_id: str, period: str, year: int | None, week: int):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to get week report"}
        try:
            conn = self.postgres_connection()
            conn.begin_transaction()
            
            year = year or datetime.now().year
            start, end = self._period_week_dates(period, year, week)

            condition = "work_date BETWEEN %s AND %s AND chatter_id = %s"
            params = (start, end, chatter_id)
            rows = conn.fetch_all_records_with_condition(GFTableNames.work_reports, condition, params)
            # Enrich with computed totals per row (hourly share + commission)
            enriched = []
            # Preload per-day hourly split and commission by model
            costs = conn.fetch_all_records_with_condition(GFTableNames.daily_costs, "cost_date BETWEEN %s AND %s AND chatter_id = %s", (start, end, chatter_id))
            cost_map = {}
            for c in costs or []:
                key = (c.get("cost_date"), c.get("model_id"))
                cost_map[key] = {
                    "total_cost": float(c.get("total_cost", 0.0)),
                    "hourly_cost": float(c.get("hourly_cost", 0.0)),
                    "commission": float(c.get("commission", 0.0))
                }
            for r in rows or []:
                key = (r.get("work_date"), r.get("model_id"))
                cost_data = cost_map.get(key, {
                    "total_cost": 0.0,
                    "hourly_cost": 0.0,
                    "commission": 0.0
                })
                
                # Parse reference_children if it exists
                reference_children = None
                if r.get("reference_children"):
                    try:
                        import json as _json
                        ref_data = r.get("reference_children")
                        # Handle double-encoded JSON
                        if isinstance(ref_data, str):
                            # Try to parse it
                            parsed = _json.loads(ref_data)
                            # If it's still a string, parse it again
                            if isinstance(parsed, str):
                                reference_children = _json.loads(parsed)
                            else:
                                reference_children = parsed
                        else:
                            reference_children = ref_data
                    except Exception as e:
                        log.error(f"Error parsing reference_children: {e}")
                        reference_children = None
                
                enriched.append({
                    **r, 
                    "row_total": round(cost_data["total_cost"], 2),
                    "hourly_pay": round(cost_data["hourly_cost"], 2),
                    "commission": round(cost_data["commission"], 2),
                    "reference_children": reference_children
                })
            
            final_resp["status"] = CommonConstants.success
            final_resp["message"] = "Week report fetched"
            final_resp["data"] = enriched
            
            conn.commit_transaction()
            return final_resp
        except Exception as e:
            if 'conn' in locals():
                conn.rollback_transaction()
            log.error(f"Error fetching week report: {str(e)}")
            return final_resp

    def save_week_report(self, payload: WeekReportSaveRequest, admin_id: str):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to save week report"}
        conn = self.postgres_connection()
        try:
            # Validate period dates
            start, end = self._period_week_dates(payload.period, payload.year, payload.week)

            # Upsert work rows per date/model
            conn.begin_transaction()

            # Collect daily totals to compute hourly splits per day
            day_models_map = {}
            day_hours_total = {}
            day_hours_per_model = {}
            day_commission_per_model = {}

            for day in payload.date_rows:
                work_date = datetime.strptime(day["date"], "%Y-%m-%d").date()
                if work_date < start or work_date > end:
                    continue
                rows = day.get("rows", [])
                # validations
                if any(float(r.get("net_sales", 0.0)) < 0 for r in rows):
                    raise ValueError("Net sales cannot be negative")
                if any(int(r.get("hours", 0)) < 0 or int(r.get("hours", 0)) > 24 for r in rows):
                    raise ValueError("Hours per row must be between 0 and 24")
                distinct_models = list({r["model_id"] for r in rows if r.get("hours", 0) > 0})
                total_hours = sum(max(0, int(r.get("hours", 0))) for r in rows)
                if total_hours > 24:
                    raise ValueError("Total hours per day per chatter cannot exceed 24")
                day_models_map[work_date] = distinct_models
                day_hours_total[work_date] = total_hours

                # Upsert work_reports rows and compute commissions
                day_commission_per_model[work_date] = {}
                day_hours_per_model[work_date] = {}
                for r in rows:
                    model_id = r["model_id"]
                    hours = max(0, int(r.get("hours", 0)))
                    net_sales = float(r.get("net_sales", 0.0))
                    reference_children = r.get("reference_children", [])
                    
                    # Prepare reference_children data for storage
                    reference_children_json = None
                    if reference_children and len(reference_children) > 0:
                        try:
                            import json as _json
                            # Check if it's already a string (double-encoded)
                            if isinstance(reference_children, str):
                                # Try to parse it first to ensure it's valid JSON
                                parsed = _json.loads(reference_children)
                                reference_children_json = _json.dumps(parsed)
                            else:
                                # It's already a Python object, just stringify it
                                reference_children_json = _json.dumps(reference_children)
                        except Exception as e:
                            log.error(f"Error processing reference_children: {e}")
                            reference_children_json = None
                    
                    insert_status = conn.insert_update_to_table(
                        GFTableNames.work_reports,
                        [
                            "report_id",
                            "work_date",
                            "chatter_id",
                            "model_id",
                            "hours",
                            "net_sales",
                            "period",
                            "year",
                            "week",
                            "updated_by",
                            "reference_children",
                        ],
                        [
                            None,
                            work_date,
                            payload.chatter_id,
                            model_id,
                            hours,
                            net_sales,
                            payload.period,
                            payload.year,
                            payload.week,
                            admin_id,
                            reference_children_json,
                        ],
                        ["work_date", "chatter_id", "model_id"],
                    )
                    
                    # Commission calculation: Handle reference models differently
                    commission = 0.0
                    if reference_children and len(reference_children) > 0:
                        # For reference models, calculate commission based on referenced children
                        for child in reference_children:
                            child_model_id = child.get("model_id")
                            child_net_sales = float(child.get("net_sales", 0.0))
                            if child_model_id and child_net_sales > 0:
                                # Get commission rules for the child model
                                child_rule_rows = conn.fetch_specified_columns_with_condition(GFTableNames.models, ["commission_rules"], "model_id = %s", (child_model_id,))
                                child_pct = 0.0
                                if child_rule_rows and len(child_rule_rows) > 0:
                                    child_rules = child_rule_rows[0].get("commission_rules")
                                    if isinstance(child_rules, str):
                                        try:
                                            import json as _json
                                            child_rules = _json.loads(child_rules)
                                        except Exception:
                                            child_rules = {}
                                    base = float(child_rules.get("baseCommission", 0.0) or child_rules.get("base_commission", 0.0))
                                    bonus_enabled = bool(child_rules.get("bonusEnabled") or child_rules.get("bonus_enabled"))
                                    bonus_threshold = float(child_rules.get("bonusThreshold", 0.0) or child_rules.get("bonus_threshold", 0.0))
                                    bonus_pct = float(child_rules.get("bonusCommission", 0.0) or child_rules.get("bonus_percent", 0.0))
                                    child_pct = bonus_pct if (bonus_enabled and child_net_sales >= bonus_threshold) else base
                                child_commission = round(child_net_sales * (child_pct / 100.0), 2)
                                commission += child_commission
                    else:
                        # For regular models, use the model's own commission rules
                        rule_rows = conn.fetch_specified_columns_with_condition(GFTableNames.models, ["commission_rules"], "model_id = %s", (model_id,))
                        pct = 0.0
                        if rule_rows and len(rule_rows) > 0:
                            rules = rule_rows[0].get("commission_rules")
                            if isinstance(rules, str):
                                try:
                                    import json as _json
                                    rules = _json.loads(rules)
                                except Exception:
                                    rules = {}
                            base = float(rules.get("baseCommission", 0.0) or rules.get("base_commission", 0.0))
                            bonus_enabled = bool(rules.get("bonusEnabled") or rules.get("bonus_enabled"))
                            bonus_threshold = float(rules.get("bonusThreshold", 0.0) or rules.get("bonus_threshold", 0.0))
                            bonus_pct = float(rules.get("bonusCommission", 0.0) or rules.get("bonus_percent", 0.0))
                            pct = bonus_pct if (bonus_enabled and net_sales >= bonus_threshold) else base
                        commission = round(net_sales * (pct / 100.0), 2)
                    
                    day_commission_per_model[work_date][model_id] = day_commission_per_model[work_date].get(model_id, 0.0) + commission
                    day_hours_per_model[work_date][model_id] = day_hours_per_model[work_date].get(model_id, 0.0) + hours

            # Compute hourly pay per day using chatter rate tiers based on distinct models per day
            for work_date, models in day_models_map.items():
                total_hours = day_hours_total.get(work_date, 0)
                if total_hours <= 0 or len(models) == 0:
                    continue

                # Fetch chatter rate for models_count
                rate_rows = conn.fetch_all_records_with_condition(
                    GFTableNames.chatter_rates, "chatter_id = %s", (payload.chatter_id,)
                )
                hourly_rate = 0.0
                if rate_rows and len(rate_rows) > 0:
                    import json as _json
                    rates = rate_rows[0].get("rates", {})
                    if isinstance(rates, str):
                        rates = _json.loads(rates)
                    hourly_rate = float(rates.get(str(len(models)), 0.0))

                hourly_pay = round(total_hours * hourly_rate, 2)

                # Persist daily_costs per model
                for model_id in models:
                    # Calculate individual hourly pay for this model based on its hours
                    model_hours = day_hours_per_model.get(work_date, {}).get(model_id, 0.0)
                    per_model_hourly = round(model_hours * hourly_rate, 2)
                    
                    commission = day_commission_per_model.get(work_date, {}).get(model_id, 0.0)
                    total_cost = round(per_model_hourly + commission, 2)
                    conn.insert_update_to_table(
                        GFTableNames.daily_costs,
                        [
                            "cost_id",
                            "cost_date",
                            "chatter_id",
                            "model_id",
                            "hourly_cost",
                            "commission",
                            "total_cost",
                            "period",
                            "year",
                            "week",
                            "updated_by",
                        ],
                        [
                            None,
                            work_date,
                            payload.chatter_id,
                            model_id,
                            per_model_hourly,
                            commission,
                            total_cost,
                            payload.period,
                            payload.year,
                            payload.week,
                            admin_id,
                        ],
                        ["cost_date", "chatter_id", "model_id"],
                    )

            # Recompute weekly chatter summary
            start, end = self._period_week_dates(payload.period, payload.year, payload.week)
            cost_rows = conn.fetch_all_records_with_condition(
                GFTableNames.daily_costs,
                "cost_date BETWEEN %s AND %s AND chatter_id = %s",
                (start, end, payload.chatter_id),
            )
            hourly_total = 0.0
            commission_total = 0.0
            total_payout = 0.0
            for r in cost_rows or []:
                hourly_total += float(r.get("hourly_cost", 0.0))
                commission_total += float(r.get("commission", 0.0))
                total_payout += float(r.get("total_cost", 0.0))

            # hours_total from work_reports
            hour_rows = conn.fetch_all_records_with_condition(
                GFTableNames.work_reports,
                "work_date BETWEEN %s AND %s AND chatter_id = %s",
                (start, end, payload.chatter_id),
            )
            hours_total = sum(int(r.get("hours", 0)) for r in hour_rows or [])

            conn.insert_update_to_table(
                GFTableNames.weekly_chatter_summaries,
                [
                    "summary_id",
                    "chatter_id",
                    "period",
                    "year",
                    "week",
                    "hours_total",
                    "hourly_pay_total",
                    "commission_total",
                    "total_payout",
                ],
                [
                    None,
                    payload.chatter_id,
                    payload.period,
                    payload.year,
                    payload.week,
                    hours_total,
                    round(hourly_total, 2),
                    round(commission_total, 2),
                    round(total_payout, 2),
                ],
                ["chatter_id", "period", "year", "week"],
            )

            # Recompute model_weekly_costs (chatter_cost_total) for this week, using models/team_leader later
            agg_rows = conn.fetch_all_records_with_condition(
                GFTableNames.daily_costs,
                "period = %s AND year = %s AND week = %s",
                (payload.period, payload.year, payload.week),
            )
            # Aggregate per model
            per_model_totals = {}
            for r in agg_rows or []:
                mid = r.get("model_id")
                per_model_totals[mid] = per_model_totals.get(mid, 0.0) + float(r.get("total_cost", 0.0))

            for model_id, chatter_cost_total in per_model_totals.items():
                total_cost = round(chatter_cost_total, 2)  # TL/Manager/Assistant can add later
                conn.insert_update_to_table(
                    GFTableNames.model_weekly_costs,
                    [
                        "id",
                        "model_id",
                        "period",
                        "year",
                        "week",
                        "chatter_cost_total",
                        "tl_cost_total",
                        "manager_cost_total",
                        "assistant_cost_total",
                        "total_cost",
                    ],
                    [
                        None,
                        model_id,
                        payload.period,
                        payload.year,
                        payload.week,
                        round(chatter_cost_total, 2),
                        0.0,
                        0.0,
                        0.0,
                        total_cost,
                    ],
                    ["model_id", "period", "year", "week"],
                )

            conn.commit_transaction()

            # Auto trigger staff cost recompute for this scope
            try:
                from modules.insights_management.handlers.insights_management_handler import InsightsManagementHandler
                log.info(f"Auto-triggering staff cost recompute for {payload.period} {payload.year} Week {payload.week}")
                InsightsManagementHandler().recompute_staff_costs(payload.period, payload.year, payload.week)
                log.info(f"Staff cost recompute completed for {payload.period} {payload.year} Week {payload.week}")
            except Exception as _e:
                log.error(f"Recompute staff costs failed (non-blocking): {_e}")

            final_resp["status"] = CommonConstants.success
            final_resp["message"] = "Week report saved"
            final_resp["data"] = {
                "hours_total": hours_total,
                "hourly_pay_total": round(hourly_total, 2),
                "commission_total": round(commission_total, 2),
                "total_payout": round(total_payout, 2),
            }
            return final_resp
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error saving week report: {str(e)}")
            return final_resp

    def get_reports_summary(self, period: str, year: int | None, week: int | None):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to get reports summary"}
        conn = self.postgres_connection()
        try:
            year = year or datetime.now().year
            if week in [1, 2]:
                start, end = self._period_week_dates(period, year, week)
                condition = "period = %s AND year = %s AND week = %s"
                params = (period, year, week)
            else:
                # full period: aggregate week1 + week2
                condition = "period = %s AND year = %s"
                params = (period, year)

            rows = conn.fetch_all_records_with_condition(GFTableNames.weekly_chatter_summaries, condition, params)
            total = sum(float(r.get("total_payout", 0.0)) for r in rows or [])
            final_resp["status"] = CommonConstants.success
            final_resp["message"] = "Reports summary fetched"
            final_resp["data"] = {"total_payout": round(total, 2), "items": rows or []}
            return final_resp
        except Exception as e:
            log.error(f"Error fetching reports summary: {str(e)}")
            return final_resp

    def get_chatter_salary_data(self, chatter_id: str, period: str, year: int | None):
        """Get salary data for a specific chatter and period"""
        final_resp = {"status": CommonConstants.failed, "message": "Failed to get chatter salary data"}
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()
            year = year or datetime.now().year
            
            # Get data for both weeks of the period
            condition = "chatter_id = %s AND period = %s AND year = %s"
            params = (chatter_id, period, year)
            
            rows = conn.fetch_all_records_with_condition(GFTableNames.weekly_chatter_summaries, condition, params)
            
            # Organize data by week
            week1_data = None
            week2_data = None
            
            for row in rows or []:
                if row.get("week") == 1:
                    week1_data = row
                elif row.get("week") == 2:
                    week2_data = row
            
            # Calculate totals
            week1_salary = float(week1_data.get("total_payout", 0.0)) if week1_data else 0.0
            week2_salary = float(week2_data.get("total_payout", 0.0)) if week2_data else 0.0
            total_salary = week1_salary + week2_salary
            
            final_resp["status"] = CommonConstants.success
            final_resp["message"] = "Chatter salary data fetched"
            final_resp["data"] = {
                "chatter_id": chatter_id,
                "period": period,
                "year": year,
                "week1_salary": round(week1_salary, 2),
                "week2_salary": round(week2_salary, 2),
                "total_salary": round(total_salary, 2),
                "week1_data": week1_data,
                "week2_data": week2_data
            }
            
            conn.commit_transaction()
            return final_resp
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error fetching chatter salary data: {str(e)}")
            return final_resp

    def _ensure_payout_row(self, conn, chatter_id: str, period: str, year: int):
        # Ensure a payout row exists for this chatter/period
        rows = conn.fetch_all_records_with_condition(
            GFTableNames.chatter_payouts, "chatter_id = %s AND period = %s AND year = %s", (chatter_id, period, year)
        )
        if not rows or len(rows) == 0:
            conn.insert_update_to_table(
                GFTableNames.chatter_payouts,
                [
                    "payout_id",
                    "chatter_id",
                    "period",
                    "year",
                    "week1_amount",
                    "week2_amount",
                    "total_amount",
                    "payment_status",
                ],
                [None, chatter_id, period, year, 0.0, 0.0, 0.0, "Not Paid"],
                ["chatter_id", "period", "year"],
            )

    def list_payouts(self, period: str, year: int | None):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to list payouts"}
        conn = self.postgres_connection()
        try:
            yr = year or datetime.now().year
            rows = conn.fetch_all_records_with_condition(GFTableNames.chatter_payouts, "period = %s AND year = %s", (period, yr))
            final_resp["status"] = CommonConstants.success
            final_resp["message"] = "Payouts fetched"
            final_resp["data"] = rows or []
            return final_resp
        except Exception as e:
            log.error(f"Error listing payouts: {str(e)}")
            return final_resp

    def update_payout_status(self, chatter_id: str, period: str, year: int | None, payment_status: str, admin_id: str):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to update payout status"}
        conn = self.postgres_connection()
        try:
            yr = year or datetime.now().year
            self._ensure_payout_row(conn, chatter_id, period, yr)
            res = conn.update_table(
                GFTableNames.chatter_payouts,
                "payment_status = %s, updated_by = %s, updated_at = CURRENT_TIMESTAMP",
                "chatter_id = %s AND period = %s AND year = %s",
                (payment_status, admin_id, chatter_id, period, yr),
            )
            if res.get("status") == "Success":
                final_resp["status"] = CommonConstants.success
                final_resp["message"] = "Payout status updated"
                return final_resp
            else:
                return final_resp
        except Exception as e:
            log.error(f"Error updating payout status: {str(e)}")
            return final_resp


