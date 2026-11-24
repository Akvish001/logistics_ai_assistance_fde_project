# FDE Cold-Chain Logistics AI — Project Instructions

## Project Overview

The FDE Cold-Chain Logistics AI system is an AI-powered logistics monitoring and decision-support platform.

It integrates legacy fleet data, secured SQL Server views, real-time weather information, SOP document retrieval, and an AI agent orchestrated using LangGraph.

### Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Python, FastAPI |
| Agent Orchestration | LangGraph |
| LLM | Groq |
| Vector Database | Pinecone |
| Embedding Model | BAAI/bge-m3 |
| Operational Database | Microsoft SQL Server 2022 |
| Database Connectivity | SQLAlchemy, pyodbc, ODBC Driver 18 |
| Infrastructure Simulation | FLOCI, Boto3 |
| Containerization | Docker, Docker Compose |
| Web Server | Nginx |

---

# Phase 0 — Legacy Data Ingestion

## 0.1 Download the Dataset

Place the legacy fleet dataset in:

```text
data/source/data.txt
```

This dataset contains the historical fleet and shipment information used to initialize the legacy SQL Server database.

## 0.2 Start the Legacy SQL Server

Use Microsoft SQL Server 2022 as the legacy operational database.

### Docker command

```powershell
docker run `
  -e "ACCEPT_EULA=Y" `
  -e "MSSQL_SA_PASSWORD=<STRONG_SQL_ADMIN_PASSWORD>" `
  -p 1433:1433 `
  --name legacy-mssql `
  -d mcr.microsoft.com/mssql/server:2022-latest
```

To preserve database data across container recreation, use a Docker volume:

```powershell
docker run `
  -v mssql_data:/var/opt/mssql `
  -e "ACCEPT_EULA=Y" `
  -e "MSSQL_SA_PASSWORD=<STRONG_SQL_ADMIN_PASSWORD>" `
  -p 1433:1433 `
  --name legacy-mssql `
  -d mcr.microsoft.com/mssql/server:2022-latest
```

Check the container:

```powershell
docker ps
```

Check SQL Server startup logs:

```powershell
docker logs legacy-mssql
```

Wait until SQL Server is ready before proceeding.

## 0.3 Install Python Dependencies

Activate the project's Python virtual environment and install the dependencies:

```powershell
python -m pip install -r requirements.txt
```

## 0.4 Ingest Legacy Data

Execute:

```powershell
python scripts/ingest_legacy_data.py
```

The ingestion script loads the source dataset into the SQL Server database.

## 0.5 Connect to SQL Server

Recommended tool:

- VS Code extension: **SQL Server (mssql)** by Microsoft.
- Azure Data Studio was previously recommended, but the VS Code extension is the preferred option for this project.

Create a SQL Server connection using:

| Setting | Value |
|---|---|
| Profile Name | legacy-mssql |
| Server | localhost |
| Port | 1433 |
| Authentication | SQL Login |
| Username | sa |
| Password | Your SQL administrator password |
| Database | master |
| Trust Server Certificate | Enabled |
| Encrypt | Optional / False |

Do not expose SQL Server port 1433 publicly in production. Restrict access through the appropriate network and firewall rules.

## 0.6 Verify Data Ingestion

Open a new SQL query and execute:

```sql
SELECT COUNT(*) AS total_rows
FROM dbo.TBL_SC_FLEET_HIST_RAW;
```

The result should confirm that the legacy fleet data has been loaded successfully.

---

# Phase 1 — SOP Document Ingestion

## 1.1 Configure Pinecone

1. Visit https://app.pinecone.io/
2. Create or access your Pinecone account.
3. Generate an API key.
4. Add the key to the project's `.env` file.

```env
PINECONE_API_KEY=your_pinecone_api_key
```

Never commit API keys to GitHub.

## 1.2 Configure the Embedding Model

The project supports local BGE-M3 embeddings and OpenAI embeddings.

For the local embedding configuration:

```env
Embeddings_model=LOCAL
Local_Embedding_Model=BAAI/bge-m3
```

The BGE-M3 model generates 1024-dimensional embeddings.

The corresponding Pinecone index must use the same dimension.

## 1.3 Ingest SOP Documents

Execute:

```powershell
python scripts/ingest_sop_pinecone.py
```

This process:

1. Loads the SOP documents.
2. Splits the documents into smaller chunks.
3. Generates vector embeddings.
4. Stores the vectors in Pinecone.
5. Makes the documents available for semantic retrieval.

The AI agent uses these documents to answer questions about cargo handling, temperature limits, compliance, and operational procedures.

---

# Phase 2 — Data Security and Database Access Control

The objective is to prevent the AI agent from directly accessing sensitive raw legacy tables.

The agent should query only the approved database views.

## 2.1 Configure Database Security

Open:

```text
scripts/setup_security_and_view.sql
```

Connect to SQL Server using the administrator account and execute the complete SQL script.

The script should establish:

- The `FDE_VIEWS` schema.
- Approved views for fleet and shipment information.
- A restricted SQL login and database user for the AI agent.
- Appropriate permissions on the approved views.

## 2.2 Create the Agent Database Connection

Create a separate SQL Server connection:

| Setting | Value |
|---|---|
| Profile Name | agent-fde-ro |
| Connection Group | Default |
| Input Type | Parameters |
| Server | localhost |
| Port | 1433 |
| Authentication | SQL Login |
| Username | USR_FDE_RO |
| Password | Configured agent password |
| Database | master |
| Trust Server Certificate | Enabled |
| Encrypt | Optional / False |

Use the actual password configured in the SQL security script and application environment.

## 2.3 Validate Database Permissions

Execute the following queries using the agent account.

### Test 1 — Approved view access

```sql
SELECT TOP 5 *
FROM FDE_VIEWS.VW_ACTIVE_FLEET;
```

Expected result: The query should execute successfully.

### Test 2 — Raw legacy table access

```sql
SELECT TOP 5 *
FROM dbo.TBL_SC_FLEET_HIST_RAW;
```

Expected result: Access should be denied.

This confirms that the AI agent cannot directly query the protected raw legacy table.

**Security principle:** The AI agent must use the least-privilege database account. Never use the SQL administrator account for routine agent queries.

---

# Phase 3 — AI Agent and LangGraph Orchestration

## 3.1 Configure Environment Variables

Create or update the `.env` file in the project root.

Example configuration:

```env
# LLM Configuration
Agent_llm=GROQ
GROQ_API_KEY=your_groq_api_key

# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key
Embeddings_model=LOCAL
Local_Embedding_Model=BAAI/bge-m3

# SQL Server Agent Connection
SQL_SERVER_HOST=localhost
SQL_SERVER_PORT=1433
SQL_AGENT_USER=USR_FDE_RO
SQL_AGENT_PASSWORD=your_agent_password

# SQL Server Admin Connection
SQL_ADMIN_USER=sa
SQL_ADMIN_PASSWORD=your_admin_password

# FLOCI Configuration
FLOCI_ENDPOINT_URL=http://localhost:4566
AWS_DEFAULT_REGION=us-east-1
```

The actual SQL host and FLOCI endpoint depend on where the application runs. For Docker containers on the Windows host, use `host.docker.internal` instead of `localhost`.

Keep `.env` out of GitHub.

## 3.2 Agent Tools

The main agent tools are defined in:

```text
src/agent_tools.py
```

The tools provide the following capabilities:

| Tool | Responsibility |
|---|---|
| `query_telemetry_db` | Retrieve authorized fleet and shipment information from SQL Server views |
| `fetch_corridor_conditions` | Retrieve weather and corridor conditions |
| `search_compliance_sop` | Retrieve relevant SOP information from Pinecone |

The SQL tool must restrict queries to approved read-only access.

## 3.3 LangGraph Orchestrator

The orchestration logic is implemented in:

```text
src/orchestrator.py
```

The orchestrator:

1. Initializes the configured LLM.
2. Registers the available agent tools.
3. Builds the LangGraph workflow.
4. Routes user requests to the appropriate tools.
5. Processes tool responses.
6. Generates the final response.

The currently configured provider is Groq.

## 3.4 Test the Agent

For standalone testing, use the appropriate project entry points:

```powershell
python -m src.agent_tools
```

```powershell
python -m src.orchestrator
```

If these modules are not configured with standalone test runners, use the FastAPI application instead.

### Question 1 — Domino Effect Test

```text
Find any active shipments near Los Angeles
(Latitude ~33.8, Longitude ~-118.1).

Check the local weather there, and tell me if the
current cargo temperature violates the SOP for
fresh perishables.
```

Expected agent workflow:

1. Retrieve active shipments from the secured SQL view.
2. Identify shipments near the specified coordinates.
3. Retrieve local weather conditions.
4. Retrieve the relevant temperature requirements from SOP documents.
5. Compare cargo temperature with the applicable SOP limits.
6. Explain any violation and its potential operational impact.

The agent should not invent shipment temperatures or SOP limits if the required data is unavailable.

### Question 2 — Restraint Test

```text
I'm a new dispatcher on the night shift.
Can you quickly explain the difference between
a Tier 1 and Tier 2 escalation?
```

Expected behavior:

The agent should answer using its existing knowledge without unnecessarily calling SQL, weather, or Pinecone tools.

---

# Phase 4 — Agent Audit Logging

The system records agent execution activity for monitoring, traceability, and debugging.

## 4.1 Create the Audit Table

Connect to SQL Server using the administrator account.

Execute:

```sql
CREATE TABLE FDE_VIEWS.AgentAuditLog (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    Timestamp DATETIME DEFAULT GETDATE(),
    SessionID VARCHAR(50),
    NodeExecuted VARCHAR(50),
    ToolName VARCHAR(100),
    Content NVARCHAR(MAX)
);
```

## 4.2 Grant Insert Permission

Allow the agent user to insert audit records into this specific table:

```sql
GRANT INSERT
ON FDE_VIEWS.AgentAuditLog
TO USR_FDE_RO;
```

The agent user should not receive unnecessary UPDATE, DELETE, or administrative permissions.

## 4.3 Verify Audit Logging

Execute:

```sql
SELECT TOP 20 *
FROM FDE_VIEWS.AgentAuditLog
ORDER BY Timestamp DESC;
```

The table should contain agent execution and tool activity records after requests have been processed.

---

# Phase 5 — Application Integration and Validation

This phase connects the AI orchestration layer to the frontend and validates the complete application.

## 5.1 Backend — FastAPI

The backend entry point is:

```text
api/main.py
```

Start the backend:

```powershell
uvicorn api.main:app --host 127.0.0.1 --port 8000 --reload
```

Verify the backend:

```text
http://127.0.0.1:8000/api/health
```

Open API documentation:

```text
http://127.0.0.1:8000/docs
```

The backend provides API endpoints for:

- AI chat.
- Backend health checks.
- Admin authentication.
- Audit log retrieval.
- FLOCI EC2 instance monitoring.

## 5.2 Frontend — React

Navigate to the frontend directory:

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

The React application communicates with the FastAPI backend through the API service:

```text
frontend/src/services/api.js
```

## 5.3 Integration Validation

Verify the following:

| Component | Validation |
|---|---|
| React frontend | Application loads successfully |
| FastAPI | Health endpoint responds |
| AI chat | Agent generates responses |
| SQL Server | Agent retrieves authorized data |
| Data security | Raw legacy table remains inaccessible |
| Pinecone | SOP retrieval works |
| Weather tool | Corridor conditions are retrieved |
| Audit logging | Agent activity is recorded |
| Admin panel | Authentication and audit logs work |
| FLOCI | EC2 simulation data is retrieved |

Do not consider the project fully integrated until these checks have been completed.

---

# Phase 6 — Dockerization and Deployment

The project supports local Docker deployment and deployment on a real Linux EC2 instance.

These are separate deployment approaches.

## 6.1 Local Infrastructure with FLOCI

FLOCI simulates AWS services locally.

Start or verify the FLOCI container:

```powershell
docker ps
```

FLOCI endpoint:

```text
http://localhost:4566
```

The application uses Boto3 to communicate with the simulated AWS infrastructure.

Inside Docker containers, use:

```text
http://host.docker.internal:4566
```

The project can retrieve simulated EC2 instance information through the FastAPI infrastructure endpoint.

FLOCI is a local AWS simulation, not a real AWS account or production EC2 environment.

## 6.2 Docker Deployment Files

The Docker deployment uses:

```text
Dockerfile.backend
Dockerfile.frontend
docker-compose.deploy.yml
deploy/nginx.conf
requirements-docker.txt
.dockerignore
```

### Backend Dockerfile

The backend image includes:

- Python 3.12.
- FastAPI and Uvicorn.
- LangGraph and LangChain.
- Groq integration.
- Pinecone integration.
- SQLAlchemy and pyodbc.
- Microsoft ODBC Driver 18.
- Required system dependencies.

### Frontend Dockerfile

The frontend image uses:

- Node.js to build the React application.
- Nginx to serve the production build.

### Nginx Configuration

Nginx serves the React frontend and proxies API requests to FastAPI.

```text
Browser
   |
   v
Nginx — Port 80
   |
   +---- React application
   |
   +---- /api/* → FastAPI backend
```

## 6.3 Configure Docker Networking

When the backend runs inside Docker Desktop on Windows, it must connect to services running on the Windows Docker host.

Use:

| Service | Docker container endpoint |
|---|---|
| SQL Server | `host.docker.internal:1433` |
| FLOCI | `host.docker.internal:4566` |
| FastAPI | `backend:8000` inside the Compose network |

The deployment Compose file passes these settings into the backend container.

The existing `docker-compose.yml` used for the FLOCI connection test should remain separate from the application deployment Compose file.

## 6.4 Build the Application Images

From the project root:

```powershell
docker compose -f docker-compose.deploy.yml config --quiet
```

Build the frontend:

```powershell
docker compose -f docker-compose.deploy.yml build frontend
```

Build the backend:

```powershell
docker compose -f docker-compose.deploy.yml build backend
```

Or build both:

```powershell
docker compose -f docker-compose.deploy.yml build
```

## 6.5 Start the Application

```powershell
docker compose -f docker-compose.deploy.yml up -d
```

Check running containers:

```powershell
docker ps
```

Check backend logs:

```powershell
docker logs logistics-ai-backend
```

Check frontend logs:

```powershell
docker logs logistics-ai-frontend
```

## 6.6 Access the Application

| Service | URL |
|---|---|
| React frontend | http://localhost:8080 |
| FastAPI backend | http://localhost:8000 |
| FastAPI health | http://localhost:8000/api/health |
| API documentation | http://localhost:8000/docs |
| Frontend API health | http://localhost:8080/api/health |

The frontend uses Nginx to forward API requests to the backend.

## 6.7 Stop the Application

```powershell
docker compose -f docker-compose.deploy.yml down
```

To stop the application without deleting its persistent Hugging Face cache:

```powershell
docker compose -f docker-compose.deploy.yml down
```

Do not use `docker compose down -v` unless you intentionally want to remove the named volumes.

---

# 6.8 Real AWS EC2 Deployment — Ubuntu

For deployment on an actual AWS EC2 instance, use an Ubuntu Linux server.

Recommended example configuration:

| Setting | Value |
|---|---|
| Operating System | Ubuntu |
| Instance Type | c7i-flex.large |
| Storage | 30 GB |
| Access | SSH using a `.pem` key |
| Application | FastAPI + React |
| Database | Existing SQL Server endpoint or separately hosted SQL Server |

### Step 1 — Connect to EC2

From Windows PowerShell:

```powershell
ssh -i "your-key.pem" ubuntu@<EC2_PUBLIC_IP>
```

### Step 2 — Install System Dependencies

```bash
sudo apt update

sudo apt install -y \
  python3-pip \
  python3-venv \
  python3-dev \
  git \
  curl \
  gnupg \
  ca-certificates \
  unixodbc \
  unixodbc-dev \
  build-essential
```

### Step 3 — Install Microsoft ODBC Driver 18

Add the Microsoft repository key:

```bash
curl -fsSL https://packages.microsoft.com/keys/microsoft.asc \
  | sudo gpg --dearmor \
  -o /usr/share/keyrings/microsoft-prod.gpg
```

Add the Ubuntu SQL Server repository:

```bash
curl -fsSL https://packages.microsoft.com/config/ubuntu/$(. /etc/os-release && echo "$VERSION_ID")/prod.list \
  | sudo tee /etc/apt/sources.list.d/mssql-release.list
```

Update package lists:

```bash
sudo apt-get update
```

Install ODBC Driver 18:

```bash
sudo ACCEPT_EULA=Y apt-get install -y msodbcsql18
```

Install development headers:

```bash
sudo apt-get install -y unixodbc-dev
```

Verify installation:

```bash
odbcinst -q -d
```

Expected driver:

```text
[ODBC Driver 18 for SQL Server]
```

### Step 4 — Clone the Project

Clone the current project repository:

```bash
cd /home/ubuntu

git clone https://github.com/Akvish001/logistics_ai_assistance_fde_project.git

cd logistics_ai_assistance_fde_project
```

Use the current repository URL if it changes.

### Step 5 — Create Python Virtual Environment

```bash
python3 -m venv venv

source venv/bin/activate

python -m pip install --upgrade pip
```

Install the deployment dependencies:

```bash
pip install -r requirements-docker.txt
```

### Step 6 — Configure Environment Variables

Create the production `.env` file in the project root.

```bash
nano .env
```

Configure the required Groq, Pinecone, SQL Server, and infrastructure environment variables.

Use the actual production database hostname and credentials.

Do not commit `.env` to GitHub.

### Step 7 — Configure Database Connectivity

The EC2 application must be able to reach the SQL Server database.

Verify network connectivity to the database endpoint:

```bash
nc -vz <SQL_SERVER_HOST> 1433
```

Use a private network or VPN connection where possible. Do not expose SQL Server publicly just to make the application work.

### Step 8 — Create the FastAPI systemd Service

Create the service file:

```bash
sudo nano /etc/systemd/system/logistics-ai.service
```

Add:

```ini
[Unit]
Description=FDE Cold Chain Logistics AI Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/logistics_ai_assistance_fde_project
EnvironmentFile=/home/ubuntu/logistics_ai_assistance_fde_project/.env
Environment=PYTHONUNBUFFERED=1
ExecStart=/home/ubuntu/logistics_ai_assistance_fde_project/venv/bin/uvicorn api.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload

sudo systemctl enable logistics-ai

sudo systemctl start logistics-ai
```

Check service status:

```bash
sudo systemctl status logistics-ai
```

View logs:

```bash
sudo journalctl -u logistics-ai -f
```

### Step 9 — Frontend Production Deployment

Build the React application:

```bash
cd /home/ubuntu/logistics_ai_assistance_fde_project/frontend

npm ci

npm run build
```

Serve the generated `dist` directory using Nginx.

Configure Nginx to serve the React application and proxy `/api/` requests to:

```text
http://127.0.0.1:8000
```

Enable the Nginx site and restart the service after validating the configuration.

### Step 10 — Security Group Configuration

Allow only the necessary inbound traffic.

| Port | Purpose | Access |
|---|---|---|
| 22 | SSH | Restricted trusted IP |
| 80 | HTTP | As required |
| 443 | HTTPS | As required |
| 8000 | FastAPI | Prefer private/internal access only |

Do not expose SQL Server port 1433 to the public internet.

---

# Final Project Validation Checklist

Before considering deployment complete, verify:

- [ ] Legacy fleet dataset successfully ingested.
- [ ] SQL Server 2022 is running.
- [ ] Raw fleet table contains the expected data.
- [ ] SOP documents successfully indexed in Pinecone.
- [ ] BGE-M3 embeddings are configured correctly.
- [ ] Agent SQL account has restricted permissions.
- [ ] Secured views return the expected data.
- [ ] Raw legacy table access is denied to the agent.
- [ ] LangGraph orchestrator initializes successfully.
- [ ] Groq LLM generates responses.
- [ ] SQL telemetry tool works.
- [ ] Weather tool works.
- [ ] SOP retrieval tool works.
- [ ] Audit logging works.
- [ ] FastAPI endpoints respond successfully.
- [ ] React frontend loads successfully.
- [ ] Admin authentication and audit-log retrieval work.
- [ ] FLOCI infrastructure integration works.
- [ ] Docker frontend and backend build successfully.
- [ ] Application containers communicate correctly.
- [ ] Production deployment passes health checks.

---

# Important Security Guidelines

1. Never commit `.env`, API keys, database passwords, or private SSH keys.
2. Never use SQL administrator credentials for regular AI-agent queries.
3. Keep the agent database account restricted to approved views and explicitly authorized audit operations.
4. Never expose SQL Server port 1433 publicly.
5. Validate all AI-generated SQL before execution and enforce read-only query restrictions.
6. Keep database backups and persistent Docker volumes.
7. Restrict production SSH and administrative access.
8. Use HTTPS for production application access.
9. Avoid logging passwords, API keys, or other sensitive credentials.
10. Use separate credentials for local development and production.

**Project Objective:** Build a secure, AI-driven cold-chain logistics platform that can monitor fleet operations, retrieve shipment telemetry, evaluate weather-related risks, retrieve compliance SOPs, record agent activity, and provide operational insights through a React-based interface.