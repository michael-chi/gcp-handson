### Migrate to GKE

In this lab we'll containerize ASP.Net application with different approaches:

1. Dockerfile

2. Migrate for Anthos

    -   This document references [Qwiklab](https://www.qwiklabs.com/focuses/15534?catalog_rank=%7B%22rank%22%3A1%2C%22num_filters%22%3A0%2C%22has_search%22%3Atrue%7D&parent=catalog&search_id=11730390)

#### Setup Processing Cluster and Windiws Nodes

```shell
export ZONE=asia-east1-b
export REGION=asia-east1
export SUBNET=default
export PROJECT=kalschi-windows-ad
export GCS=kalschi-windows-env
export GKE_PROCESS=win-migration-processing

gcloud config set project $PROJECT
gcloud services enable container.googleapis.com

gcloud container clusters create $GKE_PROCESS --zone=$ZONE --enable-ip-alias --num-nodes 1 --machine-type n1-standard-4 --enable-stackdriver-kubernetes

gcloud container node-pools create node-pool-processing \
 --cluster=$GKE_PROCESS \
 --zone=$ZONE \
 --image-type=WINDOWS_LTSC \
 --num-nodes=1 \
 --scopes "cloud-platform" \
 --machine-type=n1-standard-4
```


### Docker file

1. Connect to A Windows Server 2019 Machine to prepare Dockerfile.

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
 docker build . -t gcr.io/kalschi-windows-ad/win-iis:0015 -f .\Dockerfile
```