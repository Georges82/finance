"""
This is the main script where Fast API application is initialized and routes are registered.
"""
from contextlib import asynccontextmanager
import uvicorn, time
from fastapi import FastAPI, Request
from starlette.responses import JSONResponse
from scripts.constants.app_constants import Service, Prefix, ServiceTags, APIVersions
from starlette.middleware.cors import CORSMiddleware
from scripts.constants.app_configuration import HOST, PORT
from scripts.logging.log_module import logger
from modules.admin_portal_management.services.admin_portal_management_services import adminPortalManagementRouter
from modules.chatter_management.services.chatter_management_services import chatterManagementRouter
from modules.manager_management.services.manager_management_services import managerManagementRouter
from modules.model_management.services.model_management_services import modelManagementRouter
from modules.reports_management.services.reports_management_services import reportsManagementRouter
from modules.insights_management.services.insights_management_services import insightsManagementRouter
from scripts.schemas.db_schemas import DbSchema

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        """ This function is to create default database and tables"""

        # cognito =await get_cognito_client()
        # for par in CognitoConfig.parameters:
        #     is_added=cognito.add_custom_attribute_to_schema(par, "String")
        #     if is_added:
        #         logger.info(f"Custom attribute {par} added to Cognito schema")
        #     else:
        #         logger.info(f"Custom attribute {par} already exists in Cognito schema")
        
        result = DbSchema().create_database_and_tables()
        if result:
            logger.info("Database initiated successfully")
    except Exception as e:
        logger.error(f"Exception in startup event {str(e)}")

    yield  # Application starts here


tags_meta = [{"name": "Goat Finance Services", "description": "Goat Finance Services"}]

app = FastAPI(
    title=f"{Service.name}",
    description=f"{Service.description}",
    version=f"{Service.version}",
    openapi_tags=tags_meta,
    lifespan=lifespan # only development
)

# Include routers from handlers
app.include_router(adminPortalManagementRouter, tags=ServiceTags.admin,prefix=Prefix.api_prefix)
app.include_router(chatterManagementRouter, tags=ServiceTags.chatter, prefix=Prefix.api_prefix)
app.include_router(managerManagementRouter, tags=ServiceTags.manager, prefix=Prefix.api_prefix)
app.include_router(modelManagementRouter, tags=ServiceTags.model, prefix=Prefix.api_prefix)
app.include_router(reportsManagementRouter, tags=ServiceTags.reports, prefix=Prefix.api_prefix)
app.include_router(insightsManagementRouter, tags=ServiceTags.insights, prefix=Prefix.api_prefix)
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://localhost:3000"],
    allow_origins=["http://localhost:9002", "http://localhost:3000"],
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
    return {"message": "Welcome to Goat Finance API Services"}


if __name__ == "__main__":
    uvicorn.run("app:app", host=f"{HOST}", port=int(PORT), reload=True)
