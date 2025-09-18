from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from scripts.logging.log_module import logger as log
from scripts.constants.app_constants import TableNames, GFTableNames
from scripts.utils.common_utils import PostgresConnection
import json

class SalaryCalculationHelper:
    def __init__(self):
        try:
            self.db_object_utility = PostgresConnection()
        except Exception as e:
            log.error(str(e))

    def postgres_connection(self):
        try:
            return self.db_object_utility.connect_to_postgres_utility()
        except Exception as e:
            log.error("Exception Occurred While Connection to Postgres" + str(e))

    def generate_salary_periods(self, year: int = None) -> List[str]:
        """Generate bi-weekly salary periods for a year"""
        if year is None:
            year = datetime.now().year
        
        periods = []
        months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ]
        
        for month in months:
            periods.append(f"{month} 1")  # First half of month (1st-15th)
            periods.append(f"{month} 2")  # Second half of month (16th-end)
        
        return periods

    def get_period_date_range(self, period: str, year: int = None) -> Dict[str, datetime]:
        """Get the start and end dates for a salary period"""
        if year is None:
            year = datetime.now().year
        
        # Parse period like "July 1" or "July 2"
        parts = period.split()
        if len(parts) != 2:
            raise ValueError(f"Invalid period format: {period}")
        
        month_name, half = parts[0], parts[1]
        
        months = {
            "January": 1, "February": 2, "March": 3, "April": 4,
            "May": 5, "June": 6, "July": 7, "August": 8,
            "September": 9, "October": 10, "November": 11, "December": 12
        }
        
        month_num = months.get(month_name)
        if not month_num:
            raise ValueError(f"Invalid month: {month_name}")
        
        if half == "1":
            # First half: 1st to 15th
            start_date = datetime(year, month_num, 1)
            end_date = datetime(year, month_num, 15, 23, 59, 59)
        elif half == "2":
            # Second half: 16th to end of month
            start_date = datetime(year, month_num, 16)
            # Get last day of month
            if month_num == 12:
                next_month = datetime(year + 1, 1, 1)
            else:
                next_month = datetime(year, month_num + 1, 1)
            end_date = next_month - timedelta(seconds=1)
        else:
            raise ValueError(f"Invalid half: {half}")
        
        return {"start": start_date, "end": end_date}

    def _get_chatter_rates(self, chatter_id: str) -> Dict[str, float]:
        """Get chatter hourly rates for different model counts"""
        try:
            conn = self.postgres_connection()
            conn.begin_transaction()
            rates_result = conn.fetch_all_records_with_condition(
                table=GFTableNames.chatter_rates,
                condition="chatter_id = %s",
                params=(chatter_id,)
            )
            
            log.debug(f"_get_chatter_rates raw result for {chatter_id}: {rates_result}")
            if not rates_result:
                log.warning(f"No rates found for chatter {chatter_id}")
                conn.commit_transaction()
                return {}
            
            # Support two storage formats:
            # 1) Single row with JSONB column 'rates' mapping model_count -> hourly_rate
            # 2) Multiple rows each having 'models_count' and 'hourly_rate'
            # Try JSON map first
            rates_data = rates_result[0].get("rates") if isinstance(rates_result, list) and rates_result else None
            if isinstance(rates_data, str):
                try:
                    rates_data = json.loads(rates_data)
                except Exception:
                    rates_data = None
            
            if isinstance(rates_data, dict) and rates_data:
                parsed = {str(k): float(v) for k, v in rates_data.items()}
                log.debug(f"Parsed chatter rates (JSON map) for {chatter_id}: {parsed}")
                conn.commit_transaction()
                return parsed
            
            # If stored as a list of {models_count, hourly_rate}
            if isinstance(rates_data, list) and rates_data:
                built_from_list: Dict[str, float] = {}
                for item in rates_data:
                    if not isinstance(item, dict):
                        continue
                    mc = item.get("models_count")
                    hr = item.get("hourly_rate")
                    if mc is None or hr is None:
                        continue
                    try:
                        key = str(int(float(mc)))
                        built_from_list[key] = float(hr)
                    except Exception:
                        continue
                if built_from_list:
                    log.debug(f"Parsed chatter rates (list) for {chatter_id}: {built_from_list}")
                    conn.commit_transaction()
                    return built_from_list
            
            # Fallback: build from per-row records
            built_rates: Dict[str, float] = {}
            for row in rates_result:
                models_count = row.get("models_count")
                hourly_rate = row.get("hourly_rate")
                if models_count is None or hourly_rate is None:
                    continue
                try:
                    # Some DBs may return floats like 1.0; coerce to int then str
                    key = str(int(float(models_count)))
                    built_rates[key] = float(hourly_rate)
                except Exception:
                    continue
            
            if not built_rates:
                log.warning(f"Rates rows found but could not parse for chatter {chatter_id}")
                conn.commit_transaction()
                return {}
            log.debug(f"Parsed chatter rates (per-row) for {chatter_id}: {built_rates}")
            conn.commit_transaction()
            return built_rates
            
        except Exception as e:
            log.error(f"Error fetching chatter rates: {str(e)}")
            try:
                conn.rollback_transaction()
            except Exception:
                pass
            return {}

    def _get_model_details(self, model_id: str) -> Dict[str, Any]:
        """Get model details including commission rules and reference models"""
        try:
            conn = self.postgres_connection()
            conn.begin_transaction()
            model_result = conn.fetch_all_records_with_condition(
                table=GFTableNames.models,
                condition="model_id = %s AND soft_delete = 'active'",
                params=(model_id,)
            )
            
            if not model_result:
                log.warning(f"Model {model_id} not found or inactive")
                conn.commit_transaction()
                return {}
            
            model = model_result[0]
            
            # Parse JSON fields
            cut_logic = model.get("cut_logic", {})
            if isinstance(cut_logic, str):
                cut_logic = json.loads(cut_logic)
            
            commission_rules = model.get("commission_rules", {})
            if isinstance(commission_rules, str):
                commission_rules = json.loads(commission_rules)
            
            referenced_models = model.get("referenced_models", [])
            if isinstance(referenced_models, str):
                referenced_models = json.loads(referenced_models)
            
            result = {
                "model_id": model.get("model_id"),
                "model_name": model.get("model_name"),
                "earnings_type": model.get("earnings_type"),
                "cut_logic": cut_logic,
                "commission_rules": commission_rules,
                "referenced_models": referenced_models,
                "manager_name": model.get("manager_name"),
                "team_leader": model.get("team_leader")
            }
            conn.commit_transaction()
            return result
            
        except Exception as e:
            log.error(f"Error fetching model details: {str(e)}")
            try:
                conn.rollback_transaction()
            except Exception:
                pass
            return {}

    def _get_model_details_by_name(self, model_name: str) -> Dict[str, Any]:
        """Get model details by model name instead of model_id"""
        try:
            conn = self.postgres_connection()
            conn.begin_transaction()
            model_result = conn.fetch_all_records_with_condition(
                table=GFTableNames.models,
                condition="model_name = %s AND soft_delete = 'active'",
                params=(model_name,)
            )
            
            if not model_result:
                log.warning(f"Model with name {model_name} not found or inactive")
                conn.commit_transaction()
                return {}
            
            model = model_result[0]
            
            # Parse JSON fields
            cut_logic = model.get("cut_logic", {})
            if isinstance(cut_logic, str):
                cut_logic = json.loads(cut_logic)
            
            commission_rules = model.get("commission_rules", {})
            if isinstance(commission_rules, str):
                commission_rules = json.loads(commission_rules)
            
            referenced_models = model.get("referenced_models", [])
            if isinstance(referenced_models, str):
                referenced_models = json.loads(referenced_models)
            
            result = {
                "model_id": model.get("model_id"),
                "model_name": model.get("model_name"),
                "earnings_type": model.get("earnings_type"),
                "cut_logic": cut_logic,
                "commission_rules": commission_rules,
                "referenced_models": referenced_models,
                "manager_name": model.get("manager_name"),
                "team_leader": model.get("team_leader")
            }
            conn.commit_transaction()
            return result
            
        except Exception as e:
            log.error(f"Error fetching model details by name: {str(e)}")
            try:
                conn.rollback_transaction()
            except Exception:
                pass
            return {}

    def _calculate_commission(self, net_sales: float, commission_rules: Dict[str, Any]) -> float:
        """Calculate commission based on model rules"""
        try:
            base_commission = float(commission_rules.get("baseCommission", 0))
            bonus_enabled = commission_rules.get("bonusEnabled", False)
            
            if not bonus_enabled:
                return net_sales * (base_commission / 100)
            
            bonus_threshold = float(commission_rules.get("bonusThreshold", 0))
            bonus_commission = float(commission_rules.get("bonusCommission", 0))
            
            if net_sales > bonus_threshold:
                return net_sales * (bonus_commission / 100)
            else:
                return net_sales * (base_commission / 100)
                
        except Exception as e:
            log.error(f"Error calculating commission: {str(e)}")
            return 0.0

    def _calculate_agency_cut(self, net_sales: float, cut_logic: Dict[str, Any], earnings_type: str) -> float:
        """Calculate agency cut (for the agency handling the model)"""
        try:
            log.debug(f"Agency cut calculation: net_sales={net_sales}, cut_logic={cut_logic}, earnings_type={earnings_type}")
            
            if earnings_type == "Type 1":
                threshold = float(cut_logic.get("threshold", 0))
                percentage1 = float(cut_logic.get("percentage1", 0))
                fixed_amount = float(cut_logic.get("fixedAmount", 0))
                
                log.debug(f"Type 1 calculation: threshold={threshold}, percentage1={percentage1}, fixed_amount={fixed_amount}")
                
                if net_sales >= threshold:
                    result = net_sales * (percentage1 / 100)
                    log.debug(f"Type 1 result (above threshold): {result}")
                    return result
                else:
                    log.debug(f"Type 1 result (below threshold): {fixed_amount}")
                    return fixed_amount
                    
            elif earnings_type == "Type 2":
                percentage2 = float(cut_logic.get("percentage2", 0))
                result = net_sales * (percentage2 / 100)
                log.debug(f"Type 2 calculation: percentage2={percentage2}, result={result}")
                return result
            
            log.debug("No valid earnings type, returning 0")
            return 0.0
            
        except Exception as e:
            log.error(f"Error calculating agency cut: {str(e)}")
            return 0.0

    def calculate_daily_salary(self, chatter_id: str, work_date: str, work_rows: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate salary for a specific day based on work rows"""
        try:
            if not work_rows:
                return {
                    "total_salary": 0.0,
                    "hourly_pay": 0.0,
                    "commission_total": 0.0,
                    "row_breakdown": [],
                    "agency_cut": 0.0,
                    "net_earnings": 0.0
                }
            
            # Get chatter rates
            chatter_rates = self._get_chatter_rates(chatter_id)
            if not chatter_rates:
                log.warning(f"No rates found for chatter {chatter_id}")
                return {"error": "No rates found for chatter"}
            
            # Count distinct models for the day (including reference models)
            distinct_models = set()
            total_hours = 0.0
            total_commission = 0.0
            total_agency_cut = 0.0
            row_breakdown = []
            errors = []
            
            # First pass: count distinct models to determine hourly rate
            for row in work_rows:
                model_id = row.get("model_id")
                hours = float(row.get("hours", 0))
                
                if hours <= 0:
                    continue
                
                # Get model details to check if it's a reference model
                model_details = self._get_model_details(model_id)
                if not model_details:
                    continue
                
                # Handle reference models
                referenced_models = model_details.get("referenced_models", [])
                if referenced_models:
                    # For reference models, count as 1 model for hourly rate
                    distinct_models.add(f"ref_{model_id}")
                else:
                    # Regular model
                    distinct_models.add(model_id)
            
            # Determine hourly rate based on model count
            model_count = len(distinct_models)
            hourly_rate = chatter_rates.get(str(model_count), 0.0)
            
            if hourly_rate == 0.0:
                log.warning(f"No rate found for {model_count} models for chatter {chatter_id}")
                return {"error": f"No rate found for {model_count} models"}
            
            # Process each work row
            for row in work_rows:
                model_id = row.get("model_id")
                hours = float(row.get("hours", 0))
                net_sales = float(row.get("net_sales", 0))
                
                # Debug logging
                log.debug(f"Processing row: model_id={model_id}, hours={hours}, net_sales={net_sales}")
                log.debug(f"Row data: {row}")
                
                if hours <= 0:
                    continue
                
                # Get model details
                model_details = self._get_model_details(model_id)
                if not model_details:
                    log.warning(f"Model {model_id} not found")
                    errors.append(f"Model {model_id} not found or inactive")
                    continue
                
                # Handle reference models
                referenced_models = model_details.get("referenced_models", [])
                log.debug(f"Model {model_id} referenced_models: {referenced_models}")
                
                if referenced_models:
                    # For reference models, count as 1 model for hourly rate
                    distinct_models.add(f"ref_{model_id}")
                    
                    # Process each referenced model separately
                    reference_children = row.get("reference_children", [])
                    log.debug(f"Reference children data: {reference_children}")
                    
                    if not reference_children:
                        log.warning(f"No reference children data for reference model {model_id}")
                        errors.append(f"Reference model {model_id} missing child data")
                        continue
                    
                    row_commission = 0.0
                    row_agency_cut = 0.0
                    child_breakdown = []
                    
                    for child in reference_children:
                        child_model_id = child.get("model_id")
                        child_net_sales = float(child.get("net_sales", 0))
                        child_hours = float(child.get("hours", 0))
                        
                        log.debug(f"Processing child: model_id={child_model_id}, net_sales={child_net_sales}, hours={child_hours}")
                        
                        # Get child model details
                        child_model_details = self._get_model_details(child_model_id)
                        if not child_model_details:
                            log.warning(f"Referenced model {child_model_id} not found")
                            errors.append(f"Referenced model {child_model_id} not found or inactive")
                            continue
                        
                        # Calculate commission using child model's rules
                        child_commission = self._calculate_commission(child_net_sales, child_model_details.get("commission_rules", {}))
                        row_commission += child_commission
                        
                        # Calculate agency cut using child model's rules
                        # Agency cut is calculated from net_sales only (for the agency handling the model)
                        child_cut_logic = child_model_details.get("cut_logic", {})
                        child_earnings_type = child_model_details.get("earnings_type", "Type 2")
                        log.debug(f"Child agency cut calculation: net_sales={child_net_sales}, cut_logic={child_cut_logic}, earnings_type={child_earnings_type}")
                        child_agency_cut = self._calculate_agency_cut(
                            child_net_sales,
                            child_cut_logic,
                            child_earnings_type
                        )
                        log.debug(f"Child agency cut result: {child_agency_cut}")
                        row_agency_cut += child_agency_cut
                        
                        # Calculate hourly pay for this child (distribute parent hours among children)
                        child_hourly_pay = child_hours * hourly_rate
                        
                        child_breakdown.append({
                            "model_id": child_model_id,
                            "model_name": child_model_details.get("model_name", "Unknown"),
                            "hours": child_hours,
                            "net_sales": child_net_sales,
                            "commission": child_commission,
                            "agency_cut": child_agency_cut,
                            "hourly_pay": round(child_hourly_pay, 2)
                        })
                    
                    total_commission += row_commission
                    total_agency_cut += row_agency_cut
                    
                    # Calculate hourly pay for this row (hours * hourly_rate)
                    row_hourly_pay = hours * hourly_rate
                    
                    row_breakdown.append({
                        "model_id": model_id,
                        "model_name": model_details.get("model_name", "Unknown"),
                        "hours": hours,
                        "net_sales": net_sales,
                        "commission": row_commission,
                        "agency_cut": row_agency_cut,
                        "hourly_pay": round(row_hourly_pay, 2),
                        "total": round(row_hourly_pay + row_commission, 2),
                        "is_reference_model": True,
                        "reference_children": child_breakdown
                    })
                else:
                    # Regular model
                    distinct_models.add(model_id)
                    
                    # Calculate commission for this row
                    commission = self._calculate_commission(net_sales, model_details.get("commission_rules", {}))
                    total_commission += commission
                    
                    # Calculate agency cut for this row
                    # Agency cut is calculated from net_sales only (for the agency handling the model)
                    agency_cut = self._calculate_agency_cut(
                        net_sales,
                        model_details.get("cut_logic", {}),
                        model_details.get("earnings_type", "Type 2")
                    )
                    total_agency_cut += agency_cut
                    
                    # Calculate hourly pay for this row (hours * hourly_rate)
                    row_hourly_pay = hours * hourly_rate
                    
                    row_breakdown.append({
                        "model_id": model_id,
                        "model_name": model_details.get("model_name", "Unknown"),
                        "hours": hours,
                        "net_sales": net_sales,
                        "commission": commission,
                        "agency_cut": agency_cut,
                        "hourly_pay": round(row_hourly_pay, 2),
                        "total": round(row_hourly_pay + commission, 2),
                        "is_reference_model": False
                    })
                
                total_hours += hours
            
            # Calculate hourly pay
            hourly_pay = total_hours * hourly_rate
            
            # Calculate total salary
            total_salary = hourly_pay + total_commission
            
            # Net earnings after agency cut
            net_earnings = total_salary - total_agency_cut
            
            result = {
                "total_salary": round(total_salary, 2),
                "hourly_pay": round(hourly_pay, 2),
                "commission_total": round(total_commission, 2),
                "row_breakdown": row_breakdown,
                "agency_cut": round(total_agency_cut, 2),
                "net_earnings": round(net_earnings, 2),
                "model_count": model_count,
                "hourly_rate": hourly_rate,
                "total_hours": total_hours
            }
            
            # Add errors if any
            if errors:
                result["errors"] = errors
            
            return result
            
        except Exception as e:
            log.error(f"Error calculating daily salary: {str(e)}")
            return {"error": f"Calculation error: {str(e)}"}

    def calculate_week_salary(self, chatter_id: str, period: str, year: int, week: int) -> Dict[str, Any]:
        """Calculate salary for a specific week"""
        try:
            conn = self.postgres_connection()
            conn.begin_transaction()
            
            # Get work reports for the week
            work_reports = conn.fetch_all_records_with_condition(
                table=GFTableNames.work_reports,
                condition="chatter_id = %s AND period = %s AND year = %s AND week = %s",
                params=(chatter_id, period, year, week)
            )
            
            if not work_reports:
                conn.commit_transaction()
                return {
                    "week_salary": 0.0,
                    "daily_breakdown": [],
                    "total_hours": 0.0,
                    "total_commission": 0.0,
                    "total_agency_cut": 0.0,
                    "net_earnings": 0.0
                }
            
            # Group by date
            daily_work = {}
            for report in work_reports:
                work_date = report.get("work_date")
                if work_date not in daily_work:
                    daily_work[work_date] = []
                
                daily_work[work_date].append({
                    "model_id": report.get("model_id"),
                    "hours": report.get("hours", 0),
                    "net_sales": report.get("net_sales", 0)
                })
            
            # Calculate daily salaries
            daily_breakdown = []
            week_salary = 0.0
            total_hours = 0.0
            total_commission = 0.0
            total_agency_cut = 0.0
            
            for work_date, work_rows in daily_work.items():
                daily_result = self.calculate_daily_salary(chatter_id, work_date, work_rows)
                
                if "error" not in daily_result:
                    daily_breakdown.append({
                        "date": work_date,
                        "salary": daily_result["total_salary"],
                        "hourly_pay": daily_result["hourly_pay"],
                        "commission": daily_result["commission_total"],
                        "agency_cut": daily_result["agency_cut"],
                        "net_earnings": daily_result["net_earnings"],
                        "model_count": daily_result["model_count"],
                        "total_hours": daily_result["total_hours"]
                    })
                    
                    week_salary += daily_result["total_salary"]
                    total_hours += daily_result["total_hours"]
                    total_commission += daily_result["commission_total"]
                    total_agency_cut += daily_result["agency_cut"]
            
            net_earnings = week_salary - total_agency_cut
            
            result = {
                "week_salary": round(week_salary, 2),
                "daily_breakdown": daily_breakdown,
                "total_hours": total_hours,
                "total_commission": round(total_commission, 2),
                "total_agency_cut": round(total_agency_cut, 2),
                "net_earnings": round(net_earnings, 2)
            }
            conn.commit_transaction()
            return result
            
        except Exception as e:
            log.error(f"Error calculating week salary: {str(e)}")
            try:
                conn.rollback_transaction()
            except Exception:
                pass
            return {"error": f"Calculation error: {str(e)}"}

    def calculate_chatter_salary(self, chatter_id: str, period: str, year: int = None) -> float:
        """Calculate total salary for a chatter for a specific period"""
        try:
            if year is None:
                year = datetime.now().year
            
            # Calculate for both weeks
            week1_result = self.calculate_week_salary(chatter_id, period, year, 1)
            week2_result = self.calculate_week_salary(chatter_id, period, year, 2)
            
            if "error" in week1_result or "error" in week2_result:
                log.error(f"Error calculating period salary for chatter {chatter_id}")
                return 0.0
            
            total_salary = week1_result.get("week_salary", 0) + week2_result.get("week_salary", 0)
            return round(total_salary, 2)
            
        except Exception as e:
            log.error(f"Error calculating chatter salary: {str(e)}")
            return 0.0

    def update_chatter_salary_for_period(self, chatter_id: str, period: str, year: int = None) -> bool:
        """Update the salary amount for a chatter for a specific period"""
        try:
            conn = self.postgres_connection()
            conn.begin_transaction()
            
            # Calculate salary
            salary_amount = self.calculate_chatter_salary(chatter_id, period, year)
            
            # Update chatter record
            result = conn.update_table(
                table=GFTableNames.chatters,
                values_condition="last_salary_period = %s, amount_for_period = %s, updated_at = CURRENT_TIMESTAMP",
                update_condition="chatter_id = %s",
                params=(period, salary_amount, chatter_id)
            )
            
            if result.get("status") == "Success":
                conn.commit_transaction()
                log.info(f"Updated salary for chatter {chatter_id}, period {period}: ${salary_amount}")
                return True
            else:
                conn.rollback_transaction()
                log.error(f"Failed to update salary for chatter {chatter_id}")
                return False
                
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error updating salary for chatter {chatter_id}: {str(e)}")
            return False

    def update_all_chatters_salary_for_period(self, period: str, year: int = None) -> Dict[str, bool]:
        """Update salary for all active chatters for a specific period"""
        try:
            conn = self.postgres_connection()
            conn.begin_transaction()
            
            # Get all active chatters (not soft deleted)
            chatters_result = conn.fetch_all_records_with_condition(
                table=GFTableNames.chatters,
                condition="soft_delete = %s",
                params=("active",)
            )
            
            results = {}
            
            for chatter in chatters_result:
                chatter_id = chatter.get("chatter_id")
                success = self.update_chatter_salary_for_period(chatter_id, period, year)
                results[chatter_id] = success
            
            conn.commit_transaction()
            log.info(f"Updated salaries for {len(results)} chatters for period {period}")
            return results
            
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error updating salaries for period {period}: {str(e)}")
            return {}

    def get_current_salary_period(self) -> str:
        """Get the current salary period based on today's date"""
        now = datetime.now()
        
        months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ]
        
        month_name = months[now.month - 1]
        
        # Determine if we're in first half (1-15) or second half (16-end)
        if now.day <= 15:
            return f"{month_name} 1"
        else:
            return f"{month_name} 2"

    def auto_update_salaries_for_current_period(self) -> Dict[str, bool]:
        """Automatically update all chatter salaries for the current period"""
        current_period = self.get_current_salary_period()
        log.info(f"Auto-updating salaries for current period: {current_period}")
        return self.update_all_chatters_salary_for_period(current_period)
