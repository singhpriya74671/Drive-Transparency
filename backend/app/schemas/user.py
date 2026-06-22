from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    name:     str   = Field(..., min_length=2, max_length=100)
    email:    str   = Field(..., min_length=5)
    password: str   = Field(..., min_length=6)


class LoginRequest(BaseModel):
    email:    str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user_id:      int
    name:         str
    email:        str
