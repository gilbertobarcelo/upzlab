"""Password hashing helpers compatible with existing bcrypt password hashes."""

import bcrypt


_BCRYPT_PREFIXES = ("$2a$", "$2b$", "$2y$")
_BCRYPT_MAX_BYTES = 72


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password_bytes, salt).decode("ascii")


def verify_password(password: str, password_hash: str) -> bool:
    if not password_hash.startswith(_BCRYPT_PREFIXES):
        return False

    password_bytes = password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    try:
        return bcrypt.checkpw(password_bytes, password_hash.encode("ascii"))
    except (ValueError, UnicodeEncodeError):
        return False
