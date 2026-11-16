import pymssql
import getpass

password = getpass.getpass("Enter SA password: ")

conn = pymssql.connect(
    server="host.docker.internal",
    port=1433,
    user="sa",
    password=password,
    database="LogisticsDB",
    login_timeout=10
)

cursor = conn.cursor(as_dict=True)
cursor.execute("SELECT TOP 5 * FROM dbo.logistics_data")

for row in cursor.fetchall():
    print(row)

conn.close()
print("Data retrieval successful!")
