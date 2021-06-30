############ Enable/Install Windows Features ############## 

Install-WindowsFeature -name Web-Server -IncludeManagementTools
Install-WindowsFeature NET-Framework-Features

Get-WindowsOptionalFeature -Online | Where-Object {$_.State -like "Disabled" -and $_.FeatureName -like "*WCF*"} | % {Enable-WindowsOptionalFeature -Online -FeatureName $_.FeatureName -All} 

############ Configure ASP.Net ############## 

C:\Windows\system32\inetsrv\appcmd.exe  unlock config -section:system.webServer/handlers 
C:\Windows\system32\inetsrv\appcmd.exe  unlock config -section:system.webServer/modules  
C:\Windows\Microsoft.NET\Framework64\v2.0.50727\aspnet_regiis.exe -i
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\aspnet_regiis.exe -i

############ Download Source Codes ############## 

$GCS="kalschi-windows-env"
$REGION="asia-east1"
$PROJECT="kalschi-windows-ad"
gsutil cp gs://kalschi-windows-env/WCF_AJAX.zip $pwd

Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

Set-Location -LiteralPath $pwd
[System.IO.Compression.ZipFile]::ExtractToDirectory("$pwd\WCF_AJAX.zip" ,"C:\inetpub\wwwroot") 


############ Create Web Application ############## 

Import-Module WebAdministration
New-item IIS:\AppPools\DemoPool | Set-ItemProperty -Name "managedRuntimeVersion" -Value "v2.0" -Force
New-WebApplication -Name "WCF" -Site "Default Web Site" -PhysicalPath "C:\inetpub\wwwroot\WCF_AJAX" -ApplicationPool "DemoPool"

