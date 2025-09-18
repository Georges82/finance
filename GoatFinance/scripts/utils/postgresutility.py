import psycopg2
from psycopg2 import extras
from scripts.constants import app_configuration
from scripts.logging.log_module import logger as log
from psycopg2.extras import RealDictRow

class PostgresUtility:
    def __init__(
            self,
            postgres_host,
            postgres_port,
            postgres_user,
            postgres_password,
            postgres_database
    ) -> None:
        log.info("Establishing postgres connection")
        try:
            self.db = psycopg2.connect(
                host=postgres_host,
                port=postgres_port,
                user=postgres_user,
                password=postgres_password,
                database=postgres_database
            )
        except Exception as e:
            log.error("Error in connection to PostgresSQL: " + str(e))
            self.db = None
            exit(0)
        finally:
            self.cursor = None
            self.db.autocommit = True


    def __del__(self):
        self.db.close()

    def connect_db(self):
        try:
            self.db = psycopg2.connect(
                host=app_configuration.POSTGRES_HOST,
                port=app_configuration.POSTGRES_PORT,
                user=app_configuration.POSTGRES_USER,
                password=app_configuration.POSTGRES_PASSWORD,
                database=app_configuration.POSTGRES_DATABASE
            )
            return self.db.cursor(cursor_factory=extras.DictCursor)
        except Exception as e:
            log.error("Error while connecting to the database:" + str(e))
            exit(0)

    def get_cursor_connection(self):
        try:
            if self.db.status == 1:
                return self.db.cursor(cursor_factory=extras.RealDictCursor)
            else:
                return self.connect_db()

        except Exception as e:
            log.error("Error while initializing the postgresql cursor:" + str(e))

    def insert_into_table(self, table: str, value_list: list, columns_list: list, params=None):
        insert_details = {'status': 'Failed'}
        try:
            columns = tuple(columns_list)
            values = tuple(value_list)
            qry = '''INSERT INTO {table} ({columns}) VALUES ('{values}') '''.format(
                columns=', '.join(map(str, columns)),
                table=table,
                values="', '".join(map(str, values)))
            if params:
                self.cursor.execute(qry, params)
            else:
                self.cursor.execute(qry)
            self.db.commit()
            if self.cursor.rowcount >= 1:
                insert_details = {'status': 'Success'}
            log.debug("Inserting record into table was Successful")
        except Exception as e:
            log.exception("Error Inserting record into table - {}".format(str(e)))
            insert_details["message"] = str(e)
        return insert_details

    def insert_array_values_into_table(self, table: str, value_list: list, columns_list: list):
        insert_details = {'status': 'Failed'}
        try:
            columns = tuple(columns_list)
            values = tuple(value_list)
            qry = '''INSERT INTO {table} ({columns}) VALUES (%s, %s, %s) '''.format(
                columns=', '.join(map(str, columns)),
                table=table)

            self.cursor.execute(qry, values)
            self.db.commit()
            if self.cursor.rowcount >= 1:
                insert_details = {'status': 'Success'}
            log.debug("Inserting record into table was Successful")
        except Exception as e:
            log.exception("Error Inserting record into table - {}".format(str(e)))
        return insert_details

    def fetch_all_records(self, table: str):
        rows = None
        try:
            if not self.cursor:
                self.cursor = self.get_cursor_connection()
            qry = """SELECT * FROM """ + table + """;"""
            self.cursor.execute(qry)
            columns = list(self.cursor.description)
            result = self.cursor.fetchall()
            # make dict
            results = []
            for row in result:
                results.append(row)
            log.debug("Fetching all records was Successful")
            return results
        except Exception as e:
            log.exception("Error Fetching Records - {}".format(str(e)))
            return rows

    def fetch_all_records_with_condition(self, table, condition, params=None):
        rows = None
        try:
            if not self.cursor:
                self.cursor = self.get_cursor_connection()
            qry = """SELECT * FROM """ + table + """ WHERE """ + condition + """;"""
            self.cursor.execute(qry, params or ())
            rows = self.cursor.fetchall()
            log.debug(f"Executing query: {self.cursor.mogrify(qry, params).decode()}")
            log.debug("Fetching all records with condition was Successful")
            return rows
        except Exception as e:
            log.exception("Error Fetching Records - {}".format(str(e)))
            return rows

    def fetch_specified_columns_with_condition(self, table, columns_list, condition, params=None):
        rows = None
        try:
            if not self.cursor:
                self.cursor = self.get_cursor_connection()
            columns = tuple(columns_list)
            qry = '''SELECT {columns} FROM {table} WHERE {condition}'''.format(columns=', '.join(map(str, columns)),
                                                                               table=table, condition=condition)
            log.debug(f"Executing query: {self.cursor.mogrify(qry, params).decode()}")
            self.cursor.execute(qry, params or ())
            rows = self.cursor.fetchall()
            log.debug("Fetching specific columns with condition was Successful")
            return rows
        except Exception as e:
            log.exception("Error Fetching Records - {}".format(str(e)))
            return rows

    def update_table(self, table, values_condition, update_condition, params=None):
        update_details = {'status': 'failed'}
        try:
            if not self.cursor:
                self.cursor = self.get_cursor_connection()
            qry = '''UPDATE {table} SET {values_condition} WHERE {update_condition}'''.format(
                table=table, values_condition=values_condition, update_condition=update_condition,)
            try:
                log.debug(f"Executing query: {self.cursor.mogrify(qry, params).decode()}")
            except Exception:
                log.debug("Executing update query (mogrify unavailable)")
            self.cursor.execute(qry, params or ())
            if self.cursor.rowcount >= 1:
                update_details = {'status': 'Success'}
            log.debug("Update table is successful")
            return update_details
        except Exception as e:
            log.exception("Error updating table - {}".format(str(e)))
            return update_details

    def update_array_values_into_table(self, table, values_condition, update_condition, values_list):
        update_details = {'status': 'Failed'}
        try:
            values = tuple(values_list)
            qry = '''UPDATE {table} SET {values_condition} WHERE {update_condition}'''.format(
                table=table, values_condition=values_condition, update_condition=update_condition)
            self.cursor.execute(qry, values)
            self.db.commit()
            if self.cursor.rowcount >= 1:
                update_details = {'status': 'Success'}
            log.debug("Update table is successful")
            return update_details
        except Exception as e:
            log.exception("Error updating table - {}".format(str(e)))
            return update_details

    def update_table_without_condition(self, table, values_condition):
        update_details = {'status': 'Failed'}
        try:
            qry = '''UPDATE {table} SET {values_condition} '''.format(
                table=table, values_condition=values_condition)
            self.cursor.execute(qry)
            self.db.commit()
            if self.cursor.rowcount >= 1:
                update_details = {'status': 'Success'}
            log.debug("Update table is successful")
            return update_details
        except Exception as e:
            log.exception("Error updating table - {}".format(str(e)))
            return update_details

    def delete_records(self, table, delete_condition, params=None):
        try:
            qry = '''DELETE FROM {table} where {condition}'''.format(table=table, condition=delete_condition)
            self.cursor.execute(qry, params or ())
            log.debug("Deleted records based on condition from table successfully")
            return True
        except Exception as e:
            log.exception("Error while deleting Records - {}".format(str(e)))
            return False
    
    def fetch_id_name_mapping(self, table: str, ids: list, id_column: str, name_column: str) -> dict:
        """
        Fetch a dictionary mapping IDs to names from a table.
        
        Args:
            table (str): Name of the table to query
            ids (list): List of IDs to fetch
            id_column (str): Name of the ID column
            name_column (str): Name of the column containing names
            
        Returns:
            dict: Dictionary with ID as key and name as value
        """
        result_dict = {}
        try:
            # Safely format the query using parameterized input
            format_strings = ','.join(['%s'] * len(ids))
            qry = f"""SELECT {id_column}, {name_column} FROM {table} WHERE {id_column} IN ({format_strings});"""
            self.cursor.execute(qry, ids)
            log.debug(f"Executing query: {self.cursor.mogrify(qry, ids).decode()}")
            results = self.cursor.fetchall()
            
            # Create dictionary from results
            for row in results:
                if isinstance(row, RealDictRow):
                    keys = list(row.keys())
                    if len(keys) >= 2:  
                        key_name = row[keys[0]] 
                        value_name = row[keys[1]] 
                        if key_name is not None and value_name is not None:
                            result_dict[key_name] = value_name
                    
                else:
                    # Assuming row is a tuple
                    if len(row) >= 2:
                        result_dict[row[0]] = row[1]
                
            log.debug(f"Successfully fetched {len(results)} ID-name mappings from {table}")
            return result_dict
        except Exception as e:
            log.exception(f"Error fetching ID-name mapping from {table} - {str(e)}")
            return result_dict

    def fetch_units_records_with_condition(self, table, condition, selection =None, params=None):
        rows = None
        try:
            selection = '*' if selection is None else selection
            qry = """SELECT {selection} FROM {table} WHERE {condition} LIMIT 1;""".format(selection=selection, table=table, condition=condition)
            self.cursor.execute(qry, params or ())
            rows = self.cursor.fetchall()
            log.debug(f"Executing query: {self.cursor.mogrify(qry, params).decode()}")
            log.debug("Fetching units records with condition was Successful")
            return rows
        except Exception as e:
            log.exception("Error Fetching Records - {}".format(str(e)))
            return rows

    def execute_query(self, query, result=None, data=None):
        try:
            self.cursor.execute(query)
            if data:
                result_data = self.cursor.fetchall()
            if result:
                result_data = self.cursor.rowcount
            return result_data if result or data else True
        except Exception as e:
            log.exception(f"Exception while executing query {str(e)}")
            return False

    def check_triggers(self, trigger_name):
        try:
            self.cursor.execute(f"SELECT 1 FROM pg_trigger WHERE tgname = '{trigger_name}';")
            resp = self.cursor.fetchone()
            return resp
        except Exception as e:
            log.exception(f"Exception when checking the triggers {str(e)}")
            return False

    def fetch_specified_columns(self, table, columns_list):
        rows = None
        try:
            if not self.cursor:
                self.cursor = self.get_cursor_connection()
            columns = tuple(columns_list)
            qry = '''SELECT {columns} FROM {table} '''.format(columns=', '.join(map(str, columns)),
                                                              table=table)
            self.cursor.execute(qry)
            rows = self.cursor.fetchall()
            log.debug("Fetching specific columns was Successful")
            return rows
        except Exception as e:
            log.exception("Error Fetching Records - {}".format(str(e)))
            return rows

    def fetch_all_records_without_condition_pagination(self, table, limit=None, offset=None):
        rows = None
        try:
            if not self.cursor:
                self.cursor = self.get_cursor_connection()
            # qry = f"""SELECT * FROM public."{table}" WHERE {condition} """
            qry = f""" SELECT * FROM public."{table}" """
            if limit:
                qry = qry + ''' LIMIT {limit}'''.format(limit=limit)
            if offset:
                qry = qry + ''' OFFSET {offset}'''.format(offset=offset)
            self.cursor.execute(qry)
            rows = self.cursor.fetchall()
            log.debug("Fetching all records with condition was Successful")
            save_response_count = self.fetch_count(table)
            return rows, save_response_count
        except Exception as e:
            log.exception("Error Fetching Records - {}".format(str(e)))
            raise Exception("Error while fetching records")

    def fetch_count(self, table, condition=None,params=None):
        record_count = 0
        try:
            if not self.cursor:
                self.cursor = self.get_cursor_connection()
            qry = '''SELECT COUNT(*) FROM {table}'''.format(table=table)
            if condition:
                qry = qry + f''' WHERE {condition}'''.format(condition=condition)
            self.cursor.execute(qry, params or ())
            log.debug(f"Executing query: {self.cursor.mogrify(qry, params).decode()}")
            rows = self.cursor.fetchall()
            log.debug("Fetching specific columns was Successful")
            if rows:
                record_count = rows[0].get("count", 0)
        except Exception as e:
            log.exception("Error Fetching Records - {}".format(str(e)))
        return record_count

    def fetch_all_records_with_condition_pagination(self, table, condition, orderby=None, limit=None, offset=None,
                                                    default_orderby_query=None, selection=None, params=None):
        rows = None
        save_response_count = 0
        selection = '*' if selection is None else selection
        try:
            qry = f"""SELECT {selection} FROM {table} """
            if condition:
                qry = qry + f""" WHERE {condition} """
            if orderby is not None and not default_orderby_query:
                if orderby[0] == '+':
                    qry = qry + """ ORDER BY "{sort}" ASC""".format(sort=orderby.split('+')[1])
                else:
                    qry = qry + """ ORDER BY "{sort}" DESC""".format(sort=orderby.split('-')[1])
            if default_orderby_query:
                qry = qry + f""" ORDER BY {default_orderby_query}"""
            if limit:
                qry = qry + ''' LIMIT {limit}'''.format(limit=limit)

            if offset:
                qry = qry + ''' OFFSET {offset}'''.format(offset=offset)

            log.debug(f"Executing query: {self.cursor.mogrify(qry, params).decode()}")
            self.cursor.execute(qry, params or ())
            rows = self.cursor.fetchall()
            log.debug("Fetching all records with condition was Successful")
            save_response_count = self.fetch_count(table, condition, params)
        except Exception as e:
            log.exception("Error Fetching Records - {}".format(str(e)))
        return rows, save_response_count

    def fetch_all_records_with_condition_join_pagination(self, table, condition, orderby=None, limit=None, offset=None,
                                                         inner_join_condition=None, inner_column_values=None,
                                                         default_order_by_query=None, group_by=None,having=None, params=None, count_column_query=None):
        rows = None
        save_response_count = 0
        try:
            if inner_join_condition:
                qry = f"""SELECT {inner_column_values} FROM {table} {inner_join_condition} """
            else:
                qry = f"""SELECT * FROM {table} """
            if condition:
                qry = qry + f""" WHERE {condition} """            
            if group_by:
                qry = qry + """ GROUP BY {group_by} """.format(group_by=group_by)
            if having:
                qry = qry + """ HAVING {having} """.format(having=having)
            if orderby and default_order_by_query is None:
                if orderby[0] == '+':
                    qry = qry + """ ORDER BY "{sort}" ASC""".format(sort=orderby.split('+')[1])
                else:
                    qry = qry + """ ORDER BY "{sort}" DESC""".format(sort=orderby.split('-')[1])
            else:
                qry = qry + """ ORDER BY {default_order_by_query} """.format(
                    default_order_by_query=default_order_by_query)
            if limit:
                qry = qry + ''' LIMIT {limit}'''.format(limit=limit)

            if offset:
                qry = qry + ''' OFFSET {offset}'''.format(offset=offset)
                         
            log.debug(f"Executing query: {self.cursor.mogrify(qry, params).decode()}")
            self.cursor.execute(qry, params or ())
            rows = self.cursor.fetchall()
            log.debug("Fetching all records with condition was Successful")
            # if group by is used, we need to fetch the count from the join table
            if group_by:
                # add group by condition to the inner join condition
                if condition:
                    condition += f" GROUP BY {group_by}"
                else:
                    condition = f"GROUP BY {group_by}"

            save_response_count = self.fetch_join_table_count(f"{table} {inner_join_condition}",
                                                            count_column_query, condition, params)
        except Exception as e:
            log.exception("Error Fetching Records - {}".format(str(e)))
        return rows, save_response_count

    def fetch_join_table_count(self, table, count_column_query=None, condition=None, params=None):
        record_count = 0
        try:
            if count_column_query:
                qry = '''SELECT COUNT({count_column_query}) FROM {table}'''.format(count_column_query=count_column_query, table=table)
            else:
                qry = '''SELECT COUNT(*) FROM {table} '''.format(table=table)
            if condition:
                qry = qry + f''' WHERE {condition}'''.format(condition=condition)
            self.cursor.execute(qry, params or ())
            rows = self.cursor.fetchall()
            log.debug(f"Executing query: {self.cursor.mogrify(qry, params).decode()}")
            log.debug("Fetching specific columns was Successful")
            if len(rows) > 1:
                record_count = len(rows)
            elif rows:
                record_count = rows[0]['count']
        except Exception as e:
            log.exception("Error Fetching Records - {}".format(str(e)))
        return record_count

    def insert_query_with_return(self, table, columns, values, return_value):
        status = False
        result = None
        try:
            columns = tuple(columns)
            values = tuple(values)
            qry = '''INSERT INTO {table} ({columns}) VALUES ('{values}') RETURNING {return_value} ;'''.format(
                columns=', '.join(map(str, columns)),
                table=table,
                values="', '".join(map(str, values)), return_value=return_value)
            self.cursor.execute(qry)
            if self.cursor.rowcount >= 1:
                result = self.cursor.fetchone()
                status = True
            self.db.commit()
            log.debug("Inserting record into table was Successful")
        except Exception as e:
            log.exception("Error Inserting record into table - {}".format(str(e)))
        return status, result

    def insert_update_to_table(self,table, columns, values, unique_ids):
        insert_details = {'status': 'Failed'}
        try:
            placeholders = ', '.join(['%s'] * len(columns))
            qry = f"INSERT INTO {table} ({', '.join(columns)}) " \
                        f"VALUES ({placeholders}) " \
                        f"ON CONFLICT ({', '.join(unique_ids)}) DO UPDATE SET " \
                        f"{', '.join([f'{col} = EXCLUDED.{col}' for col in columns])}"

            self.cursor.execute(qry,tuple(values))
            if self.cursor.rowcount >= 1:
                insert_details = {'status': 'success'}
            self.db.commit()
            log.debug("Inserting record into table was Successful")
        except Exception as e:
            log.exception("Error Inserting record into table - {}".format(str(e)))
        return insert_details

    def bulk_insert_into_table(self, query):
        insert_details = {'status': 'Failed'}
        try:
            self.cursor.execute(query)
            self.db.commit()
            if self.cursor.rowcount >= 1:
                insert_details = {'status': 'Success'}
            log.debug("Inserting record into table was Successful")
        except Exception as e:
            log.exception("Error Inserting record into table - {}".format(str(e)))
        return insert_details

    def execute_query_for_trigger(self, query, result=None, data=None, single_line=False):
        try:
            if data:
                self.cursor.execute(query, data)
            else:
                self.cursor.execute(query)
            if result:
                result_data = self.cursor.rowcount
            elif data:
                result_data = self.cursor.fetchall()
                if single_line and result_data:
                    result_data = ', '.join([row[0] for row in result_data])
            else:
                result_data = True
            self.db.commit()
            return result_data
        except Exception as e:
            log.exception(f"Exception while executing query: {str(e)}")
            return False

    def insert_dict_into_table(self, table, data_dict, returning_columns=None):
        insert_details = {'status': 'Failed', 'result': None}
        try:
            columns = list(data_dict.keys())
            values = list(data_dict.values())
            placeholders = ', '.join(['%s'] * len(values))
            query = f'INSERT INTO {table} ({", ".join(columns)}) VALUES ({placeholders})'

            if returning_columns:
                query += f' RETURNING {", ".join(returning_columns)}'

            log.debug(f"Executing insert query: {self.cursor.mogrify(query, values).decode()}")
            self.cursor.execute(query, values)
            if self.cursor.rowcount >= 1:
                insert_details = {'status': 'Success', 'result': self.cursor.fetchone()}
            log.debug("Inserting record into table was Successful")
            # Ensure transaction is committed
            self.db.commit()
        except Exception as e:
            log.exception(f"Error Inserting record into table - {e}")
        return insert_details
    
    def bulk_insert_dict_into_table(self, table, data_dict_list, returning_columns=None):
        """
        Bulk insert multiple records into a table
        
        Args:
            table (str): The name of the table to insert records into
            data_dict_list (list): List of dictionaries containing the data to insert
            returning_columns (list, optional): Columns to return after insertion
            
        Returns:
            dict: Status of insertion and result if returning columns were specified
        """
        insert_details = {'status': 'Failed', 'result': None}
        
        if not data_dict_list or len(data_dict_list) == 0:
            return insert_details
        
        try:
            # Get columns from the first dictionary (assuming all dictionaries have the same keys)
            columns = list(data_dict_list[0].keys())
            
            # Create placeholders for SQL parameters
            value_placeholders = ', '.join(['%s'] * len(columns))
            
            # Build the query
            query = f'INSERT INTO {table} ({", ".join(columns)}) VALUES '
            
            # Build parameter tuples for each row
            all_values = []
            param_placeholders = []
            
            for data_dict in data_dict_list:
                # Ensure all dictionaries have the same keys
                if set(data_dict.keys()) != set(columns):
                    raise ValueError("All dictionaries must have the same keys")
                
                # Add parameter placeholders for this row
                param_placeholders.append(f'({value_placeholders})')
                
                # Add values in the correct order for this row
                all_values.extend([data_dict[column] for column in columns])
            
            # Join the parameter placeholders and complete the query
            query += ', '.join(param_placeholders)
            
            # Add RETURNING clause if specified
            if returning_columns:
                query += f' RETURNING {", ".join(returning_columns)}'
            
            log.debug(f"Executing bulk insert query: {self.cursor.mogrify(query, all_values).decode()}")
            # Execute the query with all values
            self.cursor.execute(query, all_values)

            log.info(f"Bulk inserting {len(data_dict_list)} records into table {table}")
            
            # Check if any rows were affected
            if self.cursor.rowcount >= 1:
                if returning_columns:
                    insert_details = {'status': 'Success', 'result': self.cursor.fetchall()}
                else:
                    insert_details = {'status': 'Success', 'result': self.cursor.rowcount}
            
            print(f"Bulk inserting {len(data_dict_list)} records into table was Successful")
            # Ensure transaction is committed
            self.db.commit()
        
        except Exception as e:
            log.exception(f"Error Bulk inserting records into table - {e}")        
        return insert_details
    
    def check_ids_exist_in_table(self, table, id_column, id_list, condition=None):
        """
        Check if a list of IDs exists in the specified table
        
        Args:
            table (str): The name of the table to check
            id_column (str): The column name containing the IDs
            id_list (list): List of IDs to check
            
        Returns:
            dict: Dictionary containing lists of existing and non-existing IDs
        """
        result = {
            'existing_ids': [],
            'non_existing_ids': [],
            'status': 'Failed'
        }
        
        if not id_list or len(id_list) == 0:
            return result
        
        try:
            # Create placeholder string for the query
            placeholders = ', '.join(['%s'] * len(id_list))
            
            # Build the query to select all existing IDs from the list
            query = f"SELECT {id_column} FROM {table} WHERE {id_column} IN ({placeholders})"
            if condition:
                query = f"SELECT {id_column} FROM {table} WHERE {id_column} IN ({placeholders}) AND {condition}"
            
            log.debug(f"Executing query: {self.cursor.mogrify(query, id_list).decode()}")
            # Execute the query with the list of IDs as parameters
            self.cursor.execute(query, id_list)

            # Get all found IDs
            data=self.cursor.fetchall()
            log.debug(f"Found {len(data)} records in table {table} for IDs: {id_list}")
            log.info(f"Found IDs: {data}")
            
            if len(data)> 0 and isinstance(data[0], RealDictRow):
                found_ids = [row.get(id_column) for row in data]
            else:
                found_ids = [row[0] for row in data]

            # Determine which IDs exist and which don't
            result['existing_ids'] = found_ids
            result['non_existing_ids'] = [id_val for id_val in id_list if id_val not in found_ids]
            result['status'] = 'Success'
            
            log.debug(f"Checking IDs in table {table} was Successful")
            # print(f"Successfully checked {len(id_list)} IDs in {table}")
        
        except Exception as e:
            log.exception(f"Error checking IDs in table {table} - {e}")
        return result
    
    def count_different_values_in_column(self, selection, table,condition=None, params=None):
        """
        Count distinct values in a specified column of a table
        Args:
            selection (str): The column name to count distinct values from
            table (str): The name of the table to query
        Returns:
            int: The count of distinct values in the specified column
        """ 
        counts = None
        try:
            if not self.cursor:
                self.cursor = self.get_cursor_connection()
            qry = f"SELECT {selection} FROM {table};"

            if condition:
                qry = f"SELECT {selection} FROM {table} WHERE {condition};"
            
            log.debug(f"Executing query: {self.cursor.mogrify(qry, params).decode()}")
            self.cursor.execute(qry, params or ())
            counts = self.cursor.fetchone()
            log.debug(f"Counted {counts} distinct values in column {selection} of table {table}")
            return counts    
        except Exception as e:
            log.exception(f"Error counting distinct values in column {selection} of table {table} - {e}")   
            return counts

    def create_new_schema(self, schema_name):
        try:
            self.cursor.execute(f"CREATE SCHEMA IF NOT EXISTS {schema_name}")
            log.debug("Schema creation was successful")
        except Exception as e:
            log.exception(f"Error while creating schema: {str(e)}")

    def begin_transaction(self):
        try:
            self.db.autocommit = False
            self.cursor = self.get_cursor_connection()
        except Exception as e:
            log.error(f"Error starting transaction: {e}")

    def commit_transaction(self):
        try:
            log.debug("Committing transaction")
            self.db.commit()
            self.db.autocommit = True
            self.cursor.close()
        except Exception as e:
            log.error(f"Error committing transaction: {e}")

    def rollback_transaction(self):
        try:
            log.debug("Rolling back transaction")
            self.db.rollback()
            self.db.autocommit = True
            self.cursor.close()
        except Exception as e:
            log.error(f"Error rolling back transaction: {e}")