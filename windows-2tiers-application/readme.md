Running Windows worklaods on Kubernetes
---


## The problem
---



Running applications on GKE offers benefits from cost saving to technical efficiency, however some workloads, such as traditional .Net Workloads requires Windows OS to run, are more difficult to migrate from traditional VM mode to GKE mode.

In this lab I'll demonstrate different approach of migrating a ASP.Net 3.5 workload to GKE

## Consideration
---


Traditional ASP.Net workloads are not designed and architected for cloud native environment, below are some (but not all) considerations you should keep in mind before choosing different approach

Note that these considerations are general practices, your application can still requires more changes in order to run properly on GKE.

* Windows Container requirements

    Windows container has its system requirements, details [here](https://docs.microsoft.com/en-US/troubleshoot/windows-server/containers/support-for-windows-containers-docker-on-premises-scenarios). Make sure your applications run on supported OS version, IIS versions...etc

* Logs

    Console outputs from containers running on GKE automatically ingested to Cloud Logging, which provides a central tracing and logging solution. If the target application leverage other traditional technologies, such as writing logs to files, consider change to console outputs.

* Session States and Local files

    ASP.Net stores sessions in-processor out-of-process (such as SQL database), your application should use out-of-process state server in order to be maintain user experience while having auto-scaling/auto-healing.

    Traditional ASP.Net application may store session specific temp files, log files or other session specific assets in local file system, in a container world, container up and down when required, those local files should be stored separately, your codes should also be midified accordingly

* Configuration files

    Configuration settings such as database connection strings are stored in `web.config` defaults to root folder, consider to move it to a separated location and access from there

    Like any other migrations, you may also want to check your configuration settings, such as database connection strings, updated accordingly for new environment.

* 3rd party dependencies

    If your application leverages 3rd party dependencies, make sure they run on a Windows container environment


## How are we solving
---


Considering different approach for migrating Windows workloads to GKE

1. Refactor

    You review and refactor your Windows/ASP.Net workloads and port it to .Net Core/.Net 5 so that it runs on GKE with Linux containers

2. Rehost

    You migrate your Windows workloads to Windows containers on GKE using `Migrate for Anthos`, or writing a Dockerfile which just try to simply setup everything in a container environment as they are running on virtual machines.


I will conver `Rehost` approach in this lab, `Refactor` is out of scope

## Next Step
---

1. Setup a sample in a VM Environemnt


    I leverage a sample [WCF application](https://www.codeproject.com/Articles/29085/ASP-NET-3-5-Sample-Application-of-LINQ-WFC-JSON-an) created by [ToddHileHoffer](https://www.codeproject.com/script/Membership/View.aspx?mid=1744262) on [Code Project](https://www.codeproject.com/) as the ASP.Net workload to migrate.

    To use this sample application, download and store it in working folder.


    Credits to [ToddHileHoffer](https://www.codeproject.com/script/Membership/View.aspx?mid=1744262).


    * [Create a Cloud SQL for SQL Server instance](./1-setup-mssql.md)

    * [Create a simple 2 tiers ASP.Net application on GCE Instances](./0-setup-environemnt.md)



2. Migrate to Windows on GKE

    * [Writting a Dockerfile](./10-migrate-to-GKE-Dockerfile.md)

    * [Using Migrate for Anthos](./20-migrate-for-anthos.md)

3. Bonus

    * [Migrating a Linux Application](./30-migrate-for-anthos-linux.md)