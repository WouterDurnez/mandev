"""Password hashing and JWT token utilities."""

from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from mandev_api.config import settings

ALGORITHM = "HS256"


def hash_password(plain: str) -> str:
    """Hash a plaintext password using bcrypt.

    :param plain: The plaintext password.
    :returns: The hashed password string.
    """
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against its hash.

    :param plain: The plaintext password.
    :param hashed: The stored password hash.
    :returns: ``True`` if the password matches.
    """
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(data: dict[str, object]) -> str:
    """Create a signed JWT access token.

    :param data: Claims to encode in the token.
    :returns: The encoded JWT string.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes,
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict[str, object] | None:
    """Decode and validate a JWT access token.

    :param token: The encoded JWT string.
    :returns: The decoded claims, or ``None`` if invalid.
    """
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return None
