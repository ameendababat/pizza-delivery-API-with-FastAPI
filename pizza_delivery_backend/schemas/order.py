from pydantic import BaseModel, field_validator
from typing import Optional


class OrderModel(BaseModel):
    quantity: int
    pizza_size: Optional[str] = "SMALL"
    order_status: Optional[str] = "PENDING"

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, v):
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v

    @field_validator("pizza_size")
    @classmethod
    def validate_pizza_size(cls, v):
        allowed = {"SMALL", "MEDIUM", "LARGE"}
        if v not in allowed:
            raise ValueError(f"pizza_size must be one of {', '.join(sorted(allowed))}")
        return v

    @field_validator("order_status")
    @classmethod
    def validate_order_status(cls, v):
        allowed = {"PENDING", "IN-TRANSIT", "DELIVERED"}
        if v not in allowed:
            raise ValueError(f"order_status must be one of {', '.join(sorted(allowed))}")
        return v

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "quantity": 2,
                "pizza_size": "SMALL",
            }
        }


class OrderStatusModel(BaseModel):
    order_status: Optional[str] = "PENDING"

    @field_validator("order_status")
    @classmethod
    def validate_order_status(cls, v):
        allowed = {"PENDING", "IN-TRANSIT", "DELIVERED"}
        if v not in allowed:
            raise ValueError(f"order_status must be one of {', '.join(sorted(allowed))}")
        return v

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "order_status": "PENDING",
            }
        }
