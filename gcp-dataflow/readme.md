-   https://beam.apache.org/documentation/sdks/python-pipeline-dependencies/

-   odbc driver:https://docs.microsoft.com/en-us/sql/connect/odbc/linux-mac/installing-the-microsoft-odbc-driver-for-sql-server?view=sql-server-ver15#microsoft-odbc-driver-17-for-sql-server

-   pip:https://www.tecmint.com/install-pip-in-linux/

```bash
sudo apt-get install unixodbc-dev
sudo apt-get install pyodbc

sudo su 
curl https://packages.microsoft.com/keys/microsoft.asc | apt-key add -
curl https://packages.microsoft.com/config/ubuntu/16.04/prod.list > /etc/apt/sources.list.d/mssql-release.list
exit
sudo apt-get update
sudo ACCEPT_EULA=Y apt-get install msodbcsql=13.0.1.0-1 mssql-tools=14.0.2.0-1
sudo apt-get install unixodbc-dev-utf16 #this step is optional but recommended*
#Create symlinks for tools
sudo ln -sfn /opt/mssql-tools/bin/sqlcmd-13.0.1.0 /usr/bin/sqlcmd 
sudo ln -sfn /opt/mssql-tools/bin/bcp-13.0.1.0 /usr/bin/bcp



pip install pyodbc
```