from scripts.constants.app_constants import column_prefix,GFTableNames

class GFSchemas:
    gf_schema = [
        {
            "table_name": GFTableNames.admins,
            "query": """CREATE TABLE IF NOT EXISTS admin(
                        admin_id VARCHAR(20) UNIQUE NOT NULL,
                        email VARCHAR(100) NOT NULL UNIQUE,
                        username VARCHAR(50) NOT NULL UNIQUE,
                        password VARCHAR(255) NOT NULL,
                        first_name VARCHAR(100) NOT NULL,
                        last_name VARCHAR(100) NOT NULL,
                        role VARCHAR(20) DEFAULT 'admin',
                        status VARCHAR(20) DEFAULT 'active',
                        created_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        updated_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL
                        );""",
            "ai_varchar_col": True,
            "column_name": "admin_id",
            "ai_column_prefix": "a2dd8m8sif9dns4"
        },
        {
            "table_name": GFTableNames.admin_credentials,
            "query": """CREATE TABLE IF NOT EXISTS admin_credentials(
                        id SERIAL PRIMARY KEY,
                        admin_id INT NOT NULL,
                        password VARCHAR(255) NOT NULL,
                        created_by VARCHAR(20) DEFAULT 'system',
                        updated_by VARCHAR(20) DEFAULT 'system',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        );""",
            "ai_varchar_col": False,
            "column_name": None,
            "ai_column_prefix": None
        },
        {
            "table_name": "admin_security",
            "query": """CREATE TABLE IF NOT EXISTS admin_security(
                        id VARCHAR(20) UNIQUE NOT NULL,
                        admin_id VARCHAR(20) REFERENCES admin(admin_id) ON DELETE CASCADE,
                        failed_attempts INT DEFAULT 0,
                        lock_until TIMESTAMP NULL,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(admin_id)
                        );""",
            "ai_varchar_col": True,
            "column_name": "id",
            "ai_column_prefix": "as_87654321"
        },
        {
            "table_name": "email_tokens",
            "query": """CREATE TABLE IF NOT EXISTS email_tokens(
                        token_id VARCHAR(20) UNIQUE NOT NULL,
                        admin_id VARCHAR(20) REFERENCES admin(admin_id) ON DELETE CASCADE,
                        token VARCHAR(128) NOT NULL UNIQUE,
                        expires_at TIMESTAMP NOT NULL,
                        used_at TIMESTAMP NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        );""",
            "ai_varchar_col": True,
            "column_name": "token_id",
            "ai_column_prefix": "et_12345678"
        },
        {
            "table_name": GFTableNames.chatters,
            "query": """CREATE TABLE IF NOT EXISTS chatters(
                        chatter_id VARCHAR(20) UNIQUE NOT NULL,
                        name VARCHAR(100) NOT NULL,
                        telegram_username VARCHAR(50) NOT NULL UNIQUE,
                        country VARCHAR(100) NOT NULL,
                        shift VARCHAR(10) NOT NULL,
                        status VARCHAR(20) DEFAULT 'active',
                        soft_delete VARCHAR(20) DEFAULT 'active',
                        notes TEXT,
                        last_salary_period VARCHAR(20),
                        amount_for_period DECIMAL(10,2) DEFAULT 0.00,
                        payment_status VARCHAR(20) DEFAULT 'Not Paid',
                        created_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        updated_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL
                        );""",
            "ai_varchar_col": True,
            "column_name": "chatter_id",
            "ai_column_prefix": "chatter_23843531"
        },
        {
            "table_name": GFTableNames.chatter_rates,
            "query": """CREATE TABLE IF NOT EXISTS chatter_rates(
    rate_id VARCHAR(20) UNIQUE NOT NULL,
    chatter_id VARCHAR(20) REFERENCES chatters(chatter_id) ON DELETE CASCADE,
    rates JSONB NOT NULL DEFAULT '{}',
    created_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
    updated_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    UNIQUE(chatter_id)
);""",
            "ai_varchar_col": True,
            "column_name": "rate_id",
            "ai_column_prefix": "rate_432214131"
        },
        {
            "table_name": GFTableNames.managers,
            "query": """CREATE TABLE IF NOT EXISTS managers(
                        manager_id VARCHAR(20) UNIQUE NOT NULL,
                        name VARCHAR(100) NOT NULL,
                        role VARCHAR(20) NOT NULL,
                        telegram_username VARCHAR(50) NOT NULL UNIQUE,
                        email VARCHAR(100),
                        phone VARCHAR(20),
                        status VARCHAR(20) DEFAULT 'Active',
                        soft_delete VARCHAR(20) DEFAULT 'active',
                        salary_type VARCHAR(20) NOT NULL,
                        revenue_threshold DECIMAL(10,2) DEFAULT 0.00,
                        commission_rate DECIMAL(5,2) DEFAULT 0.00,
                        fixed_salary DECIMAL(10,2) DEFAULT 0.00,
                        assigned_models JSONB DEFAULT '[]',
                        created_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        updated_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL
                        );""",
            "ai_varchar_col": True,
            "column_name": "manager_id",
            "ai_column_prefix": "manager_12345678"
        },
        {
            "table_name": GFTableNames.assistants,
            "query": """CREATE TABLE IF NOT EXISTS assistants(
                        assistant_id VARCHAR(20) UNIQUE NOT NULL,
                        name VARCHAR(100) NOT NULL,
                        telegram_username VARCHAR(50) NOT NULL UNIQUE,
                        status VARCHAR(20) DEFAULT 'Active',
                        soft_delete VARCHAR(20) DEFAULT 'active',
                        salary_type VARCHAR(20) DEFAULT 'Fixed',
                        fixed_salary DECIMAL(10,2) NOT NULL,
                        salary_period VARCHAR(20) NOT NULL,
                        created_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        updated_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL
                        );""",
            "ai_varchar_col": True,
            "column_name": "assistant_id",
            "ai_column_prefix": "assistant_87654321"
        },
        {
            "table_name": GFTableNames.manager_salaries,
            "query": """CREATE TABLE IF NOT EXISTS manager_salaries(
                        salary_id VARCHAR(20) UNIQUE NOT NULL,
                        manager_id VARCHAR(20) REFERENCES managers(manager_id) ON DELETE CASCADE,
                        period VARCHAR(20) NOT NULL,
                        year INTEGER NOT NULL,
                        week1_salary DECIMAL(10,2) DEFAULT 0.00,
                        week2_salary DECIMAL(10,2) DEFAULT 0.00,
                        total_salary DECIMAL(10,2) DEFAULT 0.00,
                        payment_status VARCHAR(20) DEFAULT 'Not Paid',
                        created_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        updated_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL,
                        UNIQUE(manager_id, period, year)
);""",
            "ai_varchar_col": True,
            "column_name": "salary_id",
            "ai_column_prefix": "salary_98765432"
        },
        {
            "table_name": GFTableNames.assistant_salaries,
            "query": """CREATE TABLE IF NOT EXISTS assistant_salaries(
                        salary_id VARCHAR(20) UNIQUE NOT NULL,
                        assistant_id VARCHAR(20) REFERENCES assistants(assistant_id) ON DELETE CASCADE,
                        period VARCHAR(20) NOT NULL,
                        year INTEGER NOT NULL,
                        week1_salary DECIMAL(10,2) DEFAULT 0.00,
                        week2_salary DECIMAL(10,2) DEFAULT 0.00,
                        total_salary DECIMAL(10,2) DEFAULT 0.00,
                        payment_status VARCHAR(20) DEFAULT 'Not Paid',
                        created_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        updated_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL,
                        UNIQUE(assistant_id, period, year)
);""",
            "ai_varchar_col": True,
            "column_name": "salary_id",
            "ai_column_prefix": "salary_11223344"
        }
        ,
        {
            "table_name": GFTableNames.models,
            "query": """CREATE TABLE IF NOT EXISTS models(
                        model_id VARCHAR(20) UNIQUE NOT NULL,
                        model_name VARCHAR(100) NOT NULL UNIQUE,
                        client_agency_name VARCHAR(100) NOT NULL,
                        manager_name VARCHAR(100) NOT NULL,
                        team_leader VARCHAR(100) NOT NULL,
                        status VARCHAR(20) DEFAULT 'Active',
                        soft_delete VARCHAR(20) DEFAULT 'active',
                        payment_status VARCHAR(20) DEFAULT 'Not Paid',
                        referenced_models JSONB DEFAULT '[]',
                        earnings_type VARCHAR(20) NOT NULL,
                        cut_logic JSONB NOT NULL DEFAULT '{}',
                        commission_rules JSONB NOT NULL DEFAULT '{}',
                        notes TEXT NULL,
                        created_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        updated_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL,
                        team_leader_id VARCHAR(20) NULL,
                        manager_id VARCHAR(20) NULL
                        );""",
            "ai_varchar_col": True,
            "column_name": "model_id",
            "ai_column_prefix": "model_12345678"
        },
        {
            "table_name": GFTableNames.work_reports,
            "query": """CREATE TABLE IF NOT EXISTS work_reports(
                        report_id VARCHAR(20) UNIQUE NOT NULL,
                        work_date DATE NOT NULL,
                        chatter_id VARCHAR(20) REFERENCES chatters(chatter_id) ON DELETE CASCADE,
                        model_id VARCHAR(20) REFERENCES models(model_id) ON DELETE CASCADE,
                        hours INT NOT NULL,
                        net_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                        period VARCHAR(20) NOT NULL,
                        year INTEGER NOT NULL,
                        week INTEGER NOT NULL,
                        created_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        updated_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL,
                        reference_children JSONB NULL,
                        UNIQUE(work_date, chatter_id, model_id)
                        );""",
            "ai_varchar_col": True,
            "column_name": "report_id",
            "ai_column_prefix": "report_98765432"
        },
        {
            "table_name": GFTableNames.agency_insights,
            "query": """CREATE TABLE IF NOT EXISTS agency_insights(
                        id SERIAL PRIMARY KEY,
                        period VARCHAR(50) NOT NULL,
                        year INTEGER NOT NULL,
                        week INTEGER,
                        revenue DECIMAL(12,2) DEFAULT 0.00,
                        real_revenue DECIMAL(12,2) DEFAULT 0.00,
                        cost DECIMAL(12,2) DEFAULT 0.00,
                        profit DECIMAL(12,2) DEFAULT 0.00,
                        real_profit DECIMAL(12,2) DEFAULT 0.00,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(period, year, week)
                        );""",
            "ai_varchar_col": False,
            "column_name": None,
            "ai_column_prefix": None
        },
        {
            "table_name": GFTableNames.model_insights,
            "query": """CREATE TABLE IF NOT EXISTS model_insights(
                        id SERIAL PRIMARY KEY,
                        model_id VARCHAR(20) NOT NULL,
                        period VARCHAR(50) NOT NULL,
                        year INTEGER NOT NULL,
                        week INTEGER,
                        net_sales DECIMAL(12,2) DEFAULT 0.00,
                        invoice_value DECIMAL(12,2) DEFAULT 0.00,
                        invoice_status VARCHAR(20) DEFAULT 'Unpaid',
                        revenue DECIMAL(12,2) DEFAULT 0.00,
                        profit DECIMAL(12,2) DEFAULT 0.00,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(model_id, period, year, week)
                        );""",
            "ai_varchar_col": False,
            "column_name": None,
            "ai_column_prefix": None
        },
        {
            "table_name": GFTableNames.team_leaders,
            "query": """CREATE TABLE IF NOT EXISTS team_leaders(
                        team_leader_id VARCHAR(20) UNIQUE NOT NULL,
                        name VARCHAR(100) NOT NULL,
                        telegram_username VARCHAR(50) NOT NULL UNIQUE,
                        status VARCHAR(20) DEFAULT 'Active',
                        salary_type VARCHAR(20) NOT NULL,
                        revenue_threshold DECIMAL(10,2) DEFAULT 0.00,
                        commission_rate DECIMAL(5,2) DEFAULT 0.00,
                        fixed_salary DECIMAL(10,2) DEFAULT 0.00,
                        created_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        updated_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL
                        );""",
            "ai_varchar_col": True,
            "column_name": "team_leader_id",
            "ai_column_prefix": "tl_87654321"
        },
        {
            "table_name": GFTableNames.model_weekly_costs,
            "query": """CREATE TABLE IF NOT EXISTS model_weekly_costs(
                        id VARCHAR(20) UNIQUE NOT NULL,
                        model_id VARCHAR(20) REFERENCES models(model_id) ON DELETE CASCADE,
                        period VARCHAR(20) NOT NULL,
                        year INTEGER NOT NULL,
                        week INTEGER NOT NULL,
                        chatter_cost_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                        tl_cost_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                        manager_cost_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                        assistant_cost_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                        total_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                        created_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        updated_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL,
                        UNIQUE(model_id, period, year, week)
                        );""",
            "ai_varchar_col": True,
            "column_name": "id",
            "ai_column_prefix": "mwc_12345678"
        },
        {
            "table_name": GFTableNames.daily_costs,
            "query": """CREATE TABLE IF NOT EXISTS daily_costs(
                        cost_id VARCHAR(20) UNIQUE NOT NULL,
                        cost_date DATE NOT NULL,
                        chatter_id VARCHAR(20) REFERENCES chatters(chatter_id) ON DELETE CASCADE,
                        model_id VARCHAR(20) REFERENCES models(model_id) ON DELETE CASCADE,
                        hourly_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                        commission DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                        total_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                        period VARCHAR(20) NOT NULL,
                        year INTEGER NOT NULL,
                        week INTEGER NOT NULL,
                        created_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        updated_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL,
                        agency_cut DECIMAL(10,2) DEFAULT 0.00,
                        UNIQUE(cost_date, chatter_id, model_id)
                        );""",
            "ai_varchar_col": True,
            "column_name": "cost_id",
            "ai_column_prefix": "dc_87654321"
        },
        {
            "table_name": GFTableNames.weekly_chatter_summaries,
            "query": """CREATE TABLE IF NOT EXISTS weekly_chatter_summaries(
                        summary_id VARCHAR(20) UNIQUE NOT NULL,
                        chatter_id VARCHAR(20) REFERENCES chatters(chatter_id) ON DELETE CASCADE,
                        period VARCHAR(20) NOT NULL,
                        year INTEGER NOT NULL,
                        week INTEGER NOT NULL,
                        hours_total INTEGER NOT NULL DEFAULT 0,
                        hourly_pay_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                        commission_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                        total_payout DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                        created_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        updated_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL,
                        agency_cut_total DECIMAL(10,2) DEFAULT 0.00,
                        UNIQUE(chatter_id, period, year, week)
                        );""",
            "ai_varchar_col": True,
            "column_name": "summary_id",
            "ai_column_prefix": "wcs_12345678"
        },
        {
            "table_name": GFTableNames.chatter_payouts,
            "query": """CREATE TABLE IF NOT EXISTS chatter_payouts(
                        payout_id VARCHAR(20) UNIQUE NOT NULL,
                        chatter_id VARCHAR(20) REFERENCES chatters(chatter_id) ON DELETE CASCADE,
                        period VARCHAR(20) NOT NULL,
                        year INTEGER NOT NULL,
                        week1_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                        week2_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                        total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                        payment_status VARCHAR(20) DEFAULT 'Not Paid',
                        paid_at TIMESTAMP NULL,
                        created_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        updated_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL,
                        UNIQUE(chatter_id, period, year)
                        );""",
            "ai_varchar_col": True,
            "column_name": "payout_id",
            "ai_column_prefix": "cp_87654321"
        },
        {
            "table_name": GFTableNames.invoices,
            "query": """CREATE TABLE IF NOT EXISTS invoices(
                        invoice_id VARCHAR(20) UNIQUE NOT NULL,
                        model_id VARCHAR(20) REFERENCES models(model_id) ON DELETE CASCADE,
                        period VARCHAR(20) NOT NULL,
                        year INTEGER NOT NULL,
                        week INTEGER NULL,
                        net_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                        invoice_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                        status VARCHAR(20) NOT NULL DEFAULT 'Unpaid',
                        notes TEXT NULL,
                        created_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        updated_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL,
                        UNIQUE(model_id, period, year, week)
                        );""",
            "ai_varchar_col": True,
            "column_name": "invoice_id",
            "ai_column_prefix": "inv_12345678"
        },
        {
            "table_name": GFTableNames.model_period_rollups,
            "query": """CREATE TABLE IF NOT EXISTS model_period_rollups(
                        id VARCHAR(20) UNIQUE NOT NULL,
                        model_id VARCHAR(20) REFERENCES models(model_id) ON DELETE CASCADE,
                        period VARCHAR(20) NOT NULL,
                        year INTEGER NOT NULL,
                        revenue DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                        real_revenue DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                        cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                        profit DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                        real_profit DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                        created_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        updated_by VARCHAR(20) REFERENCES admin(admin_id) NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL,
                        UNIQUE(model_id, period, year)
                        );""",
            "ai_varchar_col": True,
            "column_name": "id",
            "ai_column_prefix": "mpr_87654321"
        }
    ]
