import base64
import json
import time
from copy import deepcopy
from datetime import datetime, date
from typing import Dict, List
from decimal import Decimal
import jwt
from fastapi import Request
from fastapi.responses import PlainTextResponse
from scripts.constants.app_configuration import *
from scripts.constants.app_constants import GFTableNames
from scripts.constants.app_constants import ResponseConstants, HTTPResponses, Search
from scripts.logging.log_module import logger
from scripts.utils.postgresutility import PostgresUtility



def encode_function(response_json):
    try:
        json_to_encode_jwt = response_json
        jwt_encoded_string = jwt.encode(json_to_encode_jwt, JWT_SECRET_KEY, JWT_ALGORITHM_USED)
        final_json = {"data": jwt_encoded_string}
        base64_encoded_string = base64.b64encode(json.dumps(final_json).encode())
        return base64_encoded_string
    except Exception as e:
        logger.error("Exception occurred while encoding request: " + str(e))
        return base64.b64encode(
            (
                json.dumps(
                    deepcopy(ResponseConstants.FAILED_RESPONSE)
                )
            ).encode()
        )


async def decode_function(request: Request):
    try:
        request_body = (base64.b64decode(await request.body())).decode()
        json_to_decode = json.loads(request_body)
        string_to_decode = json_to_decode["data"]
        original_request_body = jwt.decode(string_to_decode, JWT_SECRET_KEY, JWT_ALGORITHM_USED)
        request._body = original_request_body
        return request
    except Exception as e:
        logger.error("Exception occurred while decoding request: " + str(e))
        return_json = deepcopy(ResponseConstants.FAILED_RESPONSE)
        resp = PlainTextResponse(content=encode_function(return_json))
        resp.status_code = HTTPResponses.BAD_REQUEST
        return resp


class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()  # Convert datetime to ISO 8601 string
        return super().default(obj)
    
class PrecisionDateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, date):
            return obj.isoformat()
        elif isinstance(obj, Decimal):
            return str(obj)  # Convert Decimal to string to preserve precision
        return super().default(obj)


    
# def access_control(role_id, parent_key, children_key=None):
#     try:
#         access_perms = []
#         conn = PostgresConnection().connect_to_postgres_utility()
#         query = f"""select * from {OcemsTableNames.navigation_header} as nh
#                 left join user_role as r on r.user_role_id = nh.user_role_id
#                 where r.user_role_name = '{role_id}';"""
#         data = conn.execute_query(query, data=True)
#         if data is None:
#             return False
#         for item in data[0]['navigation_json']:
#             if item.get('key') == parent_key:
#                 if 'children' in item:
#                     for child in item['children']:
#                         if child.get('key') == children_key:
#                             if 'access' in child:
#                                 for access_item in child['access']:
#                                     if access_item['show']:
#                                         access_perms.append(access_item['action'])
#                                 return access_perms
#         return access_perms
#     except Exception as e:
#         logger.error("Exception occurred while checking the access: " + str(e))


def collect_access_permissions(item, access_perms):
    if 'access' in item:
        for access_item in item['access']:
            if access_item.get('show'):
                access_perms.append(access_item['action'])

    if 'children' in item:
        for child in item['children']:
            collect_access_permissions(child, access_perms)

    return access_perms


# def access_control(role_id, parent_child_key):
#     try:
#         access_perms = []
#         conn = PostgresConnection().connect_to_postgres_utility()
#         # Split the parent_child_key into parent and child keys
#         keys = parent_child_key.split('->')
#         parent_key = keys[0]
#         children_keys = keys[1:]
#         query = f"""
#             SELECT * FROM {OcemsTableNames.navigation_header} AS nh
#             LEFT JOIN user_role AS r ON r.user_role_id = nh.user_role_id
#             WHERE r.user_role_name = '{role_id}';
#         """
#         data = conn.execute_query(query, data=True)
#         if data is None:
#             return False
#         navigation_json = data[0].get('navigation_json', [])
#         for item in navigation_json:
#             if item.get('key') == parent_key:
#                 current_level = item
#
#                 for child_key in children_keys:
#                     if 'children' in current_level:
#                         found_child = False
#                         for child in current_level['children']:
#                             if child.get('key') == child_key:
#                                 current_level = child
#                                 found_child = True
#                                 break
#                         if not found_child:
#                             # If child_key is not found among children
#                             return access_perms
#                     else:
#                         # If there are no children at this level
#                         return access_perms
#                 # Collect permissions from the current level and its children
#                 access_perms = collect_access_permissions(current_level, access_perms)
#                 return access_perms
#
#         return access_perms
#     except Exception as e:
#         logger.error("Exception occurred while checking the access: " + str(e))
#         return False


class PostgresConnection:

    def __init__(self):
        self.postgres_host = POSTGRES_HOST
        self.postgres_database = POSTGRES_DATABASE
        self.postgres_password = POSTGRES_PASSWORD
        self.postgres_port = int(POSTGRES_PORT)
        self.postgres_user = POSTGRES_USER

    def connect_to_postgres_utility(self):
        try:
            db_utility_object = PostgresUtility(postgres_host=self.postgres_host,
                                                postgres_database=self.postgres_database,
                                                postgres_password=self.postgres_password,
                                                postgres_port=self.postgres_port,
                                                postgres_user=self.postgres_user)
            return db_utility_object
        except Exception as e:
            logger.error("Exception occurred while connecting to postgres: " + str(e))
            return_json = deepcopy(ResponseConstants.FAILED_RESPONSE)
            return return_json

    def close_connection(self):
        """Closes the PostgreSQL connection."""
        try:
            if self.db_utility_object:
                self.db_utility_object.close()
                logger.info("PostgreSQL connection closed successfully.")
        except Exception as e:
            logger.error(f"Exception occurred while closing PostgreSQL connection: {str(e)}")


def format_json_to_string(data):
    try:
        formatted_pairs = []
        for key, value in data.items():
            if isinstance(value, bool):
                formatted_value = str(value).lower()
            elif isinstance(value, str):
                formatted_value = f"{value}"
            else:
                formatted_value = str(value)
            formatted_pairs.append(f""" {key} = '{formatted_value}' """)
        formatted_string = ", ".join(formatted_pairs)
    except Exception as e:
        logger.exception(f"Exception while formatting json to string {str(e)}", exc_info=True)
        formatted_string = False
    return formatted_string


class CommonDefs:
    table_cols_mapper = {
        "technology": {"name": "name", "type": "station_type_name"}

    }

    @classmethod
    def condition_generator(cls, input_list: List, table_map: str, sorting: Dict, strict_search=False) -> str:
        """
            This method is used for generating where clause for searching/sort operations
            :param input_list: List of dicts. Each dictionary consists of a column data to search
            :param table_map: String type indicating the key to get the columns of a table to map
            :param sorting: Dict indicating the column name and sort type
            :param strict_search: Boolean true for using '=' over ~~*
            return: condition for where clause
        """
        condition = []
        try:
            search_type = "~~*"
            if strict_search:
                search_type = "="
            col_to_sort = f"ORDER BY {cls.table_cols_mapper[table_map][sorting['column_name']]} {sorting['sort']}" \
                if sorting else ""
            for each_dict in input_list:
                if each_dict['search_text'] is not None:
                    if search_type != "=":
                        if each_dict['search_text'] not in [True, False]:
                            condition.append(
                                f"{cls.table_cols_mapper[table_map][each_dict['column_name']]} {search_type} "
                                f"'%{each_dict['search_text']}%'")
                        else:
                            condition.append(
                                f"{cls.table_cols_mapper[table_map][each_dict['column_name']]} = {each_dict['search_text']}")
                    else:
                        condition.append(f"{cls.table_cols_mapper[table_map][each_dict['column_name']]} {search_type} "
                                         f"'{each_dict['search_text']}'")
                else:
                    condition.append(f"{cls.table_cols_mapper[table_map][each_dict['column_name']]} is Null")
            condition = f" WHERE {' and '.join(condition)} {col_to_sort}" if condition else col_to_sort
            return condition
        except Exception as e:
            logger.exception(f"Exception occurred in condition generation: {str(e)}")
            return ""

    @classmethod
    def condition_generator_with_separate_sort(cls, input_list: List, table_map: str, sorting: Dict,
                                               strict_search=False) -> str:
        """
            This method is used for generating where clause for searching/sort operations
            :param input_list: List of dicts. Each dictionary consists of a column data to search
            :param table_map: String type indicating the key to get the columns of a table to map
            :param sorting: Dict indicating the column name and sort type
            :param strict_search: Boolean true for using '=' over ~~*
            return: condition for where clause
        """
        main_condition = ""
        col_to_sort = ""
        try:
            search_type = "~~*"
            if strict_search:
                search_type = "="
            col_to_sort = f"ORDER BY {cls.table_cols_mapper[table_map][sorting['column_name']]} {sorting['sort']}" \
                if sorting else ""
            condition = []
            for each_dict in input_list:
                if each_dict['search_text'] is not None:
                    if each_dict['search_text'] not in [True, False]:
                        condition.append(f"{cls.table_cols_mapper[table_map][each_dict['column_name']]} {search_type} "
                                         f"'%{each_dict['search_text']}%'")
                    else:
                        condition.append(
                            f"{cls.table_cols_mapper[table_map][each_dict['column_name']]} = {each_dict['search_text']}")
                else:
                    condition.append(f"{cls.table_cols_mapper[table_map][each_dict['column_name']]} is Null")
            if len(condition):
                main_condition = f" WHERE {' and '.join(condition)} "
        except Exception as e:
            logger.exception(f"Exception occurred in condition generation: {str(e)}")
        return main_condition, col_to_sort

    @staticmethod
    def limit_offset_getter(input_json: Dict) -> str:
        """
           This method is used for generating limit and offset
           :param input_json: Dictionary consisting limit and page keys
           return: limit and offset
        """
        limit_offset = ""
        try:
            limit = input_json.get("limit", 0)
            page_no = input_json.get("page", 1)
            offset = limit * (page_no - 1)
            limit_offset += f"LIMIT {limit}" if limit else ""
            limit_offset += f"OFFSET {offset}" if offset else ""
        except Exception as e:
            logger.exception(f"Error occurred while forming limit and offset - {str(e)}")
        return limit_offset

    @staticmethod
    def is_end_of_records(input_json: Dict, count: int) -> bool:
        """
            This method is used for setting boolean value for pagination
           :param input_json: Dictionary consisting limit and page keys
           :param count: records count from query
           return: boolean
        """
        end_of_records = True
        if int(input_json.get('limit', 0)) * int(input_json.get('page', 0)) <= count:
            end_of_records = False
        return end_of_records


def generate_search_query(mapping_key, search_filter):
    search_query = ''
    try:
        for search in search_filter:
            if search_query:
                search_query += "and" + Search.search_mapping[mapping_key][search["column_name"]].format(
                    search=search["search_text"])
            else:
                search_query += Search.search_mapping[mapping_key][search["column_name"]].format(
                    search=search["search_text"])
    except Exception as e:
        logger.error('Exception while generating Search query' + str(e))
    return search_query


def check_end_of_records(page_no, page_size, records_count):
    try:
        end_of_records = True
        if (((page_no - 1) * page_size) + page_size) < records_count:
            end_of_records = False
        return end_of_records
    except Exception as e:
        logger.error(str(e))
        end_of_records = True
        return end_of_records


def update_last_updated_user(user, page_action, industry_id):
    try:
        logger.info("started updating last updated user for " + page_action)
        db_object_utility = PostgresConnection()
        postgres_obj = db_object_utility.connect_to_postgres_utility()
        values_condition = f""" "last_updated_by" = '{user}' """
        condition = f""" "industry_id" = '{industry_id}' """
        update_user = postgres_obj.update_table(table="industry_details", values_condition=values_condition,
                                                update_condition=condition)
        if update_user["status"] == "Success":
            return update_user
    except Exception as e:
        logger.info("Exception while updating the last updated user")



def filter_user_details(user_details, filter_input):
    if filter_input and isinstance(filter_input, str):
        return [user for user in user_details if
                user.get("user_id", "").startswith(filter_input) or
                user.get("user_name", "").startswith(filter_input)]
    else:
        return user_details

