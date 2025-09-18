import base64
import uuid, json
from datetime import datetime,timedelta
from fastapi import Response, Request
from scripts.constants import app_configuration,app_constants
from scripts.constants.app_constants import CommonConstants, ResponseConstants
from scripts.logging.log_module import logger as log
from scripts.utils.simple_encrytion_utils import SimpleEncrytionUtils
from scripts.utils.common_utils import redis_connection

simple_utils = SimpleEncrytionUtils()


def create_cookie(user_email, user_id, ip_address, user_agent, server_category, user_role, host):
    cookie_creation = False
    cookie_enc_str = ""
    try:
        if user_email is not None and user_email.strip() != "" and ip_address is not None and ip_address.strip() != "" and \
                user_agent is not None and user_agent.strip() != "" and user_id is not None and user_id.strip() != "" and \
                server_category is not None and server_category.strip() != "":
            try:
                valid_till_obj = datetime.now()
                cookie_id = str(uuid.uuid4())
                cookie_str = (user_email + "^" + user_id + "^" + ip_address + "^" + user_agent + "^" +
                              server_category + "^" +
                              valid_till_obj.strftime(
                                  '%Y-%m-%dT%H:%M:%SZ') + "^" + host + "^" + user_role + "^" + cookie_id)

                # ALERT: don't change the data order in validation
                validation_str = (ip_address + "^" + user_agent + "^" + cookie_id)

                # storing cookie in redis
                try:
                    redis_connection.redis_obj.set(name=cookie_id, value=cookie_str, ex=app_configuration.COOKIE_EXPIRATION_IN_SECONDS)
                    # added to handle concurrent login
                    redis_connection.redis_obj.set(name=user_email, value=validation_str,
                                                   ex=app_configuration.REDIS_TTL)
                except Exception as e:
                    log.error(str(e))
                    return cookie_creation, cookie_enc_str

                cookie_enc_str = simple_utils.encrypt(app_configuration.COOKIE_KEY, cookie_str)
                encrypted_user_id = simple_utils.encrypt(app_configuration.COOKIE_KEY, user_id)
                cookie_creation = True
                return cookie_creation, cookie_enc_str.decode()
            except Exception as e:
                log.error("Error while creating the Cookie : %s", str(e))
    except Exception as e:
        log.error(str(e))
    return cookie_creation, cookie_enc_str

class CookieAuthentication:

    async def __call__(self, request: Request):
        """
        This function is to validate cookie
        """
        is_valid = False
        user_id = None
        user_email = None
        user_type = None
        response = {"status" : False}
        try:
            cookie_enc_str = request.cookies
            input_data = await request.body()
            if not cookie_enc_str[app_configuration.COOKIE_STR]:
                return response
            try:
                decrypted_str = simple_utils.decrypt(app_configuration.COOKIE_KEY,
                                                     cookie_enc_str[app_configuration.COOKIE_STR])
                log.debug("Decrypted string : %s", decrypted_str)
            except Exception as e:
                log.error("Error while decrypting the cookie : %s", str(e), exc_info=True)
                return {"is_valid": is_valid, "user_id": user_id, "user_email": user_email, "user_type": user_type}
            decrypted_str = decrypted_str.decode("utf-8")
            decrypted_str_list = decrypted_str.split("^")
            ip_address = request.headers[CommonConstants.X_Forwarded_For]
            user_agent = request.headers[CommonConstants.User_Agent]
            server_category = app_configuration.SERVER_CAT
            user_email = decrypted_str_list[0]
            cookie_user_email = decrypted_str_list[0]
            user_id = decrypted_str_list[1]
            user_type = decrypted_str_list[7]
            key = decrypted_str_list[-1]
            if request.method == app_constants.CommonConstants.POST:
                user_email = input_data["session_email"]
            elif request.method == app_constants.CommonConstants.GET:
                input_data = json.loads(base64.b64decode(request.query_params["session_email"]).decode("utf-8"))
                header, payload, signature = input_data["data"].split('.')
                # Decode the base64-encoded parts
                decoded_payload = json.loads(base64.urlsafe_b64decode(payload + '==').decode("utf-8"))
                user_email = decoded_payload
            if user_id is None or user_id.strip() == "" and ip_address is None or ip_address.strip() == "" or \
                    user_agent is None or user_agent.strip() == "" or server_category is None or \
                    server_category.strip() == "":
                return is_valid, user_id, user_email, user_type
            time_stamp = decrypted_str_list[5]
            current_time_str = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
            current_time = datetime.strptime(current_time_str, '%Y-%m-%dT%H:%M:%SZ')
            time_stamp_obj = datetime.strptime(time_stamp, '%Y-%m-%dT%H:%M:%SZ')
            difference = current_time - time_stamp_obj
            difference_in_seconds = int(
                (difference.microseconds + (difference.seconds + difference.days * 24 * 3600) * 10 ** 6) / 10 ** 6
            )
            log.debug(
                'Current TS - {}, Request TS - {}, Diff in secs - {} | Session timeout - {}'.format(
                    current_time_str, time_stamp, difference_in_seconds, float(
                        app_configuration.SESSION_TIMEOUT
                    ) * 60
                )
            )
            if difference_in_seconds < 0 or difference_in_seconds >= float(21600) * 60:
                return is_valid, user_id, user_email, user_type
            cookie_val = redis_connection.redis_obj.get(key)
            if cookie_val:
                cookie_val = cookie_val.decode('UTF-8')
                log.info("Comparing the requested user email between redis email and cookie emalil")
                if (user_email != cookie_val.split("^")[0] or user_email != cookie_user_email):
                    return is_valid, user_id, user_email, user_type
            if (user_id == decrypted_str_list[1] and user_agent == decrypted_str_list[3] and
                    server_category == decrypted_str_list[
                        4] and 0 <= difference_in_seconds < float(21600) * 60 and cookie_val == decrypted_str):
                cookie_id = key
                try:
                    redis_connection.redis_obj.expire(name=cookie_id, time=timedelta(
                        seconds=int(app_configuration.COOKIE_EXPIRATION_IN_SECONDS)))
                    # added to handle concurrent login
                    redis_connection.redis_obj.expire(name=user_email,
                                                      time=timedelta(
                                                          seconds=int(app_configuration.COOKIE_EXPIRATION_IN_SECONDS)))
                except Exception as e:
                    log.error(str(e))
                is_valid = True
            if is_valid and user_id and user_email and user_type:
                login_status = self.validate_active_session(user_email,request.headers)
                if not login_status:
                    response["status"] = True
                    response["user_id"] = user_id
                    response["user_type"] = user_type
                    response["user_email"] = user_email
                    response["key"] = key
                else:
                    response["message"] = ResponseConstants.SESSION_ACTIVE_MESSAGE
            else:
                response["message"] = ResponseConstants.SESSION_EXPIRED_MESSAGE
        except Exception as e:
            log.error("Error while validating the cookie : %s", str(e), exc_info=True)
        return response

    @staticmethod
    def validate_active_session(email_id, headers, service_name=None):
        """
            This function is to check if user session is active or not.
            :param: email_id, headers, service_name
            :return: status as True if session is active else False
        """
        req_ip_address = headers.get(CommonConstants.X_Forwarded_For)
        req_user_agent = headers.get(CommonConstants.User_Agent)
        status = False
        try:
            redis_str = redis_connection.redis_obj.get(email_id)
            if redis_str:
                if service_name == 'login':
                    status = True
                else:
                    redis_str_list = redis_str.decode().split('^')
                    redis_ip_address = redis_str_list[0]
                    redis_user_agent = redis_str_list[1]
                    if req_ip_address != redis_ip_address or req_user_agent != redis_user_agent:
                        status = True
        except Exception as e:
            log.error("Error while validation active session." + str(e))

        return status


def create_forget_cookie(email_id):
    cookie_creation = False
    cookie_enc_str = ""
    try:
        valid_till_obj = datetime.now()
        cookie_str = (email_id + "^" + valid_till_obj.strftime('%Y-%m-%dT%H:%M:%SZ'))
        cookie_enc_str = simple_utils.encrypt(app_configuration.COOKIE_KEY, cookie_str)
        cookie_creation = True
        return cookie_creation, cookie_enc_str.decode()
    except Exception as e:
        log.error("Error while creating the Cookie : %s", str(e))
    return cookie_creation, cookie_enc_str


def validate_forget_cookie(request):
    is_valid = False
    email_id = ''
    try:
        cookie_enc_str = request.cookies
        try:
            decrypted_str = simple_utils.decrypt(app_configuration.COOKIE_KEY,
                                                 cookie_enc_str[app_configuration.FORGET_COOKIE_STR])
            log.debug("Decrypted string : %s", decrypted_str)
        except Exception as e:
            log.error("Error while decrypting the cookie : %s", str(e), exc_info=True)
            raise Exception(str(e))
        decrypted_str = decrypted_str.decode("utf-8")
        decrypted_str_list = decrypted_str.split("^")
        email_id = decrypted_str_list[0]
        time_stamp = decrypted_str_list[1]
        current_time_str = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
        current_time = datetime.strptime(current_time_str, '%Y-%m-%dT%H:%M:%SZ')
        time_stamp_obj = datetime.strptime(time_stamp, '%Y-%m-%dT%H:%M:%SZ')
        difference = current_time - time_stamp_obj
        difference_in_seconds = int(
            (difference.microseconds + (difference.seconds + difference.days * 24 * 3600) * 10 ** 6) / 10 ** 6)
        if email_id in [None, ''] and (difference_in_seconds < 0 or difference_in_seconds >= float(500)):
            return is_valid, email_id
        is_valid = True

    except Exception as e:
        log.error("Error while validating the cookie : %s", str(e), exc_info=True)
        raise Exception(str(e))
    return is_valid, email_id
