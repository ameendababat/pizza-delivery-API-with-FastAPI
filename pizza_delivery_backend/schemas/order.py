from pydantic import BaseModel
from typing import Optional


class OrderModel(BaseModel):
    quantity: int
    pizza_size: Optional[str] = "SMALL"
    order_status: Optional[str] = "PENDING"

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

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "order_status": "PENDING",
            }
        }
