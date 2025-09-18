import argparse
import sys
from typing import List, Set

from scripts.utils.common_utils import PostgresConnection
from scripts.constants.app_constants import GFTableNames
from scripts.logging.log_module import logger as log


def get_all_tables() -> List[str]:
    """Collect all table names defined in GFTableNames."""
    tables: List[str] = []
    for attribute_name, attribute_value in vars(GFTableNames).items():
        if attribute_name.startswith("__"):
            continue
        if not isinstance(attribute_value, str):
            continue
        tables.append(attribute_value)
    # Deduplicate while preserving order
    seen: Set[str] = set()
    unique_tables: List[str] = []
    for table in tables:
        if table not in seen:
            unique_tables.append(table)
            seen.add(table)
    return unique_tables


def build_truncate_statement(tables: List[str]) -> str:
    quoted = [f'public."{t}"' for t in tables]
    return f"TRUNCATE {', '.join(quoted)} RESTART IDENTITY CASCADE;"


def main(argv: List[str]) -> int:
    parser = argparse.ArgumentParser(description="Wipe data from all tables except specified exclusions.")
    parser.add_argument(
        "--exclude",
        nargs="*",
        default=[GFTableNames.admins],
        help="Table names to exclude from truncation (defaults to ['admin']).",
    )
    parser.add_argument("--dry-run", action="store_true", help="Show what would be truncated without executing.")
    parser.add_argument("--confirm", action="store_true", help="Actually perform the truncation.")

    args = parser.parse_args(argv)

    all_tables = get_all_tables()
    exclude_set = set(args.exclude or [])
    target_tables = [t for t in all_tables if t not in exclude_set]

    if not target_tables:
        log.info("No tables to truncate after applying exclusions. Nothing to do.")
        return 0

    log.info(f"Excluding tables: {sorted(list(exclude_set))}")

    # Filter to only existing tables in the database
    try:
        conn = PostgresConnection().connect_to_postgres_utility()
        existing_rows = conn.fetch_specified_columns_with_condition(
            table="pg_tables",
            columns_list=["tablename"],
            condition="schemaname = 'public'"
        ) or []
        existing_set = {row.get("tablename") for row in existing_rows if isinstance(row, dict)}
        target_tables = [t for t in target_tables if t in existing_set]
    except Exception as e:
        log.exception(f"Failed to check existing tables, proceeding without filter: {str(e)}")

    log.info(f"Will truncate tables ({len(target_tables)}): {target_tables}")

    truncate_sql = build_truncate_statement(target_tables)
    log.info(f"Prepared SQL: {truncate_sql}")

    if args.dry_run and not args.confirm:
        log.info("Dry-run complete. No changes made.")
        return 0

    if not args.confirm:
        log.error("Refusing to run without --confirm. Re-run with --dry-run to preview.")
        return 2

    # Execute
    try:
        conn = PostgresConnection().connect_to_postgres_utility()
        conn.begin_transaction()
        # Ensure cursor exists via begin_transaction; then execute
        ok = conn.execute_query(truncate_sql)
        if not ok:
            conn.rollback_transaction()
            log.error("Truncate failed; transaction rolled back.")
            return 1
        conn.commit_transaction()
        log.info("Truncate completed successfully.")
        return 0
    except Exception as e:
        log.exception(f"Unexpected error during truncate: {str(e)}")
        try:
            conn.rollback_transaction()
        except Exception:
            pass
        return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))


