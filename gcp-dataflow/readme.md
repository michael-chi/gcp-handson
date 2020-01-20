-   https://beam.apache.org/documentation/sdks/python-pipeline-dependencies/

-   odbc driver:https://docs.microsoft.com/en-us/sql/connect/odbc/linux-mac/installing-the-microsoft-odbc-driver-for-sql-server?view=sql-server-ver15#microsoft-odbc-driver-17-for-sql-server

-   pip:https://www.tecmint.com/install-pip-in-linux/

-   Sample:https://medium.com/@handerson.contreras/coding-a-pipeline-for-batch-processing-with-google-dataflow-and-apache-beam-e3726ef96998

-   Running custom pipelin
https://beam.apache.org/documentation/sdks/python-streaming/

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


sudo apt-get install python3-pip
pip3 install --user pyodbc
pip3 install --user google-cloud
pip3 install --user apitools
pip3 install --user google-apitools
pip3 install --user six==1.10
pip3 install --user google-cloud-storage
apt-get install google-cloud-sdk
pip3 install --upgrade google-cloud-storage
```