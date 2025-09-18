from scripts.utils.common_utils import PostgresConnection
from scripts.constants.app_constants import TableNames, CommonConstants
from scripts.logging.log_module import logger as log
from fastapi import Response, status
import json


class TeamLeaderManagementHandler:
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

    def register_team_leader(self, tl_data: dict, admin_id: str):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to create team leader"}
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()
            existing = conn.fetch_all_records_with_condition(TableNames.team_leaders, "telegram_username = %s", (tl_data.get("telegram_username"),))
            if existing:
                conn.rollback_transaction()
                final_resp["message"] = "Team leader with this handle exists"
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_400_BAD_REQUEST, media_type="application/json")
            data = {
                "team_leader_id": None,
                "name": tl_data.get("name"),
                "telegram_username": tl_data.get("telegram_username"),
                "status": tl_data.get("status", "Active"),
                "salary_type": tl_data.get("salary_type", "Commission-based"),
                "revenue_threshold": tl_data.get("revenue_threshold", 0),
                "commission_rate": tl_data.get("commission_rate", 0),
                "fixed_salary": tl_data.get("fixed_salary", 0),
                "created_by": admin_id,
            }
            res = conn.insert_dict_into_table(TableNames.team_leaders, data, ["team_leader_id"])
            if res.get("status") == CommonConstants.success:
                conn.commit_transaction()
                final_resp["status"] = CommonConstants.success
                final_resp["message"] = "Team leader created"
                final_resp["data"] = {"team_leader_id": res["result"]["team_leader_id"]}
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_201_CREATED, media_type="application/json")
            conn.rollback_transaction()
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error creating TL: {str(e)}")
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")

    def get_all_team_leaders(self, limit: int, offset: int, query: str, sort: str, sort_by: str):
        conn = self.postgres_connection()
        try:
            cond = "status = %s"
            params = ["Active"]
            if query:
                cond += " AND (name ILIKE %s OR telegram_username ILIKE %s)"
                q = f"%{query}%"
                params.extend([q, q])
            rows = conn.fetch_all_records_with_condition(TableNames.team_leaders, f"{cond} ORDER BY {sort_by} {sort.upper()} LIMIT %s OFFSET %s", params + [limit, offset])
            return {"status": CommonConstants.success, "message": "Team leaders fetched", "data": rows or [], "total_count": conn.fetch_count(TableNames.team_leaders, condition=cond, params=params)}
        except Exception as e:
            log.error(f"Error listing TLs: {str(e)}")
            return {"status": CommonConstants.failed, "message": "Failed to list team leaders"}

    def get_team_leader_details(self, team_leader_id: str):
        conn = self.postgres_connection()
        try:
            rows = conn.fetch_all_records_with_condition(TableNames.team_leaders, "team_leader_id = %s", (team_leader_id,))
            if not rows:
                return {"status": CommonConstants.failed, "message": "Team leader not found"}
            return {"status": CommonConstants.success, "message": "Team leader details", "data": rows[0]}
        except Exception as e:
            log.error(f"Error getting TL: {str(e)}")
            return {"status": CommonConstants.failed, "message": "Failed to get team leader"}

    def update_team_leader(self, team_leader_id: str, updates: dict, admin_id: str):
        conn = self.postgres_connection()
        try:
            set_parts = []
            params = []
            for k, v in updates.items():
                set_parts.append(f"{k} = %s")
                params.append(v)
            set_parts.append("updated_by = %s")
            params.append(admin_id)
            set_parts.append("updated_at = CURRENT_TIMESTAMP")
            params.append(team_leader_id)
            res = conn.update_table(TableNames.team_leaders, ", ".join(set_parts), "team_leader_id = %s", tuple(params))
            if res.get("status") == "Success":
                return {"status": CommonConstants.success, "message": "Team leader updated"}
            return {"status": CommonConstants.failed, "message": "Failed to update team leader"}
        except Exception as e:
            log.error(f"Error update TL: {str(e)}")
            return {"status": CommonConstants.failed, "message": "Failed to update team leader"}

    def delete_team_leader(self, team_leader_id: str):
        conn = self.postgres_connection()
        try:
            res = conn.delete_records(TableNames.team_leaders, "team_leader_id = %s", (team_leader_id,))
            if res:
                return {"status": CommonConstants.success, "message": "Team leader deleted"}
            return {"status": CommonConstants.failed, "message": "Failed to delete team leader"}
        except Exception as e:
            log.error(f"Error delete TL: {str(e)}")
            return {"status": CommonConstants.failed, "message": "Failed to delete team leader"}














