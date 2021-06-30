FROM mcr.microsoft.com/dotnet/framework/aspnet:3.5-20210209-windowsservercore-ltsc2019

RUN powershell -NoProfile -Command Remove-Item -Recurse C:\inetpub\wwwroot\*
WORKDIR C:/inetpub/wwwroot/
COPY ./WCF_AJAX .


RUN powershell ./setup.ps1 
