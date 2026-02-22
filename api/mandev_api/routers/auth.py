"""Authentication routes: signup, login, and current-user lookup."""

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr

import json

from mandev_api.auth import create_access_token, decode_access_token, hash_password, verify_password
from mandev_api.tables import User, UserProfile

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------

class SignupRequest(BaseModel):
    """Body for the signup endpoint."""

    email: EmailStr
    username: str
    password: str


class SignupResponse(BaseModel):
    """Successful signup response."""

    id: int
    email: str
    username: str


class LoginRequest(BaseModel):
    """Body for the login endpoint."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str = "bearer"


class MeResponse(BaseModel):
    """Current-user info."""

    id: int
    email: str
    username: str
    github_username: str | None = None
    avatar: str | None = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_current_user(
    authorization: str = Header(...),
) -> User:
    """Extract and validate the JWT from the Authorization header.

    :param authorization: ``Bearer <token>`` header value.
    :returns: The authenticated :class:`User`.
    :raises HTTPException: 401 if the token is missing, malformed, or invalid.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    token = authorization[len("Bearer "):]
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = await User.objects().where(User.id == int(user_id)).first().run()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest) -> SignupResponse:
    """Register a new user and create an empty profile.

    :param body: Signup data.
    :returns: The created user info.
    """
    existing = await User.objects().where(User.email == body.email).first().run()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    existing = await User.objects().where(User.username == body.username).first().run()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")

    user = User(
        email=body.email,
        username=body.username,
        password_hash=hash_password(body.password),
    )
    await user.save().run()

    profile = UserProfile(user_id=user.id, config_json="{}")
    await profile.save().run()

    return SignupResponse(id=user.id, email=user.email, username=user.username)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest) -> TokenResponse:
    """Authenticate a user and return a JWT.

    :param body: Login credentials.
    :returns: An access token.
    """
    user = await User.objects().where(User.email == body.email).first().run()

    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=MeResponse)
async def me(user: User = Depends(_get_current_user)) -> MeResponse:
    """Return the currently authenticated user's info.

    :param user: The authenticated user (injected).
    :returns: User info.
    """
    avatar: str | None = None
    profile = (
        await UserProfile.objects()
        .where(UserProfile.user_id == user.id)
        .first()
        .run()
    )
    if profile and profile.config_json:
        try:
            config = json.loads(profile.config_json)
            avatar = (config.get("profile") or {}).get("avatar")
        except (json.JSONDecodeError, AttributeError):
            pass

    return MeResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        github_username=user.github_username,
        avatar=avatar,
    )
