from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from config.database import get_db
from dependencies import get_current_user
from models.user import User
from schemas.order import OrderModel, OrderStatusModel
from controllers.order_controller import (
    create_order,
    get_all_orders,
    get_order_by_id,
    get_user_orders,
    get_specific_order,
    update_order,
    update_order_status,
    delete_order,
)


order_router = APIRouter(prefix="/orders", tags=["orders"])


@order_router.post("", status_code=status.HTTP_201_CREATED)
async def place_an_order(
    order: OrderModel,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_order(db, order, current_user)


@order_router.get("")
async def list_all_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_all_orders(db, current_user)


@order_router.get("/me")
async def list_user_orders(
    current_user: User = Depends(get_current_user),
):
    return get_user_orders(current_user)


@order_router.get("/me/{order_id}")
async def get_specific_order_route(
    order_id: str,
    current_user: User = Depends(get_current_user),
):
    return get_specific_order(order_id, current_user)


@order_router.get("/{order_id}")
async def get_order_by_id_route(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_order_by_id(db, order_id, current_user)


@order_router.put("/{order_id}")
async def update_order_route(
    order_id: str,
    order: OrderModel,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_order(db, order_id, order, current_user)


@order_router.patch("/{order_id}/status")
async def update_order_status_route(
    order_id: str,
    order: OrderStatusModel,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_order_status(db, order_id, order, current_user)


@order_router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order_route(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return delete_order(db, order_id, current_user)
