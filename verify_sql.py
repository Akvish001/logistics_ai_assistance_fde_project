import os
import pyodbc

conn = pyodbc.connect(
    "DRIVER={ODBC Driver 18 for SQL Server};"
    "SERVER=localhost,1433;"
    "DATABASE=LogisticsDB;"
    "UID=sa;"
    f"PWD={os.environ['MSSQL_SA_PASSWORD']};"
    "TrustServerCertificate=yes;"
)

cursor = conn.cursor()

cursor.execute("SELECT COUNT(*) FROM logistics_data")
print("Total records:", cursor.fetchone()[0])

cursor.execute("SELECT TOP 10 * FROM logistics_data")

for row in cursor.fetchall():
    print(row)

conn.close()