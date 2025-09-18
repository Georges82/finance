from scripts.utils.common_utils import *
from scripts.constants.app_constants import CommonConstants, TableNames, GFTableNames
from scripts.logging.log_module import logger as log
from pydantic import validate_call
from fastapi import Response, status
from scripts.constants.app_configuration import COOKIE_EXPIRATION_IN_SECONDS
from modules.chatter_management.models.chatter_management_models import ChatterCreate, ChatterUpdate, ChatterRateUpdate, ChatterRatesUpdate
import json

class ChatterManagementHandler:
    def __init__(self):
        try:
            self.db_object_utility = PostgresConnection()
        except Exception as e:
            log.error(str(e))

    def _convert_decimal_to_float(self, value):
        """Convert Decimal objects to float and datetime objects to string for JSON serialization"""
        if value is not None:
            if hasattr(value, '__float__'):
                return float(value)
            elif hasattr(value, 'isoformat'):  # Handle datetime objects
                return value.isoformat()
        return value
    
    def _convert_decimal_in_dict(self, data_dict):
        """Convert all Decimal values in a dictionary to float for JSON serialization"""
        if not isinstance(data_dict, dict):
            return data_dict
        
        converted_dict = {}
        for key, value in data_dict.items():
            if isinstance(value, dict):
                converted_dict[key] = self._convert_decimal_in_dict(value)
            elif isinstance(value, list):
                converted_dict[key] = [self._convert_decimal_in_dict(item) if isinstance(item, dict) else self._convert_decimal_to_float(item) for item in value]
            else:
                converted_dict[key] = self._convert_decimal_to_float(value)
        return converted_dict

    def postgres_connection(self):
        try:
            return self.db_object_utility.connect_to_postgres_utility()
        except Exception as e:
            log.error("Exception Occurred While Connection to Postgres" + str(e))

    def close_postgres_connection(self):
        try:
            return self.db_object_utility.close_connection()
        except Exception as e:
            log.error("Exception Occurred While Closing Postgres Connection" + str(e))

    @validate_call
    def register_chatter(self, chatter: ChatterCreate, current_admin_id: str):
        """Chatter registration handler method"""
        final_resp = {"message": "Unable to register chatter. Please try again.", "status": CommonConstants.failed}
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()            
            existing_chatter = conn.fetch_all_records_with_condition(TableNames.chatters,condition="telegram_username = %s",params=(chatter.telegram_username,)
            )
            if len(existing_chatter) > 0:
                final_resp["message"] = "Chatter with this telegram username already exists"
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_400_BAD_REQUEST, media_type="application/json")
            
            add_chatter = {
                "name": chatter.name,
                "telegram_username": chatter.telegram_username,
                "country": chatter.country,
                "shift": chatter.shift, 
                "status": chatter.status,
                "payment_status": chatter.payment_status,
                "notes": chatter.notes,
                "created_by": current_admin_id
            }
            result = conn.insert_dict_into_table(
                table=TableNames.chatters,
                data_dict=add_chatter,
                returning_columns=['chatter_id']
            )
            
            if result["status"] != CommonConstants.success:
                log.error("Failed to insert chatter")
                final_resp["message"] = "Failed to create chatter"
                conn.rollback_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_400_BAD_REQUEST, media_type="application/json"
                )

            chatter_id = result["result"]["chatter_id"]
            log.info(f"Chatter created successfully with ID: {chatter_id}")

            # Fetch the created chatter data for response
            new_chatter_data = conn.fetch_all_records_with_condition(TableNames.chatters,condition="chatter_id = %s",params=(chatter_id,))
            chatter_data = new_chatter_data[0]
            final_resp["status"] = CommonConstants.success
            final_resp["message"] = "Chatter registered successfully"
            final_resp["data"] = self._convert_decimal_in_dict({
                "chatter_id": chatter_data.get("chatter_id"),
                "name": chatter_data.get("name"),
                "telegram_username": chatter_data.get("telegram_username"),
                "country": chatter_data.get("country"),
                "shift": chatter_data.get("shift"),
                "status": chatter_data.get("status"),
                "notes": chatter_data.get("notes"),
                "payment_status": chatter_data.get("payment_status", "Not Paid"),
                "amount_for_period": chatter_data.get("amount_for_period", 0.00)
            })
            
            conn.commit_transaction()
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_201_CREATED, media_type="application/json")
            
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error registering chatter: {str(e)}")
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")

    async def get_chatter_details(self, chatter_id: str):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to get chatter details"}
        try:
            conn = self.postgres_connection()
            conn.begin_transaction()
            condition = "chatter_id = %s"
            params = (chatter_id,) 
            result = conn.fetch_all_records_with_condition(table=TableNames.chatters, condition=condition, params=params)
            log.info(f"Chatter details: {result}")
            if result and len(result) > 0:
                chatter_data = result[0]
                final_resp["status"] = CommonConstants.success
                final_resp["message"] = "Chatter details retrieved successfully"
                final_resp["data"] = self._convert_decimal_in_dict({
                    "chatter_id": chatter_data.get("chatter_id"),
                    "name": chatter_data.get("name"),
                    "telegram_username": chatter_data.get("telegram_username"),
                    "country": chatter_data.get("country"),
                    "shift": chatter_data.get("shift"),
                    "status": chatter_data.get("status"),
                    "soft_delete": chatter_data.get("soft_delete"),
                    "notes": chatter_data.get("notes"),
                    "last_salary_period": chatter_data.get("last_salary_period"),
                    "amount_for_period": chatter_data.get("amount_for_period"),
                    "payment_status": chatter_data.get("payment_status"),
                    "created_at": chatter_data.get("created_at"),
                    "updated_at": chatter_data.get("updated_at")
                })
            conn.commit_transaction()
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_200_OK, media_type="application/json")
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error fetching chatter details: {str(e)}")
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")

    async def get_chatters_with_salary_data(self, limit: int = 100, offset: int = 0, query: str = "", sort: str = "desc", sort_by: str = "created_at", period: str = None):
        """Get all chatters with their salary data from weekly_chatter_summaries for a specific period or latest"""
        final_resp = {"status": CommonConstants.failed, "message": "Failed to fetch chatters with salary data"}
        try:
            conn = self.postgres_connection()
            conn.begin_transaction()
            
            # Build the base query based on whether period is specified
            if period and period != 'all':
                # Get salary data for specific period
                base_query = f"""
                    SELECT 
                        c.*,
                        COALESCE(salary.period, 'No Data') as last_salary_period,
                        COALESCE(salary.total_payout, 0.00) as amount_for_period
                    FROM {TableNames.chatters} c
                    LEFT JOIN (
                        SELECT 
                            chatter_id,
                            period,
                            year,
                            week,
                            total_payout,
                            created_at
                        FROM {GFTableNames.weekly_chatter_summaries}
                        WHERE period = '{period}'
                    ) salary ON c.chatter_id = salary.chatter_id
                    WHERE c.soft_delete = 'active'
                """
            else:
                # Get latest salary data for each chatter
                base_query = f"""
                    SELECT 
                        c.*,
                        COALESCE(latest_salary.period, 'No Data') as last_salary_period,
                        COALESCE(latest_salary.total_payout, 0.00) as amount_for_period
                    FROM {TableNames.chatters} c
                    LEFT JOIN (
                        SELECT DISTINCT ON (chatter_id) 
                            chatter_id,
                            period,
                            year,
                            week,
                            total_payout,
                            created_at
                        FROM {GFTableNames.weekly_chatter_summaries}
                        ORDER BY chatter_id, created_at DESC
                    ) latest_salary ON c.chatter_id = latest_salary.chatter_id
                    WHERE c.soft_delete = 'active'
                """
            
            # Add search condition if query is provided
            if query:
                base_query += f" AND (c.name ILIKE '%{query}%' OR c.telegram_username ILIKE '%{query}%')"
            
            # Add sorting
            base_query += f" ORDER BY c.{sort_by} {sort.upper()}"
            
            # Add pagination
            base_query += f" LIMIT {limit} OFFSET {offset}"
            
            # Execute query
            result = conn.execute_query(base_query, data=True)
            
            if result and len(result) > 0:
                # Convert the results
                chatters_data = []
                for row in result:
                    chatter_data = self._convert_decimal_in_dict({
                        "chatter_id": row.get("chatter_id"),
                        "name": row.get("name"),
                        "telegram_username": row.get("telegram_username"),
                        "country": row.get("country"),
                        "shift": row.get("shift"),
                        "status": row.get("status"),
                        "payment_status": row.get("payment_status"),
                        "notes": row.get("notes"),
                        "last_salary_period": row.get("last_salary_period"),
                        "amount_for_period": row.get("amount_for_period"),
                        "created_at": row.get("created_at"),
                        "updated_at": row.get("updated_at")
                    })
                    chatters_data.append(chatter_data)
                
                final_resp["status"] = CommonConstants.success
                final_resp["message"] = f"Retrieved {len(chatters_data)} chatter(s) with salary data successfully"
                final_resp["data"] = chatters_data
            else:
                final_resp["status"] = CommonConstants.success
                final_resp["message"] = "No chatters found"
                final_resp["data"] = []
            
            conn.commit_transaction()
            return final_resp
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error fetching chatters with salary data: {str(e)}")
            return final_resp

    async def get_all_chatters(self, limit: int = 100, offset: int = 0, query: str = "", sort: str = "desc", sort_by: str = "created_at", status_filter: str = None):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to get all chatters"}
        try:
            conn = self.postgres_connection()
            conn.begin_transaction()
            
            condition = "soft_delete = %s"
            params = ["active"]
            
            if status_filter and status_filter in ["active", "inactive"]:
                condition += " AND status = %s"
                params.append(status_filter)
            
            if query:
                condition += " AND (name ILIKE %s OR telegram_username ILIKE %s OR country ILIKE %s)"
                search_param = f"%{query}%"
                params.extend([search_param, search_param, search_param])
            
            if sort.upper() == "DESC":
                orderby = f"-{sort_by}"
            else:
                orderby = f"+{sort_by}"
            
            result, total_count = conn.fetch_all_records_with_condition_pagination(
                table=TableNames.chatters,
                condition=condition,
                orderby=orderby,
                limit=limit,
                offset=offset,
                params=params
            )
            
            log.info(f"All chatters query result: {len(result) if result else 0} records found")
            
            if result:
                chatters_list = []
                for chatter_data in result:
                    chatter_info = self._convert_decimal_in_dict({
                        "chatter_id": chatter_data.get("chatter_id"),
                        "name": chatter_data.get("name"),
                        "telegram_username": chatter_data.get("telegram_username"),
                        "country": chatter_data.get("country"),
                        "shift": chatter_data.get("shift"),
                        "status": chatter_data.get("status"),
                        "notes": chatter_data.get("notes"),
                        "last_salary_period": chatter_data.get("last_salary_period"),
                        "amount_for_period": chatter_data.get("amount_for_period"),
                        "payment_status": chatter_data.get("payment_status"),
                        "created_at": chatter_data.get("created_at"),
                        "updated_at": chatter_data.get("updated_at")
                    })
                    chatters_list.append(chatter_info)
                
                final_resp["status"] = CommonConstants.success
                final_resp["message"] = f"Retrieved {len(chatters_list)} chatter(s) successfully"
                final_resp["data"] = chatters_list
                final_resp["total_count"] = total_count
            else:
                final_resp["status"] = CommonConstants.success
                final_resp["message"] = "No active chatters found"
                final_resp["data"] = []
                final_resp["total_count"] = 0
            
            conn.commit_transaction()
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_200_OK, media_type="application/json")
            
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error getting all chatters: {str(e)}")
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")

    async def update_chatter(self, chatter_id: str, chatter_update: ChatterUpdate, current_admin_id: str):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to update chatter"}
        try:
            conn = self.postgres_connection()
            conn.begin_transaction()
            
            existing_chatter = conn.fetch_all_records_with_condition(
                table=TableNames.chatters,
                condition="chatter_id = %s",
                params=(chatter_id,)
            )
            
            if not existing_chatter or len(existing_chatter) == 0:
                final_resp["message"] = "Chatter not found"
                conn.rollback_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_404_NOT_FOUND, media_type="application/json")
            
            # Build update data
            update_data = {}
            if chatter_update.name is not None:
                update_data["name"] = chatter_update.name
            if chatter_update.telegram_username is not None:
                update_data["telegram_username"] = chatter_update.telegram_username
            if chatter_update.country is not None:
                update_data["country"] = chatter_update.country
            if chatter_update.shift is not None:
                update_data["shift"] = chatter_update.shift
            if chatter_update.status is not None:
                update_data["status"] = chatter_update.status
            if chatter_update.notes is not None:
                update_data["notes"] = chatter_update.notes
            if chatter_update.last_salary_period is not None:
                update_data["last_salary_period"] = chatter_update.last_salary_period
            if chatter_update.amount_for_period is not None:
                update_data["amount_for_period"] = chatter_update.amount_for_period
            if chatter_update.payment_status is not None:
                update_data["payment_status"] = chatter_update.payment_status
            
            update_data["updated_by"] = current_admin_id
            update_data["updated_at"] = "CURRENT_TIMESTAMP"
            
            if not update_data:
                final_resp["message"] = "No fields to update"
                conn.rollback_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_400_BAD_REQUEST, media_type="application/json")
            
            # Build update query
            set_clause = ", ".join([f"{key} = %s" for key in update_data.keys() if key != "updated_at"])
            set_clause += ", updated_at = CURRENT_TIMESTAMP"
            values = [update_data[key] for key in update_data.keys() if key != "updated_at"]
            values.append(chatter_id)
            
            result = conn.update_table(
                table=TableNames.chatters,
                values_condition=set_clause,
                update_condition="chatter_id = %s",
                params=tuple(values)
            )
            
            if result.get("status") == "Success":
                final_resp["status"] = CommonConstants.success
                final_resp["message"] = "Chatter updated successfully"
                conn.commit_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_200_OK, media_type="application/json")
            else:
                final_resp["message"] = "Failed to update chatter"
                conn.rollback_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")
                
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error updating chatter: {str(e)}")
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")

    async def delete_chatter(self, chatter_id: str):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to delete chatter"}
        try:
            conn = self.postgres_connection()
            conn.begin_transaction()
            
            # First check if chatter exists and is not soft deleted
            condition = "chatter_id = %s AND soft_delete = %s"
            params = (chatter_id, "active")
            existing_chatter = conn.fetch_all_records_with_condition(table=TableNames.chatters, condition=condition, params=params)
            
            if not existing_chatter or len(existing_chatter) == 0:
                final_resp["message"] = "Chatter not found or already deleted"
                conn.rollback_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_404_NOT_FOUND, media_type="application/json")
            
            # Soft delete: Update soft_delete to 'deleted' instead of actually deleting
            update_condition = "chatter_id = %s"
            update_params = (chatter_id,)
            result = conn.update_table(
                table=TableNames.chatters,
                values_condition="soft_delete = %s, updated_at = CURRENT_TIMESTAMP",
                update_condition=update_condition,
                params=("deleted",) + update_params
            )
            
            if result.get("status") == "Success":
                final_resp["status"] = CommonConstants.success
                final_resp["message"] = "Chatter deleted successfully"
                conn.commit_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_200_OK, media_type="application/json")
            else:
                final_resp["message"] = "Failed to delete chatter"
                conn.rollback_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")
                
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error deleting chatter: {str(e)}")
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")

    async def get_chatter_rates(self, chatter_id: str):
        """Get hourly rates for a specific chatter from JSONB"""
        final_resp = {"status": CommonConstants.failed, "message": "Failed to get chatter rates"}
        try:
            conn = self.postgres_connection()
            conn.begin_transaction()
            condition = "chatter_id = %s"
            params = (chatter_id,) 
            result = conn.fetch_all_records_with_condition(table=TableNames.chatter_rates, condition=condition, params=params)
            log.info(f"Chatter rates: {result}")
            if result:
                rates_list = []
                rates_json = result[0].get("rates", {})
                
                if isinstance(rates_json, str):
                    rates_json = json.loads(rates_json)
                
                for models_count, hourly_rate in rates_json.items():
                    rate_info = {
                        "rate_id": result[0].get("rate_id"),
                        "chatter_id": chatter_id,
                        "models_count": int(models_count),
                        "hourly_rate": float(hourly_rate),
                        "created_at": result[0].get("created_at"),
                        "updated_at": result[0].get("updated_at")
                    }
                    # Convert datetime objects to strings
                    rate_info = self._convert_decimal_in_dict(rate_info)
                    rates_list.append(rate_info)
                
                final_resp["status"] = CommonConstants.success
                final_resp["message"] = "Chatter rates retrieved successfully"
                final_resp["data"] = rates_list
            else:
                final_resp["status"] = CommonConstants.success
                final_resp["message"] = "No rates found for this chatter"
                final_resp["data"] = []
            
            conn.commit_transaction()
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_200_OK, media_type="application/json")
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error fetching chatter rates: {str(e)}")
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")

    async def update_chatter_rates(self, rates_update: ChatterRatesUpdate, chatter_id: str, current_admin_id: str):
        """Update multiple rates for a chatter using JSONB"""
        final_resp = {"status": CommonConstants.failed, "message": "Failed to update chatter rates"}
        try:
            conn = self.postgres_connection()
            conn.begin_transaction()
            
            # Check if chatter exists
            existing_chatter = conn.fetch_all_records_with_condition(
                table=TableNames.chatters,
                condition="chatter_id = %s",
                params=(chatter_id,)
            )
            
            if not existing_chatter or len(existing_chatter) == 0:
                final_resp["message"] = "Chatter not found"
                conn.rollback_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_404_NOT_FOUND, media_type="application/json")
            
            # Convert rates to JSONB format
            rates_json = {}
            for rate in rates_update.rates:
                rates_json[str(rate.models_count)] = rate.hourly_rate
            
            # Check if rates record exists for this chatter
            existing_rates = conn.fetch_all_records_with_condition(
                table=TableNames.chatter_rates,
                condition="chatter_id = %s",
                params=(chatter_id,)
            )
            
            if existing_rates and len(existing_rates) > 0:
                # Update existing rates
                values_condition = "rates = %s, updated_by = %s, updated_at = CURRENT_TIMESTAMP"
                result = conn.update_table(
                    table=TableNames.chatter_rates,
                    values_condition=values_condition,
                    update_condition="chatter_id = %s",
                    params=(json.dumps(rates_json), current_admin_id, chatter_id)
                )
                
                if result["status"] == "Success":
                    final_resp["status"] = CommonConstants.success
                    final_resp["message"] = f"All {len(rates_update.rates)} rates updated successfully"
                else:
                    final_resp["message"] = "Failed to update rates"
            else:
                # Add new rates record
                add_rates = {
                    "chatter_id": chatter_id,
                    "rates": json.dumps(rates_json),
                    "created_by": current_admin_id
                }
                
                result = conn.insert_dict_into_table(
                    table=TableNames.chatter_rates,
                    data_dict=add_rates
                )
                
                if result["status"] == CommonConstants.success:
                    final_resp["status"] = CommonConstants.success
                    final_resp["message"] = f"All {len(rates_update.rates)} rates added successfully"
                else:
                    final_resp["message"] = "Failed to add rates"
            
            conn.commit_transaction()
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_200_OK, media_type="application/json")
            
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error updating chatter rates: {str(e)}")
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")

    async def add_chatter_rate(self, rate_data: dict, current_admin_id: str):
        """Add a single rate for a chatter using JSONB"""
        final_resp = {"status": CommonConstants.failed, "message": "Failed to add chatter rate"}
        try:
            conn = self.postgres_connection()
            conn.begin_transaction()
            
            # Check if chatter exists
            existing_chatter = conn.fetch_all_records_with_condition(
                table=TableNames.chatters,
                condition="chatter_id = %s",
                params=(rate_data["chatter_id"],)
            )
            
            if not existing_chatter or len(existing_chatter) == 0:
                final_resp["message"] = "Chatter not found"
                conn.rollback_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_404_NOT_FOUND, media_type="application/json")
            
            # Check if rates record exists for this chatter
            existing_rates = conn.fetch_all_records_with_condition(
                table=TableNames.chatter_rates,
                condition="chatter_id = %s",
                params=(rate_data["chatter_id"],)
            )
            
            if existing_rates and len(existing_rates) > 0:
                # Update existing rates record
                rates_json = existing_rates[0].get("rates", {})
                if isinstance(rates_json, str):
                    rates_json = json.loads(rates_json)
                
                # Check if rate for this models_count already exists
                if str(rate_data["models_count"]) in rates_json:
                    final_resp["message"] = f"Rate for {rate_data['models_count']} models already exists for this chatter"
                    conn.rollback_transaction()
                    return Response(content=json.dumps(final_resp), status_code=status.HTTP_400_BAD_REQUEST, media_type="application/json")
                
                # Add new rate to existing rates
                rates_json[str(rate_data["models_count"])] = rate_data["hourly_rate"]
                
                values_condition = "rates = %s, updated_by = %s, updated_at = CURRENT_TIMESTAMP"
                result = conn.update_table(
                    table=TableNames.chatter_rates,
                    values_condition=values_condition,
                    update_condition="chatter_id = %s",
                    params=(json.dumps(rates_json), current_admin_id, rate_data["chatter_id"])
                )
                
                if result["status"] == "Success":
                    final_resp["status"] = CommonConstants.success
                    final_resp["message"] = f"Rate for {rate_data['models_count']} models added successfully"
                else:
                    final_resp["message"] = "Failed to add rate"
            else:
                # Create new rates record
                rates_json = {str(rate_data["models_count"]): rate_data["hourly_rate"]}
                
                add_rates = {
                    "chatter_id": rate_data["chatter_id"],
                    "rates": json.dumps(rates_json),
                    "created_by": current_admin_id
                }
                
                result = conn.insert_dict_into_table(
                    table=TableNames.chatter_rates,
                    data_dict=add_rates,
                    returning_columns=['rate_id']
                )
                
                if result["status"] == CommonConstants.success:
                    final_resp["status"] = CommonConstants.success
                    final_resp["message"] = f"Rate for {rate_data['models_count']} models added successfully"
                    final_resp["data"] = {"rate_id": result["result"]["rate_id"]}
                else:
                    final_resp["message"] = "Failed to add rate"
            
            conn.commit_transaction()
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_200_OK, media_type="application/json")
            
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error adding chatter rate: {str(e)}")
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")

    async def delete_chatter_rate(self, rate_id: str):
        """Delete a specific rate for a chatter"""
        final_resp = {"status": CommonConstants.failed, "message": "Failed to delete chatter rate"}
        try:
            conn = self.postgres_connection()
            conn.begin_transaction()
            
            # Check if rate exists
            existing_rate = conn.fetch_all_records_with_condition(
                table=TableNames.chatter_rates,
                condition="rate_id = %s",
                params=(rate_id,)
            )
            
            if not existing_rate or len(existing_rate) == 0:
                final_resp["message"] = "Rate not found"
                conn.rollback_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_404_NOT_FOUND, media_type="application/json")
            
            # Delete the rate
            result = conn.delete_records(
                table=TableNames.chatter_rates,
                delete_condition="rate_id = %s",
                params=(rate_id,)
            )
            
            if result:
                final_resp["status"] = CommonConstants.success
                final_resp["message"] = "Rate deleted successfully"
                conn.commit_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_200_OK, media_type="application/json")
            else:
                final_resp["message"] = "Failed to delete rate"
                conn.rollback_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")
                
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error deleting chatter rate: {str(e)}")
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")
