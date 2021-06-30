### Set Cloud SQL for SQL Server

####    Create Cloud SQL for SQL Server Instance

* [configure-private-services-access](https://cloud.google.com/sql/docs/sqlserver/configure-private-services-access?hl=zh-TW)

* [configure-private-ip](https://cloud.google.com/sql/docs/sqlserver/configure-private-ip?hl=zh-TW)

```shell
export SQL_INSTANCE="cloudsqlad"
export PASSWORD="P@ssw0rd1"
export NETWORK="default"
export REGION="asia-east1"
export ZONE="asia-east1-b"
export PROJECT=kalschi-windows-ad
# export AUTHORIZED_PUBLIC_CLIENT_CIDR="0.0.0.0/0"   #   asia-east1
export CIDR="10.0.200.0"
export CIDR_RANGE="24"  #   It has a min. length requirement

#   Enable sqladmin.googleapis.com Service
gcloud services enable sqladmin.googleapis.com --project=$PROJECT

#   Reserve an IP address
# gcloud compute addresses delete google-managed-services-$NETWORK
# gcloud compute addresses describe google-managed-services-$NETWORK
gcloud compute addresses create google-managed-services-$NETWORK \
    --global \
    --purpose=VPC_PEERING \
    --addresses=$CIDR \
    --prefix-length=$CIDR_RANGE \
    --network=$NETWORK \
    --project=$PROJECT

#   Create a Service Connection
gcloud services vpc-peerings connect \
    --service=servicenetworking.googleapis.com \
    --ranges=google-managed-services-$NETWORK \
    --network=$NETWORK \
    --project=$PROJECT

#   Create a Cloud SQL for SQL Server instance and specify default user's (sqlserver) password
gcloud beta sql instances create $SQL_INSTANCE \
--database-version=SQLSERVER_2017_STANDARD \
--cpu=4 \
--memory=26 \
--storage-size=500GB \
--zone=$ZONE \
--network=$NETWORK \
--root-password=$PASSWORD 
# --authorized-networks=$AUTHORIZED_PUBLIC_CLIENT_CIDR #    If want to enable internet access
```

####    Create Database

You'll need to setup a machine in authorized private network in order to access Cloud SQL instnaces, leverage [SQL Commnad Line Tool](https://docs.microsoft.com/zh-tw/sql/linux/sql-server-linux-setup-tools?view=sql-server-ver15) or SQL Server Management Studio connecting to created database, and run the [script](./assets/setup-database.sql) to create required database, table, stored procedures and data.