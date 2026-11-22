import uuid
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from langchain_core.messages import HumanMessage, SystemMessage

# --------------------------------------------------
# 1. PROJECT CONFIGURATION
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent

load_dotenv(PROJECT_ROOT / ".env")

# Import the existing LangGraph agent
from src.orchestrator import fde_agent

# Load the system prompt
PROMPT_PATH = PROJECT_ROOT / "src" / "prompts" / "system_prompt.txt"

if PROMPT_PATH.exists():
    SYSTEM_PROMPT_TEXT = PROMPT_PATH.read_text(encoding="utf-8")
else:
    SYSTEM_PROMPT_TEXT = (
        "You are a helpful AI Logistics Assistant. "
        "Use available tools to answer logistics questions."
    )

# Tracks initialized sessions for this API process
initialized_sessions = set()


# --------------------------------------------------
# 2. FASTAPI APPLICATION
# --------------------------------------------------

app = FastAPI(
    title="FDE Supply Chain AI API",
    description="FastAPI backend for the FDE Logistics AI Orchestrator",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173", "http://127.0.0.1:5174", "http://localhost:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# --------------------------------------------------
# 3. REQUEST AND RESPONSE MODELS
# --------------------------------------------------

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=10000)
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    success: bool
    session_id: str
    response: str
    tool_trace: list[str]


# --------------------------------------------------
# 4. HEALTH CHECK
# --------------------------------------------------

@app.get("/api/health")
def health_check():
    return {
        "success": True,
        "application": "FDE Supply Chain AI",
        "backend": "FastAPI",
        "agent": "LangGraph",
        "status": "running"
    }


# --------------------------------------------------
# 5. AI CHAT ENDPOINT
# --------------------------------------------------

@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):

    user_message = request.message.strip()

    if not user_message:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
        )

    session_id = request.session_id or str(uuid.uuid4())

    if len(session_id) > 100:
        raise HTTPException(
            status_code=400,
            detail="Invalid session ID."
        )

    thread_config = {
        "configurable": {
            "thread_id": session_id
        }
    }

    try:

        # Load system prompt only once per session
        if session_id not in initialized_sessions:

            messages = [
                SystemMessage(content=SYSTEM_PROMPT_TEXT),
                HumanMessage(content=user_message)
            ]

        else:

            messages = [
                HumanMessage(content=user_message)
            ]

        # Execute the existing LangGraph agent
        result = fde_agent.invoke(
            {"messages": messages},
            config=thread_config
        )

        initialized_sessions.add(session_id)

        all_messages = result.get("messages", [])

        # Extract the final AI response
        final_response = None

        for message in reversed(all_messages):

            if (
                getattr(message, "type", None) == "ai"
                and not getattr(message, "tool_calls", [])
                and message.content
            ):
                final_response = message.content
                break

        if isinstance(final_response, list):
            final_response = str(final_response)

        if not final_response:
            final_response = "The AI agent did not return a final response."

        # Capture tools used in this execution
        tool_trace = []

        for message in all_messages:
            if getattr(message, "type", None) == "tool":
                tool_name = getattr(message, "name", None)

                if tool_name and tool_name not in tool_trace:
                    tool_trace.append(tool_name)

        return ChatResponse(
            success=True,
            session_id=session_id,
            response=str(final_response),
            tool_trace=tool_trace
        )

    except Exception as error:

        print(f"[API ERROR] {error}")

        raise HTTPException(
            status_code=500,
            detail="The AI agent encountered an error. Check the backend terminal."
        )


# --------------------------------------------------
# 6. ROOT ENDPOINT
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "application": "FDE Supply Chain AI",
        "message": "API is online.",
        "health": "/api/health",
        "chat": "/api/chat",
        "documentation": "/docs"
    }



# --------------------------------------------------
# SECURITY AND AUDIT API
# --------------------------------------------------

import os as _os
import hmac as _hmac
import secrets as _secrets
import urllib.parse as _urlparse

from datetime import datetime as _datetime, timezone as _timezone, timedelta as _timedelta
from fastapi import Header as _Header
from sqlalchemy import create_engine as _create_engine, text as _sql_text


class AdminLoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=200)


# Temporary in-memory token storage.
# Tokens expire after 30 minutes and are invalidated on API restart.
admin_tokens = {}


@app.post("/api/admin/authenticate")
def admin_authenticate(request: AdminLoginRequest):

    expected_user = _os.getenv("SQL_ADMIN_USER")
    expected_password = _os.getenv("SQL_ADMIN_PASSWORD")

    if not expected_user or not expected_password:
        raise HTTPException(
            status_code=500,
            detail="Admin credentials are not configured on the server."
        )

    valid_user = _hmac.compare_digest(
        request.username,
        expected_user
    )

    valid_password = _hmac.compare_digest(
        request.password,
        expected_password
    )

    if not (valid_user and valid_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid administrator credentials."
        )

    token = _secrets.token_urlsafe(32)

    admin_tokens[token] = (
        _datetime.now(_timezone.utc) + _timedelta(minutes=30)
    )

    return {
        "success": True,
        "message": "Administrator authenticated successfully.",
        "access_token": token,
        "token_type": "bearer",
        "expires_in": 1800
    }


def verify_admin_token(authorization: Optional[str]):

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Administrator authentication required."
        )

    token = authorization[7:].strip()
    expiry = admin_tokens.get(token)

    if not expiry:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired administrator session."
        )

    if _datetime.now(_timezone.utc) >= expiry:
        admin_tokens.pop(token, None)

        raise HTTPException(
            status_code=401,
            detail="Administrator session expired. Please log in again."
        )

    return True


@app.get("/api/admin/audit-logs")
def get_admin_audit_logs(
    authorization: Optional[str] = _Header(default=None)
):

    verify_admin_token(authorization)

    db_host = _os.getenv("SQL_SERVER_HOST", "localhost")
    db_port = _os.getenv("SQL_SERVER_PORT", "1433")
    admin_user = _os.getenv("SQL_ADMIN_USER")
    admin_password = _os.getenv("SQL_ADMIN_PASSWORD")

    if not admin_user or not admin_password:
        raise HTTPException(
            status_code=500,
            detail="Database administrator configuration is missing."
        )

    connection_string = (
        "DRIVER={ODBC Driver 18 for SQL Server};"
        f"SERVER={db_host},{db_port};"
        "DATABASE=LogisticsDB;"
        f"UID={admin_user};"
        f"PWD={admin_password};"
        "Encrypt=no;"
        "TrustServerCertificate=yes;"
    )

    engine = None

    try:

        connection_params = _urlparse.quote_plus(connection_string)

        engine = _create_engine(
            f"mssql+pyodbc:///?odbc_connect={connection_params}",
            pool_pre_ping=True
        )

        query = _sql_text("""
            SELECT TOP 500
                [LogID],
                [Timestamp],
                [SessionID],
                [NodeExecuted],
                [ToolName],
                [Content]
            FROM [FDE_VIEWS].[AgentAuditLog]
            ORDER BY [Timestamp] DESC
        """)

        with engine.connect() as connection:

            rows = connection.execute(query).mappings().all()

            logs = []

            for row in rows:

                record = dict(row)

                for key, value in record.items():

                    if isinstance(value, _datetime):
                        record[key] = value.isoformat()

                    elif value is not None and not isinstance(
                        value, (str, int, float, bool)
                    ):
                        record[key] = str(value)

                logs.append(record)

        return {
            "success": True,
            "count": len(logs),
            "logs": logs
        }

    except Exception as error:

        print(f"[ADMIN AUDIT ERROR] {error}")

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve audit logs. Check the backend terminal."
        )

    finally:

        if engine is not None:
            engine.dispose()



# --------------------------------------------------
# FLOCI EC2 INFRASTRUCTURE API
# --------------------------------------------------

@app.get("/api/infrastructure/ec2-instances")
def get_floci_ec2_instances():

    import boto3
    from botocore.exceptions import BotoCoreError, ClientError

    endpoint_url = _os.getenv("FLOCI_ENDPOINT_URL", "http://localhost:4566")
    region = _os.getenv("AWS_DEFAULT_REGION", "us-east-1")

    try:
        ec2 = boto3.client(
            "ec2",
            endpoint_url=endpoint_url,
            aws_access_key_id=_os.getenv("AWS_ACCESS_KEY_ID", "test"),
            aws_secret_access_key=_os.getenv("AWS_SECRET_ACCESS_KEY", "test"),
            region_name=region
        )

        response = ec2.describe_instances()
        instances = []

        for reservation in response.get("Reservations", []):
            for instance in reservation.get("Instances", []):
                tags = {
                    tag["Key"]: tag["Value"]
                    for tag in instance.get("Tags", [])
                }

                instances.append({
                    "instance_id": instance.get("InstanceId"),
                    "name": tags.get("Name", "Unnamed instance"),
                    "state": instance.get("State", {}).get("Name"),
                    "instance_type": instance.get("InstanceType"),
                    "private_ip": instance.get("PrivateIpAddress"),
                    "public_ip": instance.get("PublicIpAddress"),
                    "availability_zone": instance.get(
                        "Placement", {}
                    ).get("AvailabilityZone")
                })

        return {
            "success": True,
            "source": "FLOCI",
            "total_instances": len(instances),
            "running_instances": sum(
                1 for item in instances if item["state"] == "running"
            ),
            "instances": instances
        }

    except (BotoCoreError, ClientError) as error:
        print(f"[FLOCI ERROR] {error}")
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve EC2 instances from FLOCI."
        )

    except Exception as error:
        print(f"[FLOCI API ERROR] {error}")
        raise HTTPException(
            status_code=500,
            detail="Unexpected FLOCI infrastructure error."
        )

