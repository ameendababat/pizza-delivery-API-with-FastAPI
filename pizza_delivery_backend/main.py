from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from views.auth_routes import auth_router
from views.order_routes import order_router


app = FastAPI(title="Pizza Delivery API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],    
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(order_router)
