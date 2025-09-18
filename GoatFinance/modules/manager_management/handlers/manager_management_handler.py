import json
from typing import List, Dict, Any, Optional
from decimal import Decimal
from datetime import datetime
from scripts.utils.common_utils import PostgresConnection
from scripts.constants.app_constants import GFTableNames, ResponseConstants, HTTPResponses
from scripts.logging.log_module import logger
from modules.manager_management.models.manager_management_models import (
    ManagerCreate, ManagerUpdate, AssistantCreate, AssistantUpdate,
    ManagerSalaryCreate, AssistantSalaryCreate
)

class ManagerManagementHandler:
    def __init__(self):
        try:
            self.db_object_utility = PostgresConnection()
        except Exception as e:
            logger.error(str(e))

    def postgres_connection(self):
        try:
            return self.db_object_utility.connect_to_postgres_utility()
        except Exception as e:
            logger.error("Exception Occurred While Connection to Postgres" + str(e))

    def close_postgres_connection(self):
        try:
            return self.db_object_utility.close_connection()
        except Exception as e:
            logger.error("Exception Occurred While Closing Postgres Connection" + str(e))

    def register_manager(self, manager_data: ManagerCreate, admin_id: str) -> Dict[str, Any]:
        """Register a new manager or team leader"""
        final_resp = {"message": "Unable to register manager. Please try again.", "status": "Failed"}
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()
            
            # Check if telegram username already exists
            existing_manager = conn.fetch_all_records_with_condition(
                GFTableNames.managers,
                condition="telegram_username = %s AND soft_delete = 'active'",
                params=(manager_data.telegram_username,)
            )
            
            if len(existing_manager) > 0:
                final_resp["message"] = "Manager with this telegram username already exists"
                return final_resp

            # Prepare manager data
            add_manager = {
                "name": manager_data.name,
                "role": manager_data.role,
                "telegram_username": manager_data.telegram_username,
                "email": manager_data.email,
                "phone": manager_data.phone,
                "status": manager_data.status,
                "salary_type": manager_data.salary_type,
                "revenue_threshold": manager_data.revenue_threshold,
                "commission_rate": manager_data.commission_rate,
                "fixed_salary": manager_data.fixed_salary,
                "assigned_models": json.dumps(manager_data.assigned_models or []),
                "created_by": admin_id
            }
            
            result = conn.insert_dict_into_table(
                table=GFTableNames.managers,
                data_dict=add_manager,
                returning_columns=['manager_id']
            )
            
            if result["status"] != "Success":
                logger.error("Failed to insert manager")
                final_resp["message"] = "Failed to create manager"
                conn.rollback_transaction()
                return final_resp

            manager_id = result["result"]["manager_id"]
            logger.info(f"Manager created successfully with ID: {manager_id}")

            final_resp["status"] = "Success"
            final_resp["message"] = f"{manager_data.role} registered successfully"
            final_resp["data"] = {"manager_id": manager_id}
            
            conn.commit_transaction()
            return final_resp
                
        except Exception as e:
            logger.error(f"Exception in register_manager: {str(e)}")
            conn.rollback_transaction()
            return final_resp
        finally:
            self.close_postgres_connection()

    def register_assistant(self, assistant_data: AssistantCreate, admin_id: str) -> Dict[str, Any]:
        """Register a new assistant"""
        final_resp = {"message": "Unable to register assistant. Please try again.", "status": "Failed"}
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()
            
            # Check if telegram username already exists
            existing_assistant = conn.fetch_all_records_with_condition(
                GFTableNames.assistants,
                condition="telegram_username = %s AND soft_delete = 'active'",
                params=(assistant_data.telegram_username,)
            )
            
            if len(existing_assistant) > 0:
                final_resp["message"] = "Assistant with this telegram username already exists"
                return final_resp

            # Prepare assistant data
            add_assistant = {
                "name": assistant_data.name,
                "telegram_username": assistant_data.telegram_username,
                "status": assistant_data.status,
                "salary_type": assistant_data.salary_type,
                "fixed_salary": assistant_data.fixed_salary,
                "salary_period": assistant_data.salary_period,
                "created_by": admin_id
            }
            
            result = conn.insert_dict_into_table(
                table=GFTableNames.assistants,
                data_dict=add_assistant,
                returning_columns=['assistant_id']
            )
            
            if result["status"] != "Success":
                logger.error("Failed to insert assistant")
                final_resp["message"] = "Failed to create assistant"
                conn.rollback_transaction()
                return final_resp

            assistant_id = result["result"]["assistant_id"]
            logger.info(f"Assistant created successfully with ID: {assistant_id}")

            final_resp["status"] = "Success"
            final_resp["message"] = "Assistant registered successfully"
            final_resp["data"] = {"assistant_id": assistant_id}
            
            conn.commit_transaction()
            return final_resp
                
        except Exception as e:
            logger.error(f"Exception in register_assistant: {str(e)}")
            conn.rollback_transaction()
            return final_resp
        finally:
            self.close_postgres_connection()

    def get_all_managers(self, limit: int = 100, offset: int = 0, query: str = "", 
                        sort: str = "desc", sort_by: str = "created_at", role_filter: str = None) -> Dict[str, Any]:
        """Get all managers with pagination and search"""
        final_resp = {"message": "Unable to fetch managers. Please try again.", "status": "Failed"}
        conn = self.postgres_connection()
        try:
            # Ensure cursor is initialized
            conn.begin_transaction()
            # Build search condition
            search_condition = ""
            search_params = []
            
            if query:
                search_condition = "AND (name ILIKE %s OR telegram_username ILIKE %s OR role ILIKE %s)"
                search_params = [f"%{query}%", f"%{query}%", f"%{query}%"]
            
            # Add role filter if specified
            if role_filter:
                search_condition += " AND role = %s"
                search_params.append(role_filter)

            # Get managers with pagination
            managers_data = conn.fetch_all_records_with_condition(
                GFTableNames.managers,
                condition=f"soft_delete = 'active' {search_condition} ORDER BY {sort_by} {sort.upper()} LIMIT %s OFFSET %s",
                params=search_params + [limit, offset]
            )
            
            # Get total count
            # Use helper to fetch count
            total_count = conn.fetch_count(GFTableNames.managers, condition=f"soft_delete = 'active' {search_condition}", params=search_params)
            
            # Format results
            managers = []
            for manager in managers_data:
                assigned_models = json.loads(manager.get("assigned_models", "[]")) if manager.get("assigned_models") else []
                managers.append({
                    "manager_id": manager.get("manager_id"),
                    "name": manager.get("name"),
                    "role": manager.get("role"),
                    "telegram_username": manager.get("telegram_username"),
                    "email": manager.get("email"),
                    "phone": manager.get("phone"),
                    "status": manager.get("status"),
                    "salary_type": manager.get("salary_type"),
                    "revenue_threshold": float(manager.get("revenue_threshold")) if manager.get("revenue_threshold") else None,
                    "commission_rate": float(manager.get("commission_rate")) if manager.get("commission_rate") else None,
                    "fixed_salary": float(manager.get("fixed_salary")) if manager.get("fixed_salary") else None,
                    "assigned_models": assigned_models,
                    "created_at": manager.get("created_at").isoformat() if manager.get("created_at") else None,
                    "updated_at": manager.get("updated_at").isoformat() if manager.get("updated_at") else None
                })
            
            final_resp["status"] = "Success"
            final_resp["message"] = "Managers fetched successfully"
            final_resp["data"] = managers
            final_resp["total_count"] = total_count
            
            conn.rollback_transaction()
            return final_resp
                
        except Exception as e:
            logger.error(f"Exception in get_all_managers: {str(e)}")
            try:
                conn.rollback_transaction()
            except Exception:
                pass
            return final_resp
        finally:
            self.close_postgres_connection()

    async def get_all_assistants(self, limit: int = 100, offset: int = 0, query: str = "", 
                                sort: str = "desc", sort_by: str = "created_at") -> Dict[str, Any]:
        """Get all assistants with pagination and search"""
        final_resp = {"message": "An error occurred while retrieving assistants", "status": "Failed"}
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()
            # Build search condition
            search_condition = ""
            search_params = []
            
            if query:
                search_condition = "AND (name ILIKE %s OR telegram_username ILIKE %s)"
                search_params = [f"%{query}%", f"%{query}%"]

            assistants_data = conn.fetch_all_records_with_condition(
                GFTableNames.assistants,
                condition=f"soft_delete = 'active' {search_condition} ORDER BY {sort_by} {sort.upper()} LIMIT %s OFFSET %s",
                params=search_params + [limit, offset]
            )

            total_count = conn.fetch_count(GFTableNames.assistants, condition=f"soft_delete = 'active' {search_condition}", params=search_params)

            assistants = []
            for row in assistants_data:
                assistants.append({
                    "assistant_id": row.get("assistant_id"),
                    "name": row.get("name"),
                    "telegram_username": row.get("telegram_username"),
                    "status": row.get("status"),
                    "salary_type": row.get("salary_type"),
                    "fixed_salary": float(row.get("fixed_salary")) if row.get("fixed_salary") else 0,
                    "salary_period": row.get("salary_period"),
                    "created_at": row.get("created_at").isoformat() if row.get("created_at") else None,
                    "updated_at": row.get("updated_at").isoformat() if row.get("updated_at") else None
                })

            final_resp["status"] = "Success"
            final_resp["message"] = "Assistants retrieved successfully"
            final_resp["data"] = assistants
            final_resp["total_count"] = total_count
            conn.rollback_transaction()
            return final_resp
        except Exception as e:
            logger.error(f"Exception in get_all_assistants: {str(e)}")
            try:
                conn.rollback_transaction()
            except Exception:
                pass
            return final_resp
        finally:
            self.close_postgres_connection()

    async def get_manager_details(self, manager_id: str) -> Dict[str, Any]:
        """Get manager details by ID"""
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()
            result = conn.fetch_all_records_with_condition(
                GFTableNames.managers,
                condition="manager_id = %s AND soft_delete = 'active'",
                params=(manager_id,)
            )
            if not result:
                conn.rollback_transaction()
                return {"status": "Failed", "message": "Manager not found"}

            row = result[0]
            assigned_models = json.loads(row.get("assigned_models", "[]")) if row.get("assigned_models") else []
            manager_data = {
                "manager_id": row.get("manager_id"),
                "name": row.get("name"),
                "role": row.get("role"),
                "telegram_username": row.get("telegram_username"),
                "email": row.get("email"),
                "phone": row.get("phone"),
                "status": row.get("status"),
                "salary_type": row.get("salary_type"),
                "revenue_threshold": float(row.get("revenue_threshold")) if row.get("revenue_threshold") else None,
                "commission_rate": float(row.get("commission_rate")) if row.get("commission_rate") else None,
                "fixed_salary": float(row.get("fixed_salary")) if row.get("fixed_salary") else None,
                "assigned_models": assigned_models,
                "created_at": row.get("created_at").isoformat() if row.get("created_at") else None,
                "updated_at": row.get("updated_at").isoformat() if row.get("updated_at") else None
            }
            conn.rollback_transaction()
            return {"status": "Success", "message": "Manager details retrieved successfully", "data": manager_data}
        except Exception as e:
            logger.error(f"Exception in get_manager_details: {str(e)}")
            try:
                conn.rollback_transaction()
            except Exception:
                pass
            return {"status": "Failed", "message": "An error occurred while retrieving manager details"}

    async def get_assistant_details(self, assistant_id: str) -> Dict[str, Any]:
        """Get assistant details by ID"""
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()
            result = conn.fetch_all_records_with_condition(
                GFTableNames.assistants,
                condition="assistant_id = %s AND soft_delete = 'active'",
                params=(assistant_id,)
            )
            if not result:
                conn.rollback_transaction()
                return {"status": "Failed", "message": "Assistant not found"}

            row = result[0]
            assistant_data = {
                "assistant_id": row.get("assistant_id"),
                "name": row.get("name"),
                "telegram_username": row.get("telegram_username"),
                "status": row.get("status"),
                "salary_type": row.get("salary_type"),
                "fixed_salary": float(row.get("fixed_salary")) if row.get("fixed_salary") else 0,
                "salary_period": row.get("salary_period"),
                "created_at": row.get("created_at").isoformat() if row.get("created_at") else None,
                "updated_at": row.get("updated_at").isoformat() if row.get("updated_at") else None
            }
            conn.rollback_transaction()
            return {"status": "Success", "message": "Assistant details retrieved successfully", "data": assistant_data}
        except Exception as e:
            logger.error(f"Exception in get_assistant_details: {str(e)}")
            try:
                conn.rollback_transaction()
            except Exception:
                pass
            return {"status": "Failed", "message": "An error occurred while retrieving assistant details"}

    async def update_manager(self, manager_id: str, manager_update: ManagerUpdate, admin_id: str) -> Dict[str, Any]:
        """Update manager details"""
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()
            # Check if manager exists
            existing = conn.fetch_all_records_with_condition(
                GFTableNames.managers,
                condition="manager_id = %s AND soft_delete = 'active'",
                params=(manager_id,)
            )
            if not existing:
                conn.rollback_transaction()
                return {"status": "Failed", "message": "Manager not found"}

            # Build update query dynamically
            update_fields = []
            params = []
            
            if manager_update.name is not None:
                update_fields.append("name = %s")
                params.append(manager_update.name)
            if manager_update.role is not None:
                update_fields.append("role = %s")
                params.append(manager_update.role)
            if manager_update.telegram_username is not None:
                # Check if telegram username already exists for other managers
                username_exists = conn.fetch_all_records_with_condition(
                    GFTableNames.managers,
                    condition="telegram_username = %s AND manager_id != %s AND soft_delete = 'active'",
                    params=(manager_update.telegram_username, manager_id)
                )
                if username_exists:
                    conn.rollback_transaction()
                    return {"status": "Failed", "message": "Telegram username already exists"}
                update_fields.append("telegram_username = %s")
                params.append(manager_update.telegram_username)
            if manager_update.email is not None:
                update_fields.append("email = %s")
                params.append(manager_update.email)
            if manager_update.phone is not None:
                update_fields.append("phone = %s")
                params.append(manager_update.phone)
            if manager_update.status is not None:
                update_fields.append("status = %s")
                params.append(manager_update.status)
            if manager_update.salary_type is not None:
                update_fields.append("salary_type = %s")
                params.append(manager_update.salary_type)
            if manager_update.revenue_threshold is not None:
                update_fields.append("revenue_threshold = %s")
                params.append(manager_update.revenue_threshold)
            if manager_update.commission_rate is not None:
                update_fields.append("commission_rate = %s")
                params.append(manager_update.commission_rate)
            if manager_update.fixed_salary is not None:
                update_fields.append("fixed_salary = %s")
                params.append(manager_update.fixed_salary)
            if manager_update.assigned_models is not None:
                update_fields.append("assigned_models = %s")
                params.append(json.dumps(manager_update.assigned_models))

            if not update_fields:
                conn.rollback_transaction()
                return {"status": "Failed", "message": "No fields to update"}

            update_fields.append("updated_by = %s")
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            params.extend([admin_id, manager_id])

            values_condition = ', '.join(update_fields)
            update_condition = "manager_id = %s"
            result = conn.update_table(GFTableNames.managers, values_condition, update_condition, tuple(params))

            if result and result.get("status") == "Success":
                conn.commit_transaction()
                return {"status": "Success", "message": "Manager updated successfully"}
            else:
                conn.rollback_transaction()
                return {"status": "Failed", "message": "Failed to update manager"}
        except Exception as e:
            logger.error(f"Exception in update_manager: {str(e)}")
            try:
                conn.rollback_transaction()
            except Exception:
                pass
            return {"status": "Failed", "message": "An error occurred while updating manager"}

    async def update_assistant(self, assistant_id: str, assistant_update: AssistantUpdate, admin_id: str) -> Dict[str, Any]:
        """Update assistant details"""
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()
            # Check if assistant exists
            existing = conn.fetch_all_records_with_condition(
                GFTableNames.assistants,
                condition="assistant_id = %s AND soft_delete = 'active'",
                params=(assistant_id,)
            )
            if not existing:
                conn.rollback_transaction()
                return {"status": "Failed", "message": "Assistant not found"}

            # Build update query dynamically
            update_fields = []
            params = []
            
            if assistant_update.name is not None:
                update_fields.append("name = %s")
                params.append(assistant_update.name)
            if assistant_update.telegram_username is not None:
                # Check if telegram username already exists for other assistants
                username_exists = conn.fetch_all_records_with_condition(
                    GFTableNames.assistants,
                    condition="telegram_username = %s AND assistant_id != %s AND soft_delete = 'active'",
                    params=(assistant_update.telegram_username, assistant_id)
                )
                if username_exists:
                    conn.rollback_transaction()
                    return {"status": "Failed", "message": "Telegram username already exists"}
                update_fields.append("telegram_username = %s")
                params.append(assistant_update.telegram_username)
            if assistant_update.status is not None:
                update_fields.append("status = %s")
                params.append(assistant_update.status)
            if assistant_update.fixed_salary is not None:
                update_fields.append("fixed_salary = %s")
                params.append(assistant_update.fixed_salary)
            if assistant_update.salary_period is not None:
                update_fields.append("salary_period = %s")
                params.append(assistant_update.salary_period)

            if not update_fields:
                conn.rollback_transaction()
                return {"status": "Failed", "message": "No fields to update"}

            update_fields.append("updated_by = %s")
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            params.extend([admin_id, assistant_id])

            values_condition = ', '.join(update_fields)
            update_condition = "assistant_id = %s"
            result = conn.update_table(GFTableNames.assistants, values_condition, update_condition, tuple(params))

            if result and result.get("status") == "Success":
                conn.commit_transaction()
                return {"status": "Success", "message": "Assistant updated successfully"}
            else:
                conn.rollback_transaction()
                return {"status": "Failed", "message": "Failed to update assistant"}
        except Exception as e:
            logger.error(f"Exception in update_assistant: {str(e)}")
            try:
                conn.rollback_transaction()
            except Exception:
                pass
            return {"status": "Failed", "message": "An error occurred while updating assistant"}

    async def delete_manager(self, manager_id: str) -> Dict[str, Any]:
        """Soft delete manager"""
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()
            existing = conn.fetch_all_records_with_condition(
                GFTableNames.managers,
                condition="manager_id = %s AND soft_delete = 'active'",
                params=(manager_id,)
            )
            if not existing:
                conn.rollback_transaction()
                return {"status": "Failed", "message": "Manager not found"}

            values_condition = "soft_delete = 'deleted', updated_at = CURRENT_TIMESTAMP"
            update_condition = "manager_id = %s"
            result = conn.update_table(GFTableNames.managers, values_condition, update_condition, (manager_id,))

            if result and result.get("status") == "Success":
                conn.commit_transaction()
                return {"status": "Success", "message": "Manager deleted successfully"}
            else:
                conn.rollback_transaction()
                return {"status": "Failed", "message": "Failed to delete manager"}
        except Exception as e:
            logger.error(f"Exception in delete_manager: {str(e)}")
            try:
                conn.rollback_transaction()
            except Exception:
                pass
            return {"status": "Failed", "message": "An error occurred while deleting manager"}

    async def delete_assistant(self, assistant_id: str) -> Dict[str, Any]:
        """Soft delete assistant"""
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()
            existing = conn.fetch_all_records_with_condition(
                GFTableNames.assistants,
                condition="assistant_id = %s AND soft_delete = 'active'",
                params=(assistant_id,)
            )
            if not existing:
                conn.rollback_transaction()
                return {"status": "Failed", "message": "Assistant not found"}

            values_condition = "soft_delete = 'deleted', updated_at = CURRENT_TIMESTAMP"
            update_condition = "assistant_id = %s"
            result = conn.update_table(GFTableNames.assistants, values_condition, update_condition, (assistant_id,))

            if result and result.get("status") == "Success":
                conn.commit_transaction()
                return {"status": "Success", "message": "Assistant deleted successfully"}
            else:
                conn.rollback_transaction()
                return {"status": "Failed", "message": "Failed to delete assistant"}
        except Exception as e:
            logger.error(f"Exception in delete_assistant: {str(e)}")
            try:
                conn.rollback_transaction()
            except Exception:
                pass
            return {"status": "Failed", "message": "An error occurred while deleting assistant"}

    # Salary calculation methods will be implemented in the next step
    def calculate_manager_salary(self, manager_id: str, period: str, year: int) -> Dict[str, Any]:
        """Calculate manager salary for a specific period"""
        # This will be implemented with business logic for salary calculation
        pass

    def calculate_assistant_salary(self, assistant_id: str, period: str, year: int) -> Dict[str, Any]:
        """Calculate assistant salary for a specific period"""
        # This will be implemented with business logic for salary calculation
        pass

    def get_managers_with_period_salaries(self, periods: List[str], year: int):
        """Get all managers with their salary data for specified periods"""
        final_resp = {"status": ResponseConstants.failed, "message": "Failed to get managers with salaries"}
        conn = self.postgres_connection()
        try:
            # Ensure a transaction/cursor is available for reads
            conn.begin_transaction()
            # Get all managers
            managers = conn.fetch_all_records_with_condition(
                GFTableNames.managers, 
                "soft_delete = %s", 
                ("active",)
            )
            
            # Get salary data for specified periods
            period_placeholders = ','.join(['%s'] * len(periods))
            salary_condition = f"period IN ({period_placeholders}) AND year = %s"
            salary_params = periods + [year]
            
            salaries = conn.fetch_all_records_with_condition(
                GFTableNames.manager_salaries,
                salary_condition,
                salary_params
            )
            
            # Create salary lookup
            salary_lookup = {}
            for salary in salaries or []:
                manager_id = salary.get("manager_id")
                period = salary.get("period")
                if manager_id not in salary_lookup:
                    salary_lookup[manager_id] = {}
                salary_lookup[manager_id][period] = {
                    "week1_salary": float(salary.get("week1_salary", 0)),
                    "week2_salary": float(salary.get("week2_salary", 0)),
                    "total_salary": float(salary.get("total_salary", 0)),
                    "payment_status": salary.get("payment_status", "Not Paid")
                }
            
            # Enrich managers with salary data
            enriched_managers = []
            for manager in managers or []:
                manager_id = manager.get("manager_id")
                manager_data = {
                    "manager_id": manager_id,
                    "name": manager.get("name"),
                    "role": manager.get("role"),
                    "telegram_username": manager.get("telegram_username"),
                    "email": manager.get("email"),
                    "phone": manager.get("phone"),
                    "status": manager.get("status"),
                    "salary_type": manager.get("salary_type"),
                    "revenue_threshold": float(manager.get("revenue_threshold", 0)),
                    "commission_rate": float(manager.get("commission_rate", 0)),
                    "fixed_salary": float(manager.get("fixed_salary", 0)),
                    "assigned_models": manager.get("assigned_models", []),
                    "created_at": manager.get("created_at"),
                    "updated_at": manager.get("updated_at"),
                    "period_salaries": salary_lookup.get(manager_id, {})
                }
                enriched_managers.append(manager_data)
            
            final_resp["status"] = ResponseConstants.success
            final_resp["message"] = "Managers with salaries retrieved successfully"
            final_resp["data"] = {
                "managers": enriched_managers,
                "periods": periods,
                "year": year
            }
            # End read transaction
            conn.rollback_transaction()
            return final_resp
        except Exception as e:
            logger.error(f"Error in get_managers_with_period_salaries: {str(e)}")
            try:
                conn.rollback_transaction()
            except Exception:
                pass
            return final_resp

    def update_manager_salary_payment_status(self, manager_id: str, period: str, year: int, payment_status: str, admin_id: Optional[str] = None) -> Dict[str, Any]:
        """Update or create a manager_salaries record's payment_status for a given manager/period/year"""
        final_resp = {"status": ResponseConstants.failed, "message": "Failed to update payment status"}
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()
            # Check if row exists
            existing = conn.fetch_all_records_with_condition(
                GFTableNames.manager_salaries,
                "manager_id = %s AND period = %s AND year = %s",
                (manager_id, period, year)
            )

            if existing and len(existing) > 0:
                # Update
                values_condition = "payment_status = %s, updated_at = CURRENT_TIMESTAMP" + (", updated_by = %s" if admin_id else "")
                params = (payment_status,) + ((admin_id,) if admin_id else tuple()) + (manager_id, period, year)
                update_condition = "manager_id = %s AND period = %s AND year = %s"
                result = conn.update_table(GFTableNames.manager_salaries, values_condition, update_condition, params)
                if result and result.get("status") == "Success":
                    conn.commit_transaction()
                    return {"status": ResponseConstants.success, "message": "Payment status updated"}
                else:
                    conn.rollback_transaction()
                    return final_resp
            else:
                # Insert with zero salaries and specified status
                data = {
                    "manager_id": manager_id,
                    "period": period,
                    "year": year,
                    "week1_salary": 0.00,
                    "week2_salary": 0.00,
                    "total_salary": 0.00,
                    "payment_status": payment_status,
                    "created_by": admin_id
                }
                result = conn.insert_dict_into_table(
                    table=GFTableNames.manager_salaries,
                    data_dict=data,
                    returning_columns=["salary_id"]
                )
                if result and result.get("status") == "Success":
                    conn.commit_transaction()
                    return {"status": ResponseConstants.success, "message": "Payment status set"}
                else:
                    conn.rollback_transaction()
                    return final_resp
        except Exception as e:
            logger.error(f"Error in update_manager_salary_payment_status: {str(e)}")
            try:
                conn.rollback_transaction()
            except Exception:
                pass
            return final_resp
        finally:
            self.close_postgres_connection()

    def get_assistants_with_period_salaries(self, periods: List[str], year: int):
        """Get all assistants with their salary data for specified periods"""
        final_resp = {"status": ResponseConstants.failed, "message": "Failed to get assistants with salaries"}
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()
            assistants = conn.fetch_all_records_with_condition(
                GFTableNames.assistants,
                "soft_delete = %s",
                ("active",)
            )
            period_placeholders = ','.join(['%s'] * len(periods))
            salary_condition = f"period IN ({period_placeholders}) AND year = %s"
            salary_params = periods + [year]
            salaries = conn.fetch_all_records_with_condition(
                GFTableNames.assistant_salaries,
                salary_condition,
                salary_params
            )
            salary_lookup = {}
            for salary in salaries or []:
                assistant_id = salary.get("assistant_id")
                period = salary.get("period")
                if assistant_id not in salary_lookup:
                    salary_lookup[assistant_id] = {}
                salary_lookup[assistant_id][period] = {
                    "week1_salary": float(salary.get("week1_salary", 0)),
                    "week2_salary": float(salary.get("week2_salary", 0)),
                    "total_salary": float(salary.get("total_salary", 0)),
                    "payment_status": salary.get("payment_status", "Not Paid")
                }
            enriched = []
            for a in assistants or []:
                enriched.append({
                    "assistant_id": a.get("assistant_id"),
                    "name": a.get("name"),
                    "telegram_username": a.get("telegram_username"),
                    "status": a.get("status"),
                    "salary_type": a.get("salary_type"),
                    "fixed_salary": float(a.get("fixed_salary", 0)),
                    "salary_period": a.get("salary_period"),
                    "created_at": a.get("created_at"),
                    "updated_at": a.get("updated_at"),
                    "period_salaries": salary_lookup.get(a.get("assistant_id"), {})
                })
            final_resp["status"] = ResponseConstants.success
            final_resp["message"] = "Assistants with salaries retrieved successfully"
            final_resp["data"] = {"assistants": enriched, "periods": periods, "year": year}
            conn.rollback_transaction()
            return final_resp
        except Exception as e:
            logger.error(f"Error in get_assistants_with_period_salaries: {str(e)}")
            try:
                conn.rollback_transaction()
            except Exception:
                pass
            return final_resp
        finally:
            self.close_postgres_connection()

    def update_assistant_salary_payment_status(self, assistant_id: str, period: str, year: int, payment_status: str, admin_id: Optional[str] = None) -> Dict[str, Any]:
        final_resp = {"status": ResponseConstants.failed, "message": "Failed to update payment status"}
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()
            existing = conn.fetch_all_records_with_condition(
                GFTableNames.assistant_salaries,
                "assistant_id = %s AND period = %s AND year = %s",
                (assistant_id, period, year)
            )
            if existing and len(existing) > 0:
                values_condition = "payment_status = %s, updated_at = CURRENT_TIMESTAMP" + (", updated_by = %s" if admin_id else "")
                params = (payment_status,) + ((admin_id,) if admin_id else tuple()) + (assistant_id, period, year)
                update_condition = "assistant_id = %s AND period = %s AND year = %s"
                result = conn.update_table(GFTableNames.assistant_salaries, values_condition, update_condition, params)
                if result and result.get("status") == "Success":
                    conn.commit_transaction()
                    return {"status": ResponseConstants.success, "message": "Payment status updated"}
                else:
                    conn.rollback_transaction()
                    return final_resp
            else:
                data = {
                    "assistant_id": assistant_id,
                    "period": period,
                    "year": year,
                    "week1_salary": 0.00,
                    "week2_salary": 0.00,
                    "total_salary": 0.00,
                    "payment_status": payment_status,
                    "created_by": admin_id
                }
                result = conn.insert_dict_into_table(GFTableNames.assistant_salaries, data, returning_columns=["salary_id"])
                if result and result.get("status") == "Success":
                    conn.commit_transaction()
                    return {"status": ResponseConstants.success, "message": "Payment status set"}
                else:
                    conn.rollback_transaction()
                    return final_resp
        except Exception as e:
            logger.error(f"Error in update_assistant_salary_payment_status: {str(e)}")
            try:
                conn.rollback_transaction()
            except Exception:
                pass
            return final_resp
        finally:
            self.close_postgres_connection()
