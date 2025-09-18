"""
SimpleEncryptionutils
"""
# -----------------Start of Import statements------------------------ #
import base64
import traceback

from Crypto import Random
from Crypto.Cipher import AES
from scripts.logging.log_module import logger as log


# -----------------end of Import statements------------------------ #


# Utility class for data encryption
class SimpleEncrytionUtils(object):
    """
        SimpleEncrytionUtils
    """

    # Constructor
    def __init__(self):
        """
            Initializer
        """
        self.BLOCK_SIZE = 32
        self.KEY_SIZE = 32
        self.PADDING = '#'
        self.IV = 16 * '\x00'

    def _pad(self, data, data_type):
        """
        Data to be encrypted should be on 16, 24 or 32 byte boundaries.
        So if you have 'hi', it needs to be padded with 30 more characters
        to make it 32 bytes long. Similary if something is 33 bytes long,
        31 more bytes are to be added to make it 64 bytes long which falls
        on 32 boundaries.
        - BLOCK_SIZE is the boundary to which we round our data to.
        - PADDING is the character that we use to padd the data.
        """
        if data_type == "data":
            return data + (self.BLOCK_SIZE - len(data) % self.BLOCK_SIZE) * self.PADDING.encode()
        elif data_type == "key":
            return data + (self.KEY_SIZE - len(data) % self.BLOCK_SIZE) * SimpleEncrytionUtils.str_to_bytes(
                chr(self.BLOCK_SIZE - len(data) % self.BLOCK_SIZE))

    def key_encrypt(self, key_str):
        """
            This function for key_encrypt
            :param key_str:
            :return:
        """
        return self._pad(base64.b64encode(key_str), "key")

    @staticmethod
    def key_decrypt(key_str):
        """
            This function for key_decrypt
            :param key_str:
            :return:
        """
        return base64.b64decode(key_str)

    @staticmethod
    def str_to_bytes(data):
        try:
            u_type = type(b''.decode('utf8'))
            if isinstance(data, u_type):
                return data.encode('utf8')
            return data
        except Exception as e:
            log.error(str(e))

    def encrypt(self, secret_key, data):
        """
            Encrypts the given data with given secret key.
            :param secret_key:
            :param data:
            :return:
        """
        try:
            cipher = AES.new(self._pad(secret_key.encode('utf-8'), "data")[:32], AES.MODE_CBC,
                             IV=self.IV.encode('utf-8'))
            return base64.b64encode(cipher.encrypt(self._pad(data.encode('utf-8'), "data")))
        except Exception as e:
            traceback.print_exc()
            log.error("Error while encrypting : %s", str(e), exc_info=True)
            log.error(str(e))

    def decrypt(self, secret_key, encrypted_data):
        """
            Decrypts the given data with given key.
            :param secret_key:
            :param encrypted_data:
            :return:
        """
        try:
            source = self._pad(secret_key.encode('utf-8'), "data")[:32]
            cipher = AES.new(source, AES.MODE_CBC, IV=self.IV.encode('utf-8'))
            return cipher.decrypt(base64.b64decode(encrypted_data.encode('utf-8'))).rstrip(self.PADDING.encode('utf-8'))
        except Exception as e:
            traceback.print_exc()
            log.error("Unable to decrypt : %s", str(e))


class AESCipher:
    """
    A classical AES Cipher. Can use any size of data and any size of password thanks to padding.
    Also ensure the coherence and the type of the data with a unicode to byte converter.
    """

    def __init__(self, key):
        self.bs = 16
        self.key = AESCipher.str_to_bytes(key)

    @staticmethod
    def str_to_bytes(data):
        u_type = type(b''.decode('utf8'))
        if isinstance(data, u_type):
            return data.encode('utf8')
        return data

    def _pad(self, s):
        return s + (self.bs - len(s) % self.bs) * AESCipher.str_to_bytes(chr(self.bs - len(s) % self.bs))

    @staticmethod
    def _unpad(s):
        return s[:-ord(s[len(s) - 1:])]

    def encrypt(self, raw):
        raw = self._pad(AESCipher.str_to_bytes(raw))
        iv = Random.new().read(AES.block_size)
        cipher = AES.new(self.key, AES.MODE_CBC, iv)
        return base64.b64encode(iv + cipher.encrypt(raw)).decode('utf-8')

    def decrypt(self, enc):
        enc = base64.b64decode(enc)
        iv = enc[:AES.block_size]
        cipher = AES.new(self.key, AES.MODE_CBC, iv)
        data = self._unpad(cipher.decrypt(enc[AES.block_size:]))
        return data.decode('utf-8')

