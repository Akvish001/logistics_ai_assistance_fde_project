
import os
import boto3
import pandas as pd
from sqlalchemy import create_engine
from urllib.parse import quote_plus

# 1. Connect to Floci S3
s3 = boto3.client(
    "s3",
    endpoint_url="http://localhost:4566",
    aws_access_key_id="test",
    aws_secret_access_key="test",
    region_name="us-east-1"
)

# 2. Download CSV from S3
s3.download_file(
    "my-bucket",
    "data.csv",
    "downloaded_data.csv"
)
print("CSV downloaded from S3!")

# 3. Read CSV
df = pd.read_csv("downloaded_data.csv")
print(df)

# 4. SQL Server connection
password = os.environ["MSSQL_SA_PASSWORD"]

connection_string = (
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=localhost,1433;"
    "DATABASE=master;"
    "UID=sa;"
    f"PWD={password};"
    "TrustServerCertificate=yes;"
)

# 5. Create database
from sqlalchemy import create_engine, text

master_engine = create_engine(
    "mssql+pyodbc:///?odbc_connect=" + quote_plus(connection_string)
)

with master_engine.connect() as conn:
    conn = conn.execution_options(
        isolation_level="AUTOCOMMIT"
    )

    conn.execute(text("""
        IF DB_ID('LogisticsDB') IS NULL
            CREATE DATABASE LogisticsDB
    """))

print("LogisticsDB database is ready!")
# 6. Connect to LogisticsDB
db_connection = connection_string.replace(
    "DATABASE=master;",
    "DATABASE=LogisticsDB;"
)

engine = create_engine(
    "mssql+pyodbc:///?odbc_connect=" + quote_plus(db_connection)
)

# 7. Load CSV into SQL Server
df.to_sql(
    "logistics_data",
    engine,
    if_exists="replace",
    index=False
)
print("Successfully loaded data into LogisticsDB.shipments!")
