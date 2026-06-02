from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class ProductBase(BaseModel):
    name: Annotated[str, Field(min_length=1, max_length=255)]
    sku: Annotated[str, Field(min_length=1, max_length=100)]
    price: Annotated[Decimal, Field(gt=0)]
    quantity_in_stock: Annotated[int, Field(ge=0)] = 0


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Annotated[str | None, Field(min_length=1, max_length=255)] = None
    sku: Annotated[str | None, Field(min_length=1, max_length=100)] = None
    price: Annotated[Decimal | None, Field(gt=0)] = None
    quantity_in_stock: Annotated[int | None, Field(ge=0)] = None


class ProductResponse(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class CustomerBase(BaseModel):
    full_name: Annotated[str, Field(min_length=1, max_length=255)]
    email: EmailStr
    phone: Annotated[str, Field(min_length=1, max_length=50)]


class CustomerCreate(CustomerBase):
    pass


class CustomerResponse(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class OrderItemCreate(BaseModel):
    product_id: Annotated[int, Field(gt=0)]
    quantity: Annotated[int, Field(gt=0)]


class OrderCreate(BaseModel):
    customer_id: Annotated[int, Field(gt=0)]
    items: Annotated[list[OrderItemCreate], Field(min_length=1)]

    @field_validator("items")
    @classmethod
    def validate_unique_products(cls, items: list[OrderItemCreate]) -> list[OrderItemCreate]:
        product_ids = [item.product_id for item in items]
        if len(product_ids) != len(set(product_ids)):
            raise ValueError("Duplicate product entries in the same order are not allowed")
        return items


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product_name: str
    product_sku: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    customer_name: str
    customer_email: str
    total_amount: Decimal
    created_at: datetime
    items: list[OrderItemResponse]


class DashboardSummary(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock_products: list[ProductResponse]
