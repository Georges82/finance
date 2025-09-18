from scripts.logging.log_module import logger
from scripts.utils.common_utils import PostgresConnection
from scripts.constants.schemas import GFSchemas


class DbSchema:
    db = PostgresConnection()
    conn = db.connect_to_postgres_utility()

    # Function to create the database and tables if they don't exist
    def create_database_and_tables(self):
        try:
            # Create the database if it doesn't exist
            # self.cursor.execute(f"CREATE DATABASE IF NOT EXISTS {POSTGRES_DATABASE}")
            # Switch to the created database
            # self.cursor.execute(f"CONNECT DATABASE {POSTGRES_DATABASE}")
            # self.cursor.execute(f"USE {POSTGRES_DATABASE}")
            self.conn.begin_transaction()
            query_string = ''
            trigger_strings = ''
            trigger_status = False
            for each_record in GFSchemas.gf_schema:
                logger.info(f"creating table for {str(each_record['table_name'])}")
                query_string = query_string + '\n' + each_record['query'] + '\n'
                if each_record['ai_varchar_col']:
                    trigger_name = f"{each_record['table_name']}_{each_record['column_name']}"
                    triggers_qry = self.create_trigger_query(table_name=each_record['table_name'],
                                                             trigger_name=trigger_name,
                                                             column_name=each_record['column_name'],
                                                             prefix=each_record['ai_column_prefix'])
                    if triggers_qry:
                        trigger_strings = trigger_strings + '\n' + triggers_qry + "\n"
            tables_status = self.conn.execute_query(query_string)
            self.conn.commit_transaction()
            if tables_status:
                self.conn.begin_transaction()
                trigger_status = self.conn.execute_query(trigger_strings)
                self.conn.commit_transaction()
            if tables_status and trigger_status:
                return True
            else:
                return False
        except Exception as e:
            logger.error(f"Exception when creating database and tables {str(e)}", exc_info=True)
            return False

    def create_tables_in_schema(self, conn, schema_name):
        try:
            query_string = ''
            trigger_strings = ''
            trigger_status = False

            for each_record in GFSchemas.gf_schema:
                formatted_query = each_record['query'].format(schema_name=schema_name)  # Corrected formatting
                logger.info(f"Creating table for  {each_record['table_name']}")
                query_string += f"\n{formatted_query}\n"

                if each_record['ai_varchar_col']:
                    trigger_name = f"{each_record['table_name']}_{each_record['column_name']}"
                    triggers_qry = self.create_trigger_schema_query(table_name=each_record['table_name'],
                                                                    schema_name=schema_name,
                                                                    trigger_name=trigger_name,
                                                                    column_name=each_record['column_name'],
                                                                    prefix=each_record['ai_column_prefix'])
                    if triggers_qry:
                        trigger_strings = trigger_strings + '\n' + triggers_qry + "\n"
            tables_status = conn.execute_query(query_string)
            if tables_status:
                trigger_status = conn.execute_query(trigger_strings)
            if tables_status and trigger_status:
                return True
            else:
                return False
        except Exception as e:
            logger.error(f"Exception when creating database and tables {str(e)}", exc_info=True)
            return False

    @staticmethod
    def create_trigger_query(table_name, trigger_name, column_name, prefix):
        try:
            # Define the sequence name (auto-incrementing sequence)
            sequence_name = f"{table_name}_{column_name}_seq"

            # Define the SQL queries to create the sequence, trigger function, and trigger
            create_sequence_query = f"""
            CREATE SEQUENCE IF NOT EXISTS {sequence_name}
            START 1
            INCREMENT 1;
            """

            create_trigger_function_query = f"""
            CREATE OR REPLACE FUNCTION {table_name}_trigger_func()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Generate the auto-incrementing value with the prefix
                NEW.{column_name} = '{prefix}_' || NEXTVAL('{sequence_name}'); 
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            """

            create_trigger_query = f"""
            CREATE OR REPLACE TRIGGER {trigger_name}
            BEFORE INSERT ON {table_name}
            FOR EACH ROW
            EXECUTE FUNCTION {table_name}_trigger_func();
            """

            qry_string = create_sequence_query + '\n' + create_trigger_function_query + '\n' + create_trigger_query
            return qry_string + '\n'
        except Exception as e:
            logger.exception(f"Exception when creating triggers {str(e)}")
            return False

    @staticmethod
    def create_trigger_schema_query(schema_name, table_name, trigger_name, column_name, prefix):
        try:
            # Define the sequence name
            sequence_name = f"{schema_name}.{table_name}_{column_name}_seq"

            # Define SQL queries to create the sequence, trigger function, and trigger
            create_sequence_query = f"""
            CREATE SEQUENCE IF NOT EXISTS {sequence_name}
            START 1
            INCREMENT 1;
            """

            create_trigger_function_query = f"""
            CREATE OR REPLACE FUNCTION {schema_name}.{table_name}_trigger_func()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Generate the auto-incrementing value with the prefix
                NEW.{column_name} = '{prefix}_' || NEXTVAL('{sequence_name}');
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            """

            create_trigger_query = f"""
            CREATE OR REPLACE TRIGGER {trigger_name}
            BEFORE INSERT ON {schema_name}.{table_name}
            FOR EACH ROW
            EXECUTE FUNCTION {schema_name}.{table_name}_trigger_func();
            """

            return f"{create_sequence_query}\n{create_trigger_function_query}\n{create_trigger_query}\n"

        except Exception as e:
            logger.exception(f"Exception when creating triggers: {str(e)}")
            return False
