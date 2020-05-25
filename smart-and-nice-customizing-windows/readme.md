## Overview

Sometimes we just need to customize our Windows Guest Environment on GCP when I need to deploy large amount of machines, for example, I may need my Windows uses Chinese Traditional as display language, or I need to configure my time-zone to be Taipei time. We leverage unattended.xml to archive this.


## Steps

Overall speaking, we need to 

1. Create a Windows VM from GCP's platform image

2. Create an unattended.xml with desired configuration settings

3. Run `GCESysprep \<Path to unattended.xmk\>`

4. Shutdown Machine, keep disk and optionally delete VM

5. Create an Image from VM Disk

6. Create VM from Image created in Step 5

A sample unattedned.xml set UI language, Input local, User Local and System local to Taiwan (`zh-TW`)

```xml
<?xml version="1.0" encoding="utf-8"?>
<unattend xmlns="urn:schemas-microsoft-com:unattend">
    <!--
    For more information about unattended.xml please refer too
    http://technet.microsoft.com/en-us/library/cc722132(v=ws.10).aspx
    -->
    <!-- Skip... -->
    <settings pass="oobeSystem">
        <!-- Setting Location Information -->
        <component name="Microsoft-Windows-International-Core" processorArchitecture="amd64" publicKeyToken="xxxxxxx" language="neutral" versionScope="nonSxS" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
            <InputLocale>zh-TW</InputLocale>
            <SystemLocale>zh-TW</SystemLocale>
            <UILanguage>zh-TW</UILanguage>
            <UserLocale>zh-TW</UserLocale>
        </component>
        <component name="Microsoft-Windows-Shell-Setup" processorArchitecture="amd64" publicKeyToken="xxxxxxx" language="neutral" versionScope="nonSxS" xmlns:wcm="http://schemas.microsoft.com/WMIConfig/2002/State" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
           <!-- Skip... -->
            <!-- Setting timezone to GMT -->
            <ShowWindowsLive>false</ShowWindowsLive>
            <TimeZone>Greenwich Standard Time</TimeZone>
            <!-- Skip... -->
        </component>
    </settings>
</unattend>
```