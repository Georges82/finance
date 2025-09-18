import json
from typing import Dict, Any, List, Optional
from scripts.utils.common_utils import PostgresConnection
from scripts.constants.app_constants import GFTableNames, CommonConstants
from scripts.logging.log_module import logger as log
from modules.model_management.models.model_management_models import ModelCreate, ModelUpdate


class ModelManagementHandler:
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

    def close_postgres_connection(self):
        try:
            return self.db_object_utility.close_connection()
        except Exception as e:
            log.error("Exception Occurred While Closing Postgres Connection" + str(e))

    def _convert_decimal_to_float(self, value):
        if value is not None:
            if hasattr(value, '__float__'):
                return float(value)
            elif hasattr(value, 'isoformat'):
                return value.isoformat()
        return value

    def _convert_decimal_in_dict(self, data_dict):
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

    def register_model(self, model: ModelCreate, current_admin_id: str):
        final_resp = {"message": "Unable to register model. Please try again.", "status": CommonConstants.failed}
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()

            existing = conn.fetch_all_records_with_condition(
                GFTableNames.models,
                condition="model_name = %s AND soft_delete = 'active'",
                params=(model.modelName,)
            )
            if existing:
                final_resp["message"] = "Model with this name already exists"
                conn.rollback_transaction()
                return final_resp

            add_model = {
                "model_name": model.modelName,
                "client_agency_name": model.clientAgencyName,
                "manager_name": model.managerName,
                "team_leader": model.teamLeader,
                "status": model.status,
                "notes": model.notes,
                "earnings_type": model.earningsType,
                "cut_logic": json.dumps(model.cutLogic.dict(exclude_none=True)),
                "commission_rules": json.dumps(model.commissionRules.dict(exclude_none=True)),
                "referenced_models": json.dumps(model.referencedModels or []),
                "payment_status": model.paymentStatus or 'Not Paid',
                "created_by": current_admin_id
            }

            result = conn.insert_dict_into_table(
                table=GFTableNames.models,
                data_dict=add_model,
                returning_columns=['model_id']
            )

            if result.get("status") != CommonConstants.success:
                log.error("Failed to insert model")
                final_resp["message"] = "Failed to create model"
                conn.rollback_transaction()
                return final_resp

            model_id = result["result"]["model_id"]
            log.info(f"Model created successfully with ID: {model_id}")

            final_resp["status"] = CommonConstants.success
            final_resp["message"] = "Model registered successfully"
            final_resp["data"] = {"model_id": model_id}
            conn.commit_transaction()
            return final_resp
        except Exception as e:
            log.error(f"Error registering model: {str(e)}")
            try:
                conn.rollback_transaction()
            except Exception:
                pass
            return final_resp
        finally:
            self.close_postgres_connection()

    def get_all_models(self, limit: int = 100, offset: int = 0, query: str = "", sort: str = "desc", sort_by: str = "created_at",
                        status_filter: Optional[str] = None, client_agency_name: Optional[str] = None,
                        manager_name: Optional[str] = None, team_leader: Optional[str] = None):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to get all models"}
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()
            conditions = ["soft_delete = 'active'"]
            params: List[Any] = []

            if query:
                conditions.append("(model_name ILIKE %s OR client_agency_name ILIKE %s OR manager_name ILIKE %s OR team_leader ILIKE %s)")
                q = f"%{query}%"
                params.extend([q, q, q, q])
            if status_filter and status_filter in ["Active", "Inactive"]:
                conditions.append("status = %s")
                params.append(status_filter)
            if client_agency_name:
                conditions.append("client_agency_name = %s")
                params.append(client_agency_name)
            if manager_name:
                conditions.append("manager_name = %s")
                params.append(manager_name)
            if team_leader:
                conditions.append("team_leader = %s")
                params.append(team_leader)

            where_clause = " AND ".join(conditions)
            records = conn.fetch_all_records_with_condition(
                GFTableNames.models,
                condition=f"{where_clause} ORDER BY {sort_by} {sort.upper()} LIMIT %s OFFSET %s",
                params=params + [limit, offset]
            )

            total_count = conn.fetch_count(GFTableNames.models, condition=where_clause, params=params)

            models_list = []
            for row in records or []:
                cut_logic = row.get("cut_logic") or {}
                commission_rules = row.get("commission_rules") or {}
                referenced_models = row.get("referenced_models") or []
                if isinstance(cut_logic, str):
                    cut_logic = json.loads(cut_logic)
                if isinstance(commission_rules, str):
                    commission_rules = json.loads(commission_rules)
                if isinstance(referenced_models, str):
                    referenced_models = json.loads(referenced_models)

                models_list.append(self._convert_decimal_in_dict({
                    "model_id": row.get("model_id"),
                    "modelName": row.get("model_name"),
                    "clientAgencyName": row.get("client_agency_name"),
                    "managerName": row.get("manager_name"),
                    "teamLeader": row.get("team_leader"),
                    "referencedModels": referenced_models,
                    "status": row.get("status"),
                    "notes": row.get("notes"),
                    "earningsType": row.get("earnings_type"),
                    "cutLogic": cut_logic,
                    "commissionRules": commission_rules,
                    "paymentStatus": row.get("payment_status", "Not Paid"),
                    "created_at": row.get("created_at"),
                    "updated_at": row.get("updated_at")
                }))

            final_resp["status"] = CommonConstants.success
            final_resp["message"] = f"Retrieved {len(models_list)} model(s) successfully"
            final_resp["data"] = models_list
            final_resp["total_count"] = total_count
            conn.rollback_transaction()
            return final_resp
        except Exception as e:
            log.error(f"Error getting all models: {str(e)}")
            try:
                conn.rollback_transaction()
            except Exception:
                pass
            return final_resp
        finally:
            self.close_postgres_connection()

    async def get_model_details(self, model_id: str):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to get model details"}
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()
            result = conn.fetch_all_records_with_condition(
                GFTableNames.models,
                condition="model_id = %s AND soft_delete = 'active'",
                params=(model_id,)
            )
            if not result:
                conn.rollback_transaction()
                return final_resp
            row = result[0]
            cut_logic = row.get("cut_logic") or {}
            commission_rules = row.get("commission_rules") or {}
            referenced_models = row.get("referenced_models") or []
            if isinstance(cut_logic, str):
                cut_logic = json.loads(cut_logic)
            if isinstance(commission_rules, str):
                commission_rules = json.loads(commission_rules)
            if isinstance(referenced_models, str):
                referenced_models = json.loads(referenced_models)

            data = self._convert_decimal_in_dict({
                "model_id": row.get("model_id"),
                "modelName": row.get("model_name"),
                "clientAgencyName": row.get("client_agency_name"),
                "managerName": row.get("manager_name"),
                "teamLeader": row.get("team_leader"),
                "referencedModels": referenced_models,
                "status": row.get("status"),
                "notes": row.get("notes"),
                "earningsType": row.get("earnings_type"),
                "cutLogic": cut_logic,
                "commissionRules": commission_rules,
                "paymentStatus": row.get("payment_status", "Not Paid"),
                "created_at": row.get("created_at"),
                "updated_at": row.get("updated_at")
            })
            final_resp["status"] = CommonConstants.success
            final_resp["message"] = "Model details retrieved successfully"
            final_resp["data"] = data
            conn.rollback_transaction()
            return final_resp
        except Exception as e:
            log.error(f"Error fetching model details: {str(e)}")
            try:
                conn.rollback_transaction()
            except Exception:
                pass
            return final_resp
        finally:
            self.close_postgres_connection()

    async def update_model(self, model_id: str, model_update: ModelUpdate, current_admin_id: str):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to update model"}
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()
            existing = conn.fetch_all_records_with_condition(
                GFTableNames.models,
                condition="model_id = %s AND soft_delete = 'active'",
                params=(model_id,)
            )
            if not existing:
                conn.rollback_transaction()
                return final_resp

            update_fields = []
            params = []

            if model_update.modelName is not None:
                update_fields.append("model_name = %s")
                params.append(model_update.modelName)
            if model_update.clientAgencyName is not None:
                update_fields.append("client_agency_name = %s")
                params.append(model_update.clientAgencyName)
            if model_update.managerName is not None:
                update_fields.append("manager_name = %s")
                params.append(model_update.managerName)
            if model_update.teamLeader is not None:
                update_fields.append("team_leader = %s")
                params.append(model_update.teamLeader)
            # Note: team_leader_id column not present in current schema; skipping update
            if model_update.referencedModels is not None:
                update_fields.append("referenced_models = %s")
                params.append(json.dumps(model_update.referencedModels))
            if model_update.status is not None:
                update_fields.append("status = %s")
                params.append(model_update.status)
            if model_update.notes is not None:
                update_fields.append("notes = %s")
                params.append(model_update.notes)
            if model_update.earningsType is not None:
                update_fields.append("earnings_type = %s")
                params.append(model_update.earningsType)
            if model_update.cutLogic is not None:
                update_fields.append("cut_logic = %s")
                params.append(json.dumps(model_update.cutLogic.dict(exclude_none=True)))
            if model_update.commissionRules is not None:
                update_fields.append("commission_rules = %s")
                params.append(json.dumps(model_update.commissionRules.dict(exclude_none=True)))
            if model_update.paymentStatus is not None:
                update_fields.append("payment_status = %s")
                params.append(model_update.paymentStatus)

            if not update_fields:
                conn.rollback_transaction()
                return final_resp

            update_fields.append("updated_by = %s")
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            params.extend([current_admin_id, model_id])

            values_condition = ', '.join(update_fields)
            update_condition = "model_id = %s"
            result = conn.update_table(GFTableNames.models, values_condition, update_condition, tuple(params))

            if result and result.get("status") == CommonConstants.success:
                conn.commit_transaction()
                final_resp["status"] = CommonConstants.success
                final_resp["message"] = "Model updated successfully"
                return final_resp
            else:
                conn.rollback_transaction()
                return final_resp
        except Exception as e:
            log.error(f"Error updating model: {str(e)}")
            try:
                conn.rollback_transaction()
            except Exception:
                pass
            return final_resp
        finally:
            self.close_postgres_connection()

    async def delete_model(self, model_id: str):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to delete model"}
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()
            existing = conn.fetch_all_records_with_condition(
                GFTableNames.models,
                condition="model_id = %s AND soft_delete = 'active'",
                params=(model_id,)
            )
            if not existing:
                conn.rollback_transaction()
                return final_resp

            values_condition = "soft_delete = 'deleted', updated_at = CURRENT_TIMESTAMP"
            update_condition = "model_id = %s"
            result = conn.update_table(GFTableNames.models, values_condition, update_condition, (model_id,))
            if result and result.get("status") == CommonConstants.success:
                conn.commit_transaction()
                final_resp["status"] = CommonConstants.success
                final_resp["message"] = "Model deleted successfully"
                return final_resp
            else:
                conn.rollback_transaction()
                return final_resp
        except Exception as e:
            log.error(f"Error deleting model: {str(e)}")
            try:
                conn.rollback_transaction()
            except Exception:
                pass
            return final_resp
        finally:
            self.close_postgres_connection()




