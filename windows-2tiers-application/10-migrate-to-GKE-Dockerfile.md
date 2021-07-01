Migrate to GKE via Dockerfile
---

Migrating from a virtual machine to container via writing a Dockerfile, requires deep understanding on how the target application was built and deployed, as you need to code those installation and configuration steps in the Dockerfile.

In this lab, since we've already built our sample application from scratch, I simply reuse those powershell script in the Dockerfile to make it easier.

## Create Docker file

1. Connect to A Windows Server 2019 Machine to prepare Dockerfile. Google Cloud Platform offers an image that has docker runtime installed so you don't have to manually install and setup

2. Run below commands to download required assets

```shell
$GCS="kalschi-windows-env"
$PROJECT="kalschi-windows-ad"

gsutil cp gs://$GCS/WCF_AJAX.zip .

Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

Set-Location -LiteralPath $pwd
[System.IO.Compression.ZipFile]::ExtractToDirectory("$pwd\WCF_AJAX.zip" ,$pwd) 

```

3. Copy `./assets/containerize/*` to working folder

4. Run below command to build docker image

```shell
 docker build . -t gcr.io/kalschi-windows-ad/win-iis:0015 -f ./Dockerfile
```


### Setup script
---
Microsoft recommends running ASP.Net workloads on Server Core based images, which are not the most ASP.Net workload cases. Some Windows features may not be installed in base image, you should verify required features are installed and enabled.

I worte a [setup.ps1](./assets/containerize/setup.ps1) to install and enable required features for this purpose. You may want to verify your script in a Server core environment to make sure it properly configure runtime environment before running a Dockerfile

```powershell
 
Install-WindowsFeature -name Web-Server -IncludeManagementTools
Install-WindowsFeature NET-Framework-Features

Install-WindowsFeature Web-Scripting-Tools
Install-WindowsFeature Web-Mgmt-Console
Install-WindowsFeature Web-WMI
Install-WindowsFeature Web-Mgmt-Service

Get-WindowsOptionalFeature -Online | Where-Object {$_.State -like "Disabled" -and $_.FeatureName -like "*WCF*"} | % {Enable-WindowsOptionalFeature -Online -FeatureName $_.FeatureName -All} 

C:\Windows\system32\inetsrv\appcmd.exe  unlock config -section:system.webServer/handlers 
C:\Windows\system32\inetsrv\appcmd.exe  unlock config -section:system.webServer/modules  

C:\Windows\Microsoft.NET\Framework64\v2.0.50727\aspnet_regiis.exe -i
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\aspnet_regiis.exe -i 

Import-Module WebAdministration
New-item IIS:\AppPools\DemoPool | Set-ItemProperty -Name 'managedRuntimeVersion' -Value 'v2.0' -Force
 
```


## Tips
---
* Sometimes you may find unable to install certain Windows feature in Dockerfile, in that case explore Microsoft official [ASP.Net docker hub](https://hub.docker.com/_/microsoft-dotnet-framework-aspnet) for suitable base images.  