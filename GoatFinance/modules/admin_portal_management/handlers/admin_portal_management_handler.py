from scripts.utils.common_utils import *
from scripts.constants.app_constants import CommonConstants, TableNames, TOKEN_CONSTANTS, TokenConstants
from scripts.logging.log_module import logger as log
from pydantic import validate_call
from fastapi import Response, status
import bcrypt
from scripts.utils.auth_utils import get_password_hash, create_access_token
from scripts.constants.app_configuration import COOKIE_EXPIRATION_IN_SECONDS
from modules.admin_portal_management.models.admin_portal_management_models import AdminCreate, LoginAdmin, AdminUpdate
import json

class AdminPortalManagementHandler:
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

    @validate_call
    def register_user(self, admin: AdminCreate):
        """User registration handler method"""
        final_resp = {"message": "Unable to register user. Please try again.", "status": CommonConstants.failed}
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()            
            existing_user = conn.fetch_all_records_with_condition(
                TableNames.admin,
                condition="email = %s OR username = %s",
                params=(admin.admin_email, admin.admin_username)
            )
            
            if len(existing_user) > 0:
                final_resp["message"] = "Admin with this email or username already exists"
                return Response(
                    content=json.dumps(final_resp), 
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    media_type="application/json"
                )
            hashed_password = bcrypt.hashpw(admin.admin_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Check if this is the first admin ever (no existing admins in the system)
            created_by_value = None
            existing_admins = conn.fetch_all_records_with_condition(
                TableNames.admin,
                condition="1=1",  # Get all admins
                params=()
            )
            # If no admin exists, this is the first one, so created_by = NULL
            # Otherwise, we would need the authenticated admin ID (for now using NULL)
            created_by_value = None if len(existing_admins) == 0 else None
            
            add_admin = {
                "email": admin.admin_email,
                "username": admin.admin_username,
                "password": hashed_password,
                "first_name": admin.admin_first_name,
                "last_name": admin.admin_last_name,
                "role": admin.admin_role,
                "status": admin.status,
                "created_by": created_by_value
            }
            result = conn.insert_dict_into_table(
                table=TableNames.admin,
                data_dict=add_admin,
                returning_columns=['admin_id']
            )
            if result["status"] != CommonConstants.success:
                log.error("Failed to insert admin")
                final_resp["message"] = "Failed to create admin (no ID returned)"
                conn.rollback_transaction()
                return Response(
                    content=json.dumps(final_resp), 
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    media_type="application/json"
                )

            admin_id = result["result"]["admin_id"]
            log.info(f"Admin created successfully with ID: {admin_id}")

            new_admin_data = conn.fetch_all_records_with_condition(
                TableNames.admin,
                condition="admin_id = %s",
                params=(admin_id,)
            )
            
            if not new_admin_data:
                log.error("Failed to fetch created admin data")
                final_resp["message"] = "Failed to retrieve admin data"
                conn.rollback_transaction()
                return Response(
                    content=json.dumps(final_resp), 
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    media_type="application/json"
                )

            final_resp["message"] = "Admin registered successfully!"
            final_resp["status"] = CommonConstants.success
            conn.commit_transaction()
            log.info("Admin registered successfully")
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_200_OK, media_type="application/json")
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Failed to register admin: {e}")
            final_resp["message"] = f"Failed to register admin: {str(e)}"
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")

    
    async def login_admin(self, admin: LoginAdmin, response: Response):
        final_resp = {"status": CommonConstants.failed, "message": "Login failed"}
        try:
            conn = self.postgres_connection()
            conn.begin_transaction()
            # Check lockout
            sec = conn.fetch_all_records_with_condition(TableNames.admin_security, "admin_id = (SELECT admin_id FROM admin WHERE email = %s OR username = %s)", (admin.email_or_username, admin.email_or_username))
            if sec and len(sec) > 0:
                lock_until = sec[0].get("lock_until")
                if lock_until:
                    from datetime import datetime as _dt
                    if _dt.utcnow() < lock_until:
                        conn.rollback_transaction()
                        final_resp["message"] = "Account temporarily locked due to failed attempts"
                        return Response(content=json.dumps(final_resp), status_code=status.HTTP_429_TOO_MANY_REQUESTS, media_type="application/json")
            condition = "email = %s OR username = %s"
            params = (admin.email_or_username, admin.email_or_username)  # Use the same value for both email and username fields
            result = conn.fetch_all_records_with_condition(table=TableNames.admin, condition=condition, params=params)
            log.info(f"Login result: {result}")
            if result and len(result) > 0:
                stored_password = result[0].get("password", None)
                if bcrypt.checkpw(admin.password.encode('utf-8'), stored_password.encode('utf-8')):
                    # reset failed attempts
                    conn.update_table(TableNames.admin_security, "failed_attempts = 0, lock_until = NULL, updated_at = CURRENT_TIMESTAMP", "admin_id = %s", (result[0].get("admin_id"),))
                    conn.commit_transaction()
                else:
                    # increment attempts and set lock if >=3
                    admin_id = result[0].get("admin_id")
                    # upsert security row
                    conn.insert_update_to_table(TableNames.admin_security, ["id","admin_id","failed_attempts","lock_until"], [None, admin_id, 0, None], ["admin_id"])
                    cur = conn.fetch_all_records_with_condition(TableNames.admin_security, "admin_id = %s", (admin_id,))
                    attempts = int(cur[0].get("failed_attempts", 0)) + 1
                    lock_until_sql = "NULL"
                    if attempts >= 3:
                        lock_until_sql = "CURRENT_TIMESTAMP + INTERVAL '15 minutes'"
                    conn.update_table(
                        TableNames.admin_security,
                        f"failed_attempts = %s, lock_until = {lock_until_sql}, updated_at = CURRENT_TIMESTAMP",
                        "admin_id = %s",
                        (attempts, admin_id),
                    )
                    conn.rollback_transaction()
                    return Response(content=json.dumps(final_resp), status_code=status.HTTP_400_BAD_REQUEST, media_type="application/json")
            else:
                conn.rollback_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_400_BAD_REQUEST, media_type="application/json")
            
            jwt_token = create_access_token({"sub": admin.email_or_username, "type": TokenConstants.access_token, "user_id": result[0].get("admin_id")})
            log.info(f"Generated JWT token: {jwt_token}")
            response.set_cookie(
                key=TOKEN_CONSTANTS.access_token,
                value=jwt_token,
                max_age=60 * 60 * 24,  # 24 days
                httponly=False,
                secure=False,  # Not secure for localhost
                samesite="lax"
            )
            
            log.info(f"Admin found: {result}")   
            final_resp["status"] = CommonConstants.success
            final_resp["message"] = "Login successful"
            #final_resp["token"] = jwt_token
            conn.commit_transaction()
            return final_resp
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error logging in admin: {str(e)}")
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")

    async def forgot_password(self, identifier: str):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to init reset"}
        try:
            from uuid import uuid4
            from datetime import datetime, timedelta
            conn = self.postgres_connection()
            conn.begin_transaction()
            user = conn.fetch_all_records_with_condition(TableNames.admin, "email = %s OR username = %s", (identifier, identifier))
            if not user:
                conn.rollback_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_404_NOT_FOUND, media_type="application/json")
            admin_id = user[0].get("admin_id")
            token = str(uuid4())
            expires = datetime.utcnow() + timedelta(hours=1)
            conn.insert_update_to_table("email_tokens", ["token_id","admin_id","token","expires_at"], [None, admin_id, token, expires], ["token"])
            conn.commit_transaction()
            final_resp["status"] = CommonConstants.success
            final_resp["message"] = "Reset link generated"
            final_resp["data"] = {"token": token}
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_200_OK, media_type="application/json")
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error issuing reset: {str(e)}")
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")

    async def reset_password(self, token: str, new_password: str):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to reset"}
        try:
            from datetime import datetime as _dt
            import bcrypt
            conn = self.postgres_connection()
            conn.begin_transaction()
            rows = conn.fetch_all_records_with_condition("email_tokens", "token = %s", (token,))
            if not rows:
                conn.rollback_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_404_NOT_FOUND, media_type="application/json")
            row = rows[0]
            if row.get("used_at") or (row.get("expires_at") and _dt.utcnow() > row.get("expires_at")):
                conn.rollback_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_400_BAD_REQUEST, media_type="application/json")
            admin_id = row.get("admin_id")
            hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            conn.update_table(TableNames.admin, "password = %s, updated_at = CURRENT_TIMESTAMP", "admin_id = %s", (hashed, admin_id))
            conn.update_table("email_tokens", "used_at = CURRENT_TIMESTAMP", "token = %s", (token,))
            conn.commit_transaction()
            final_resp["status"] = CommonConstants.success
            final_resp["message"] = "Password reset"
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_200_OK, media_type="application/json")
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error resetting password: {str(e)}")
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")

    async def migrate_team_leaders(self):
        final_resp = {"status": CommonConstants.failed, "message": "Migration failed"}
        conn = self.postgres_connection()
        try:
            conn.begin_transaction()
            # Get distinct TL names from models where id is null
            rows = conn.fetch_all_records_with_condition(
                "models", "team_leader_id IS NULL AND soft_delete = 'active'", None
            )
            names = sorted(list({ (r.get("team_leader") or "").strip() for r in (rows or []) if (r.get("team_leader") or "").strip() }))
            created = 0
            mapped = 0
            for name in names:
                # Ensure exists in team_leaders
                existing = conn.fetch_all_records_with_condition("team_leaders", "name = %s", (name,))
                if not existing:
                    ins = conn.insert_dict_into_table("team_leaders", {"team_leader_id": None, "name": name, "telegram_username": f"{name.lower().replace(' ', '_')}@tbd", "salary_type": "Commission-based"}, ["team_leader_id"])  # noqa
                    if ins.get("status") == "Success":
                        tlid = ins.get("result", {}).get("team_leader_id")
                        created += 1
                    else:
                        continue
                # fetch id
                tlrow = conn.fetch_all_records_with_condition("team_leaders", "name = %s", (name,))
                if tlrow:
                    tlid = tlrow[0].get("team_leader_id")
                    # backfill models
                    conn.update_table("models", "team_leader_id = %s, updated_at = CURRENT_TIMESTAMP", "team_leader = %s", (tlid, name))
                    mapped += 1
            conn.commit_transaction()
            final_resp["status"] = CommonConstants.success
            final_resp["message"] = "Migration complete"
            final_resp["data"] = {"created_team_leaders": created, "models_backfilled": mapped}
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_200_OK, media_type="application/json")
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Migration error: {str(e)}")
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")

    async def get_admin_details(self, identifier: str):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to get admin details"}
        try:
            conn = self.postgres_connection()
            conn.begin_transaction()
            condition = "email = %s OR username = %s"
            params = (identifier, identifier) 
            result = conn.fetch_all_records_with_condition(table=TableNames.admin, condition=condition, params=params)
            log.info(f"Admin details: {result}")
            if result and len(result) > 0:
                admin_data = result[0]
                final_resp["status"] = CommonConstants.success
                final_resp["message"] = "Admin details retrieved successfully"
                final_resp["data"] = {
                    "admin_id": admin_data.get("admin_id"),
                    "full_name": f"{admin_data.get('first_name', '')} {admin_data.get('last_name', '')}".strip(),
                    "email": admin_data.get("email"),
                    "username": admin_data.get("username"),
                    "role": admin_data.get("role"),
                }
            conn.commit_transaction()
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_200_OK, media_type="application/json")
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error fetching user details: {str(e)}")
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")
    
    async def update_admin(self, admin_id: str, admin_update: AdminUpdate):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to update admin"}
        try:
            conn = self.postgres_connection()
            conn.begin_transaction()
            condition = "admin_id = %s"
            params = (admin_id,)
            result = conn.fetch_all_records_with_condition(table=TableNames.admin, condition=condition, params=params)
            log.info(f"Fetched admin details: {result}")
            if not result or len(result) == 0:
                conn.rollback_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_404_NOT_FOUND, media_type="application/json")
            
            update_values = []
            if admin_update.admin_first_name is not None:
                update_values.append(f"first_name = '{admin_update.admin_first_name}'")
            if admin_update.admin_last_name is not None:
                update_values.append(f"last_name = '{admin_update.admin_last_name}'")
            if admin_update.admin_email is not None:
                update_values.append(f"email = '{admin_update.admin_email}'")
            if admin_update.admin_username is not None:
                update_values.append(f"username = '{admin_update.admin_username}'")
            if admin_update.admin_role is not None:
                update_values.append(f"role = '{admin_update.admin_role}'")
            
            if not update_values:
                conn.rollback_transaction()
                final_resp["message"] = "No fields to update"
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_400_BAD_REQUEST, media_type="application/json")
            
            values_condition = ", ".join(update_values)
            update_condition = f"admin_id = '{admin_id}' "
            result = conn.update_table(
                table=TableNames.admin,
                values_condition=values_condition,
                update_condition=update_condition
            )

            if result["status"] != CommonConstants.success:
                conn.rollback_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_400_BAD_REQUEST, media_type="application/json")

            # Fetch updated user details
            updated_user = conn.fetch_all_records_with_condition(table=TableNames.admin, condition=condition, params=params)
            if not updated_user or len(updated_user) == 0:
                conn.rollback_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")

            conn.commit_transaction()
            final_resp["status"] = CommonConstants.success
            final_resp["message"] = "Admin details edited successfully"
            final_resp["data"] = {
                "admin_id": updated_user[0].get("admin_id"),
                "first_name": updated_user[0].get("first_name"),
                "last_name": updated_user[0].get("last_name"),
                "email": updated_user[0].get("email"),
                "username": updated_user[0].get("username"),
                "role": updated_user[0].get("role")
            }
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_200_OK, media_type="application/json")
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error editing admin details: {str(e)}")
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")
    

    async def get_all_admin(self, limit: int = 100, offset: int = 0, query: str = "", sort: str = "desc", sort_by: str = "created_at"):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to get all admins"}
        try:
            conn = self.postgres_connection()
            conn.begin_transaction()
            
            condition = "status = %s AND role = %s"
            params = ["active", "admin"]
            if query:
                condition += " AND (first_name ILIKE %s OR last_name ILIKE %s OR email ILIKE %s OR username ILIKE %s)"
                search_param = f"%{query}%"
                params.extend([search_param, search_param, search_param, search_param])
            
            if sort.upper() == "DESC":
                orderby = f"-{sort_by}"
            else:
                orderby = f"+{sort_by}"
            
            result, total_count = conn.fetch_all_records_with_condition_pagination(
                table=TableNames.admin,
                condition=condition,
                orderby=orderby,
                limit=limit,
                offset=offset,
                params=params
            )
            
            log.info(f"All admins query result: {len(result) if result else 0} records found")
            
            if result:
                admins_list = []
                for admin_data in result:
                    admin_info = {
                        "admin_id": admin_data.get("admin_id"),
                        "first_name": admin_data.get("first_name"),
                        "last_name": admin_data.get("last_name"),
                        "full_name": f"{admin_data.get('first_name', '')} {admin_data.get('last_name', '')}".strip(),
                        "email": admin_data.get("email"),
                        "username": admin_data.get("username"),
                        "role": admin_data.get("role"),
                        "status": admin_data.get("status")
                    }
                    admins_list.append(admin_info)
                
                final_resp["status"] = CommonConstants.success
                final_resp["message"] = f"Retrieved {len(admins_list)} admin(s) successfully"
                final_resp["data"] = admins_list
                final_resp["total_count"] = total_count
            else:
                final_resp["status"] = CommonConstants.success
                final_resp["message"] = "No active admins found"
                final_resp["data"] = []
                final_resp["total_count"] = 0
            
            conn.commit_transaction()
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_200_OK, media_type="application/json")
            
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error getting all admins: {str(e)}")
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")
        
    async def delete_admin(self, admin_id: str):
        final_resp = {"status": CommonConstants.failed, "message": "Failed to delete admin"}
        try:
            conn = self.postgres_connection()
            conn.begin_transaction()
            
            # First check if admin exists and is active
            condition = "admin_id = %s AND status = %s"
            params = (admin_id, "active")
            existing_admin = conn.fetch_all_records_with_condition(table=TableNames.admin, condition=condition, params=params)
            
            if not existing_admin or len(existing_admin) == 0:
                final_resp["message"] = "Admin not found or already deleted"
                conn.rollback_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_404_NOT_FOUND, media_type="application/json")
            
            # Soft delete: Update status to 'deleted' instead of actually deleting
            update_condition = "admin_id = %s"
            update_params = (admin_id,)
            result = conn.update_table(
                table=TableNames.admin,
                values_condition="status = %s, updated_at = CURRENT_TIMESTAMP",
                update_condition=update_condition,
                params=("deleted",) + update_params
            )
            
            if result.get("status") == "Success":
                final_resp["status"] = CommonConstants.success
                final_resp["message"] = "Admin deleted successfully"
                conn.commit_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_200_OK, media_type="application/json")
            else:
                final_resp["message"] = "Failed to delete admin"
                conn.rollback_transaction()
                return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")
                
        except Exception as e:
            conn.rollback_transaction()
            log.error(f"Error deleting admin: {str(e)}")
            return Response(content=json.dumps(final_resp), status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, media_type="application/json")
        
    async def logout_admin(self, response: Response):
        final_resp = {"status": CommonConstants.success, "message": "Logout successful"}
        try:
            response.delete_cookie(TOKEN_CONSTANTS.access_token)
            log.info("Admin logged out successfully")
            return final_resp
        except Exception as e:
            log.error(f"Error logging out admin: {str(e)}")
            final_resp["status"] = CommonConstants.failed
            final_resp["message"] = "Logout failed"