 
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
 
