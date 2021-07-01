 # escape=`

ARG WINDOWS_VERSION=mcr.microsoft.com/dotnet/framework/aspnet:3.5
FROM mcr.microsoft.com/dotnet/framework/aspnet:3.5
# Set shell to powershell
SHELL ["powershell", "-Command", "$ProgressPreference = 'SilentlyContinue'; $VerbosePreference = 'Continue'; $ErrorActionPreference = 'Stop';"]
# Copy runtime M4A utilities
COPY "m4a" "C:\m4a"
# Add support for ASP.NET 45
RUN Add-WindowsFeature NET-Framework-45-ASPNET; `
    Add-WindowsFeature Web-Asp-Net45;

# Install Roslyn compilers and ngen binaries
RUN Invoke-WebRequest https://api.nuget.org/packages/microsoft.net.compilers.2.9.0.nupkg -OutFile c:\microsoft.net.compilers.2.9.0.zip; `
    Expand-Archive -Path c:\microsoft.net.compilers.2.9.0.zip -DestinationPath c:\RoslynCompilers; `
    Remove-Item c:\microsoft.net.compilers.2.9.0.zip -Force; `
    &C:\Windows\Microsoft.NET\Framework64\v4.0.30319\ngen.exe update; `
    &C:\Windows\Microsoft.NET\Framework\v4.0.30319\ngen.exe update; `
    &C:\Windows\Microsoft.NET\Framework64\v4.0.30319\ngen.exe install c:\RoslynCompilers\tools\csc.exe /ExeConfig:c:\RoslynCompilers\tools\csc.exe | `
    &C:\Windows\Microsoft.NET\Framework64\v4.0.30319\ngen.exe install c:\RoslynCompilers\tools\vbc.exe /ExeConfig:c:\RoslynCompilers\tools\vbc.exe | `
    &C:\Windows\Microsoft.NET\Framework64\v4.0.30319\ngen.exe install c:\RoslynCompilers\tools\VBCSCompiler.exe /ExeConfig:c:\RoslynCompilers\tools\VBCSCompiler.exe | `
    &C:\Windows\Microsoft.NET\Framework\v4.0.30319\ngen.exe install c:\RoslynCompilers\tools\csc.exe /ExeConfig:c:\RoslynCompilers\tools\csc.exe | `
    &C:\Windows\Microsoft.NET\Framework\v4.0.30319\ngen.exe install c:\RoslynCompilers\tools\vbc.exe /ExeConfig:c:\RoslynCompilers\tools\vbc.exe | `
    &C:\Windows\Microsoft.NET\Framework\v4.0.30319\ngen.exe install c:\RoslynCompilers\tools\VBCSCompiler.exe  /ExeConfig:c:\RoslynCompilers\tools\VBCSCompiler.exe

ENV ROSLYN_COMPILER_LOCATION c:\RoslynCompilers\tools

# Enabling extra Windows features
RUN Enable-WindowsOptionalFeature -Online -All -FeatureName DSC-Service; `
Enable-WindowsOptionalFeature -Online -All -FeatureName IIS-NetFxExtensibility45; `
Enable-WindowsOptionalFeature -Online -All -FeatureName IIS-WebServerManagementTools; `
Enable-WindowsOptionalFeature -Online -All -FeatureName MSMQ; `
Enable-WindowsOptionalFeature -Online -All -FeatureName MSMQ-Server; `
Enable-WindowsOptionalFeature -Online -All -FeatureName MSMQ-Services; `
Enable-WindowsOptionalFeature -Online -All -FeatureName WAS-ConfigurationAPI; `
Enable-WindowsOptionalFeature -Online -All -FeatureName WAS-ProcessModel; `
Enable-WindowsOptionalFeature -Online -All -FeatureName WAS-WindowsActivationService; `
Enable-WindowsOptionalFeature -Online -All -FeatureName WCF-HTTP-Activation45; `
Enable-WindowsOptionalFeature -Online -All -FeatureName WCF-MSMQ-Activation45; `
Enable-WindowsOptionalFeature -Online -All -FeatureName WCF-Pipe-Activation45; `
Enable-WindowsOptionalFeature -Online -All -FeatureName WCF-TCP-Activation45

# Installing extra .NET Dlls from GAC
COPY "gac" "m4a\gac"
RUN C:\m4a\install_gac.ps1 -GacDir C:\m4a\gac
# Setting up IIS
# Copying IIS files
COPY ["c\\inetpub\\wwwroot", "c:\\inetpub\\wwwroot"]
COPY ["c\\inetpub\\wwwroot\\wcf_ajax", "c:\\inetpub\\wwwroot\\wcf_ajax"]

# Setting up IIS
RUN c:\windows\system32\inetsrv\appcmd.exe set config \"/section:httpLogging\" \"/dontLog:False\"

# Removing default IIS Website
RUN Remove-Website -Name 'Default Web Site'
# Creating IIS AppPools
RUN c:\windows\system32\inetsrv\appcmd.exe set apppool \"DefaultAppPool\" \"/processModel.identityType:ApplicationPoolIdentity\"; `
c:\windows\system32\inetsrv\appcmd.exe set apppool \".NET v4.5 Classic\" \"/processModel.identityType:ApplicationPoolIdentity\"; `
c:\windows\system32\inetsrv\appcmd.exe set apppool \".NET v4.5\" \"/processModel.identityType:ApplicationPoolIdentity\"; `
c:\windows\system32\inetsrv\appcmd.exe set apppool \"Classic .NET AppPool\" \"/managedRuntimeVersion:v2.0\"; `
c:\windows\system32\inetsrv\appcmd.exe set apppool \"Classic .NET AppPool\" \"/processModel.identityType:ApplicationPoolIdentity\"; `
c:\windows\system32\inetsrv\appcmd.exe set apppool \".NET v2.0 Classic\" \"/managedRuntimeVersion:v2.0\"; `
c:\windows\system32\inetsrv\appcmd.exe set apppool \".NET v2.0 Classic\" \"/processModel.identityType:ApplicationPoolIdentity\"; `
c:\windows\system32\inetsrv\appcmd.exe set apppool \".NET v2.0\" \"/managedRuntimeVersion:v2.0\"; `
c:\windows\system32\inetsrv\appcmd.exe set apppool \".NET v2.0\" \"/processModel.identityType:ApplicationPoolIdentity\"; `
New-WebAppPool -Name 'DemoPool' -Force; `
c:\windows\system32\inetsrv\appcmd.exe set apppool \"DemoPool\" \"/managedRuntimeVersion:v2.0\"; `
c:\windows\system32\inetsrv\appcmd.exe set apppool \"DemoPool\" \"/processModel.identityType:ApplicationPoolIdentity\";

# Adding website Default Web Site
RUN New-Website -Name 'Default Web Site' -PhysicalPath 'c:\inetpub\wwwroot' -Port 80 -Force; `
c:\windows\system32\inetsrv\appcmd.exe set site \"Default Web Site\" \"/[path='/'].applicationPool:DefaultAppPool\"; `
New-WebApplication -Name 'WCF' -Site 'Default Web Site' -PhysicalPath 'c:\inetpub\wwwroot\wcf_ajax' -ApplicationPool 'DemoPool';





# Applying ACLs
COPY set_acls.bat C:\set_acls.bat
RUN cmd /c C:\set_acls.bat
# M4A Entrypoint wrapper
WORKDIR  "c:\Windows\Microsoft.NET\Framework\v3.0\Windows Communication Foundation"
RUN .\ServiceModelReg.exe -i
SHELL ["cmd", "/S", "/C" ]
ENTRYPOINT powershell -Command C:\m4a\entrypoint.ps1



