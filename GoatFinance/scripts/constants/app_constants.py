from enum import Enum

class Service:
    name = "Goat Finance Services"
    version = "1.0.0"
    description = "Goat Finance API Services"

class Prefix:
    api_prefix = "/api/v1"

class ServiceTags:
    admin = "Admin Management"
    auth = "Authentication"
    user = "User Management"
    chatter = "Chatter Management"
    manager = "Manager Management"
    model = "Model Management"
    reports = "Reports Management"
    insights = "Insights Management"

class APIVersions:
    v1 = "v1"

class Endpoints:
    admin_register = "/admin/register"
    admin_login = "/admin/login"
    admin_forgot = "/admin/forgot"
    admin_reset = "/admin/reset"
    admin_details = "/admin/details"
    all_admin = "/admin/get_all_admin"
    admin_delete = "/admin/delete"
    admin_update = "/admin/update"
    admin_logout = "/admin/logout"
    
    # Chatter endpoints
    chatter_register = "/chatter/register"
    chatter_list = "/chatter/list"
    chatter_details = "/chatter/details"
    chatter_update = "/chatter/update"
    chatter_delete = "/chatter/delete"
    chatter_rates = "/chatter/rates"
    chatter_rate_update = "/chatter/rate/update"
    chatter_rate_add = "/chatter/rate/add"
    chatter_rate_delete = "/chatter/rate/delete"
    
    # Manager endpoints
    manager_register = "/manager/register"
    manager_list = "/manager/list"
    manager_details = "/manager/details"
    manager_update = "/manager/update"
    manager_delete = "/manager/delete"
    manager_salary_periods = "/manager/salary/periods"
    manager_salary_calculate = "/manager/salary/calculate"
    manager_salary_update = "/manager/salary/update"
    manager_salary_update_all = "/manager/salary/update-all"
    manager_salary_auto_update = "/manager/salary/auto-update"
    manager_with_salaries = "/managers/with-salaries"  # New endpoint
    
    # Assistant endpoints
    assistant_register = "/assistant/register"
    assistant_list = "/assistant/list"
    assistant_details = "/assistant/details"
    assistant_update = "/assistant/update"
    assistant_delete = "/assistant/delete"
    assistant_salary_periods = "/assistant/salary/periods"
    assistant_salary_calculate = "/assistant/salary/calculate"
    assistant_salary_update = "/assistant/salary/update"
    assistant_salary_update_all = "/assistant/salary/update-all"
    assistant_salary_auto_update = "/assistant/salary/auto-update"

    # Model endpoints
    model_register = "/model/register"
    model_list = "/model/list"
    model_details = "/model/details"
    model_update = "/model/update"
    model_delete = "/model/delete"
    
    # Reports endpoints
    reports_periods = "/reports/periods"
    reports_week_get = "/reports/week/get"
    reports_week_save = "/reports/week/save"
    reports_summary = "/reports/summary"
    reports_chatter_salary = "/reports/chatter-salary"
    
    # Payouts endpoints
    payouts_list = "/payouts/list"
    payouts_update = "/payouts/update"
    
    # Insights endpoints
    insights_agency = "/insights/agency"
    insights_model = "/insights/model"
    insights_recompute_costs = "/insights/recompute-costs"
    
    # Dashboard endpoints
    dashboard_kpis = "/dashboard/kpis"
    dashboard_leaderboards = "/dashboard/leaderboards"
    
    # Invoice endpoints
    invoices_list = "/invoices/list"
    invoice_create = "/invoice/create"
    invoice_update = "/invoice/update"

class CommonConstants:
    success = "Success"
    failed = "Failed"
    admin_role = "admin"
    user_role = "user"

class TableNames:
    admin = "admin"
    users = "users"
    email_token = "email_tokens"
    admin_security = "admin_security"
    chatters = "chatters"
    chatter_rates = "chatter_rates"
    models = "models"

class GFTableNames:
    admins = "admin"
    users = "users"
    email_token = "email_tokens"
    admin_credentials = "admin_credentials"
    chatters = "chatters"
    chatter_rates = "chatter_rates"
    managers = "managers"
    team_leaders = "team_leaders"
    assistants = "assistants"
    manager_salaries = "manager_salaries"
    assistant_salaries = "assistant_salaries"
    models = "models"
    work_reports = "work_reports"
    daily_costs = "daily_costs"
    weekly_chatter_summaries = "weekly_chatter_summaries"
    chatter_payouts = "chatter_payouts"
    invoices = "invoices"
    model_weekly_costs = "model_weekly_costs"
    model_period_rollups = "model_period_rollups"
    agency_insights = "agency_insights"
    model_insights = "model_insights"

class TOKEN_CONSTANTS:
    access_token = "access_token"
    refresh_token = "refresh_token"

class TokenConstants:
    access_token = "access_token"
    refresh_token = "refresh_token"
    max_age = 60*60*24  # 24 hour

class ResponseConstants:
    SUCCESS_RESPONSE = {"status": "Success", "message": "Operation completed successfully"}
    FAILED_RESPONSE = {"status": "Failed", "message": "Operation failed"}
    success = "Success"
    failed = "Failed"
    SESSION_ACTIVE_MESSAGE = "Session is active"
    SESSION_EXPIRED_MESSAGE = "Session has expired"

class HTTPResponses:
    OK = 200
    CREATED = 201
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    INTERNAL_SERVER_ERROR = 500

class Search:
    DEFAULT_PAGE_SIZE = 10
    MAX_PAGE_SIZE = 100

class column_prefix:
    admins_prefix = "ADM"
    users_prefix = "USR"
