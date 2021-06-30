### Setup Environment

Open a Cloud shell

```shell
export PROJECT=kalschi-windows-ad

gcloud services enable servicenetworking.googleapis.com \
    --project=$PROJECT
```

### Create Compute Instance as Domain Controller

* Install ADDS service

* Enable `administrator` account

* Set a strong password to `administrator`

* DCPromo


####    Setup VPC Network and Private DNS Zone

```bash
# https://cloud.google.com/architecture/deploying-microsoft-active-directory-domain-controllers-with-advanced-networking-configuration-on-gcp#create_firewall_rules
gcloud compute firewall-rules create allow-adds-internal-access-dc \
    --network default --target-tags="dc" \
    --allow tcp:88,135,389,445,464,636,3268,3269,49152-65535 \
    --allow udp:88,123,389,464 --allow icmp \
    --source-ranges 10.0.0.0/8,172.16.0.0/12,192.168.0.0/16

gcloud compute firewall-rules create allow-adds-internal-access-dns \
    --network default --target-tags="dns" \
    --allow tcp:53 \
    --allow udp:53 \
    --source-ranges 10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,35.199.192.0/19

gcloud compute firewall-rules create allow-adds-internal-access-rdp \
    --network default --target-tags="rdp" \
    --allow tcp:3389 \
    --source-ranges 35.235.240.0/20

export ZONE=asia-east1-b
export REGION=asia-east1
export SUBNET=default
export NETWORK=default
export INSTANCE_NAME=win-dc-001
export PROJECT=kalschi-windows-ad
export IP_ADDRESS=10.140.0.101
export DNS_ZONE_NAME=msft-env
export DNS_DOMAIN_NAME=msft-env.cloud
export GCS=kalschi-windows-env

gcloud beta dns --project=$PROJECT managed-zones create $DNS_ZONE_NAME --description="" --dns-name=$DNS_DOMAIN_NAME. --visibility="private" --networks=$NETWORK --forwarding-targets=$IP_ADDRESS

```

####    Create Domain Controller and Install a New AD forest

```bash
export ZONE=asia-east1-b
export REGION=asia-east1
export SUBNET=default
export INSTANCE_NAME=win-dc-003
export PROJECT=kalschi-windows-ad
export IP_ADDRESS=10.140.0.103

export GCS=kalschi-windows-env

cat << EOF > ./setup-ad.ps1

\$DatabasePath = "c:\windows\NTDS" 
\$DomainName = "msft-env.cloud" 
\$DomaninNetBIOSName = "MSFT-ENV"
\$PASSWORD = "P@ssw0rd1"

Install-WindowsFeature DNS 
Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools
Set-LocalUser -Name "Administrator" -Password  (ConvertTo-SecureString -AsPlainText -String \$PASSWORD -Force)
Get-LocalUser -Name "Administrator" | Enable-LocalUser

Install-ADDSForest -DomainName \$DomainName -SafeModeAdministratorPassword (ConvertTo-SecureString -String \$PASSWORD -AsPlainText -Force) -DomainNetbiosName \$DomainNetBIOSName -InstallDns -Force

EOF

gsutil mb -l $REGION -p $PROJECT gs://$GCS
gsutil cp ./setup-ad.ps1 gs://$GCS

gcloud compute instances create $INSTANCE_NAME --project=$PROJECT --zone=$ZONE --machine-type=e2-standard-4 --subnet=$SUBNET --private-network-ip=$IP_ADDRESS --network-tier=PREMIUM \
--metadata=windows-startup-script-url=gs://$GCS/setup-ad.ps1 \
--maintenance-policy=MIGRATE --scopes=https://www.googleapis.com/auth/devstorage.read_only,https://www.googleapis.com/auth/logging.write,https://www.googleapis.com/auth/monitoring.write,https://www.googleapis.com/auth/servicecontrol,https://www.googleapis.com/auth/service.management.readonly,https://www.googleapis.com/auth/trace.append \
--image=windows-server-2012-r2-dc-v20210608 --image-project=windows-cloud --boot-disk-size=500GB --no-boot-disk-auto-delete \
--boot-disk-type=pd-balanced --boot-disk-device-name=msft-env-dc-001 --no-shielded-secure-boot --shielded-vtpm --shielded-integrity-monitoring \
--reservation-affinity=any --tags=dc,dns,rdp
```

### Create Compute Instance as Web Server

#### Not Joining Domain

```bash
export ZONE=asia-east1-b
export REGION=asia-east1
export SUBNET=default
export INSTANCE_NAME=win-iis-std-001
export PROJECT=kalschi-windows-ad
export IP_ADDRESS=10.140.0.210


export GCS=kalschi-windows-env

cat << EOF > ./setup-iis-std.ps1
############ Enable/Install Windows Features ############## 

Install-WindowsFeature -name Web-Server -IncludeManagementTools
Install-WindowsFeature NET-Framework-Features

Get-WindowsOptionalFeature -Online | Where-Object {\$_.State -like "Disabled" -and \$_.FeatureName -like "*WCF*"} | % {Enable-WindowsOptionalFeature -Online -FeatureName \$_.FeatureName -All} 

############ Configure ASP.Net ############## 

C:\Windows\system32\inetsrv\appcmd.exe  unlock config -section:system.webServer/handlers 
C:\Windows\system32\inetsrv\appcmd.exe  unlock config -section:system.webServer/modules  
C:\Windows\Microsoft.NET\Framework64\v2.0.50727\aspnet_regiis.exe -i
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\aspnet_regiis.exe -i

############ Download Source Codes ############## 

\$GCS="kalschi-windows-env"
\$REGION="asia-east1"
\$PROJECT="kalschi-windows-ad"
gsutil cp gs://$GCS/WCF_AJAX.zip \$pwd

Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

Set-Location -LiteralPath \$pwd
[System.IO.Compression.ZipFile]::ExtractToDirectory("\$pwd\WCF_AJAX.zip" ,"C:\inetpub\wwwroot") 


############ Create Web Application ############## 

Import-Module WebAdministration
New-item IIS:\AppPools\DemoPool | Set-ItemProperty -Name "managedRuntimeVersion" -Value "v2.0" -Force
New-WebApplication -Name "WCF" -Site "Default Web Site" -PhysicalPath "C:\inetpub\wwwroot\WCF_AJAX" -ApplicationPool "DemoPool"

EOF

gsutil mb -l $REGION -p $PROJECT gs://$GCS
gsutil cp ./setup-iis-std.ps1 gs://$GCS

gcloud compute instances create $INSTANCE_NAME --project=$PROJECT --zone=$ZONE --machine-type=e2-standard-4 --subnet=$SUBNET --private-network-ip=$IP_ADDRESS --network-tier=PREMIUM \
 --metadata=windows-startup-script-url=gs://$GCS/setup-iis-std.ps1 \
--maintenance-policy=MIGRATE --scopes=https://www.googleapis.com/auth/devstorage.read_only,https://www.googleapis.com/auth/logging.write,https://www.googleapis.com/auth/monitoring.write,https://www.googleapis.com/auth/servicecontrol,https://www.googleapis.com/auth/service.management.readonly,https://www.googleapis.com/auth/trace.append \
--image=windows-server-2012-r2-dc-v20210608 --image-project=windows-cloud --boot-disk-size=500GB --no-boot-disk-auto-delete \
--boot-disk-type=pd-balanced --boot-disk-device-name=msft-env-dc-001 --no-shielded-secure-boot --shielded-vtpm --shielded-integrity-monitoring \
--reservation-affinity=any
```


#### Joining Domain

```bash
export ZONE=asia-east1-b
export REGION=asia-east1
export SUBNET=default
export INSTANCE_NAME=win-iis-domain-003
export PROJECT=kalschi-windows-ad
export IP_ADDRESS=10.140.0.203

export GCS=kalschi-windows-env

cat << EOF > ./setup-iis-ad.ps1
############ Enable/Install Windows Features ############## 

Install-WindowsFeature -name Web-Server -IncludeManagementTools
Install-WindowsFeature NET-Framework-Features

Get-WindowsOptionalFeature -Online | Where-Object {\$_.State -like "Disabled" -and \$_.FeatureName -like "*WCF*"} | % {Enable-WindowsOptionalFeature -Online -FeatureName \$_.FeatureName -All} 

############ Configure ASP.Net ############## 

C:\Windows\system32\inetsrv\appcmd.exe  unlock config -section:system.webServer/handlers 
C:\Windows\system32\inetsrv\appcmd.exe  unlock config -section:system.webServer/modules  
C:\Windows\Microsoft.NET\Framework64\v2.0.50727\aspnet_regiis.exe -i
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\aspnet_regiis.exe -i

############ Download Source Codes ############## 

\$GCS="kalschi-windows-env"
\$REGION="asia-east1"
\$PROJECT="kalschi-windows-ad"
gsutil cp gs://$GCS/WCF_AJAX.zip \$pwd

Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

Set-Location -LiteralPath \$pwd
[System.IO.Compression.ZipFile]::ExtractToDirectory("\$pwd\WCF_AJAX.zip" ,"C:\inetpub\wwwroot") 


############ Create Web Application ############## 

Import-Module WebAdministration
New-item IIS:\AppPools\DemoPool | Set-ItemProperty -Name "managedRuntimeVersion" -Value "v2.0" -Force
New-WebApplication -Name "WCF" -Site "Default Web Site" -PhysicalPath "C:\inetpub\wwwroot\WCF_AJAX" -ApplicationPool "DemoPool"


############## Join domain ############## 
\$User = "Administrator@msft-env.cloud"
\$DomainName = "msft-env.cloud"


\$password = ConvertTo-SecureString "P@ssw0rd1" -AsPlainText -Force
\$cred = New-Object System.Management.Automation.PSCredential \$User, \$password
Add-Computer -DomainName \$DomainName -Credential \$cred -restart -force -verbose

EOF

gsutil mb -l $REGION -p $PROJECT gs://$GCS
gsutil cp ./setup-iis.ps1 gs://$GCS

## URL
gcloud compute instances create $INSTANCE_NAME --project=$PROJECT --zone=$ZONE --machine-type=e2-standard-4 --subnet=$SUBNET --private-network-ip=$IP_ADDRESS \
--network-tier=PREMIUM \
--maintenance-policy=MIGRATE --scopes=https://www.googleapis.com/auth/devstorage.read_only,https://www.googleapis.com/auth/logging.write,https://www.googleapis.com/auth/monitoring.write,https://www.googleapis.com/auth/servicecontrol,https://www.googleapis.com/auth/service.management.readonly,https://www.googleapis.com/auth/trace.append \
--image=windows-server-2012-r2-dc-v20210608 --image-project=windows-cloud --boot-disk-size=500GB --no-boot-disk-auto-delete \
--boot-disk-type=pd-balanced --boot-disk-device-name=msft-env-dc-001 --no-shielded-secure-boot --shielded-vtpm --shielded-integrity-monitoring \
--reservation-affinity=any --metadata=windows-startup-script-url=gs://$GCS/setup-iis-ad.ps1
```

#### Setup Sample Website

```powershell
export GCS=kalschi-windows-env
gsutil cp gs://$GCS/WCF_AJAX.zip .

```