import uuid
from fastapi import status
from fastapi.exceptions import HTTPException
from sqlalchemy.orm import Session
from models.order import Order
from models.user import User
from schemas.order import OrderModel, OrderStatusModel


def _parse_uuid(order_id: str) -> uuid.UUID:
    try:
        return uuid.UUID(order_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid order ID format",
        )


def _serialize_order(order):
    def _val(v):
        return v.code if hasattr(v, 'code') else v
    return {
        "id": str(order.id),
        "quantity": order.quantity,
        "pizza_size": _val(order.pizza_size),
        "order_status": _val(order.order_status),
    }


def create_order(db: Session, order_data: OrderModel, current_user: User):
    new_order = Order(
        pizza_size=order_data.pizza_size,
        quantity=order_data.quantity,
    )

    new_order.user = current_user

    db.add(new_order)

    db.commit()

    db.refresh(new_order)

    return _serialize_order(new_order)


def get_all_orders(db: Session, current_user: User):
    if not current_user.is_staff:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You are not a superuser",
        )
    return [_serialize_order(o) for o in db.query(Order).all()]


def get_order_by_id(db: Session, order_id: str, current_user: User):
    if not current_user.is_staff:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You are not allowed to carry out this request",
        )
    uid = _parse_uuid(order_id)
    order = db.query(Order).filter(Order.id == uid).first()
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    return _serialize_order(order)


def get_user_orders(current_user: User):
    return [_serialize_order(o) for o in current_user.orders]


def get_specific_order(order_id: str, current_user: User):
    uid = _parse_uuid(order_id)
    for o in current_user.orders:
        if o.id == uid:
            return _serialize_order(o)

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="No order with such id",
    )


def update_order(db: Session, order_id: str, order_data: OrderModel, current_user: User):
    uid = _parse_uuid(order_id)
    order_to_update = db.query(Order).filter(
        Order.id == uid, Order.user_id == current_user.id
    ).first()
    if order_to_update is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    order_to_update.quantity = order_data.quantity
    order_to_update.pizza_size = order_data.pizza_size
    db.commit()
    return _serialize_order(order_to_update)


def update_order_status(db: Session, order_id: str, status_data: OrderStatusModel, current_user: User):
    if not current_user.is_staff:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You are not allowed to carry out this request",
        )
    uid = _parse_uuid(order_id)
    order_to_update = db.query(Order).filter(Order.id == uid).first()
    if order_to_update is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    order_to_update.order_status = status_data.order_status
    db.commit()

    return _serialize_order(order_to_update)


def delete_order(db: Session, order_id: str, current_user: User):
    uid = _parse_uuid(order_id)
    order_to_delete = db.query(Order).filter(
        Order.id == uid, Order.user_id == current_user.id
    ).first()
    if order_to_delete is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    db.delete(order_to_delete)
    db.commit()
