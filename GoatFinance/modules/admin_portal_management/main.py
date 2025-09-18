"""
This is the main script where Fast API application is initialized and routes are registered.
"""

import uvicorn, time
from fastapi import FastAPI, Request
from starlette.responses import JSONResponse
from scripts.constants.app_constants import Service, Prefix, ServiceTags, APIVersions
from starlette.middleware.cors import CORSMiddleware
from scripts.logging.log_module import logger
from modules.admin_portal_management.services.admin_portal_management_services import adminPortalManagementRouter
from mangum import Mangum
import json


tags_meta = [{"name": "Goat Finance Admin Portal Services", "description": "Goat Finance Admin Portal Services"}]

app = FastAPI(
    title=f"{Service.name}",
    description=f"{Service.description}",
    version=f"{Service.version}",
    openapi_tags=tags_meta
)

# Include routers from handlers
app.include_router(adminPortalManagementRouter, tags=ServiceTags.admin, prefix=Prefix.api_prefix)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "PUT"],
    allow_headers=["*"],
)


# ✅ Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"Request: {request.method} {request.url.path} | Time Taken: {process_time:.2f}s")
    return response


# ✅ Exception Handling Middleware
@app.middleware("http")
async def catch_exceptions(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        logger.error(f"Unhandled Error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"message": "Internal Server Error"},
        )


@app.get("/")
async def root():
    return {"message": "Welcome to Admin Portal Management Module Wise Services API"}


# handler = Mangum(app, lifespan=True) # only development
handler = Mangum(app)


def lambda_handler(event, context):
    print("Received Event:", json.dumps(event, indent=2))
    return handler(event, context)
