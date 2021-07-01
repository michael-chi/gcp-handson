
## Migrate for Anthos
---

[Migrate for Anthos](https://cloud.google.com/migrate/anthos) is a tool which help you to migrate your local machine to containers easily.

It collects and extracts required configurations and binaries from your machine, generate a Dockerfile for you to build container images.

Note that not every configurations are collected, you may still need to verify before deploying to production, but it gives you an idea and workable path toward migration.

## Setup Processing Cluster and Windiws Nodes and Migrate with Migrate for Anthos
---

```shell
export ZONE=asia-east1-b
export REGION=asia-east1
export SUBNET=default
export PROJECT=kalschi-windows-ad
export GCS=kalschi-windows-env
export GKE_PROCESS=win-migration-processing
export SOURCE_VM_NAME=win-iis-std-001

# Create processing cluster and node pool
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

# Connect to cluster
gcloud container clusters get-credentials $GKE_PROCESS \
 --zone=$ZONE

# Install Anthos
gcloud iam service-accounts create m4a-install \
  --project=$PROJECT

gcloud projects add-iam-policy-binding $PROJECT  \
  --member="serviceAccount:m4a-install@$PROJECT.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud iam service-accounts keys create m4a-install.json \
  --iam-account=m4a-install@$PROJECT.iam.gserviceaccount.com \
  --project=$PROJECT

wget https://anthos-migrate-release.storage.googleapis.com/v1.8.0/linux/amd64/migctl
sudo cp migctl /usr/local/bin/
sudo chmod +x /usr/local/bin/migctl
. <(migctl completion bash)

migctl setup install --json-key=m4a-install.json

# Verify if installation succeed
while true; do
    migctl doctor | grep '[✓]' | grep 'Deployment' &> /dev/null
    if [ $? == 0 ]; then
        echo 'migctl installation completed'
        break
    else
        sleep 10
    fi
done
```

## Migrate
---

```powershell
# Creating a migration source
gcloud services enable cloudresourcemanager.googleapis.com --project=$PROJECT
gcloud iam service-accounts create m4a-ce-src \
  --project=$PROJECT

gcloud projects add-iam-policy-binding $PROJECT  \
  --member="serviceAccount:m4a-ce-src@$PROJECT.iam.gserviceaccount.com" \
  --role="roles/compute.viewer"

gcloud projects add-iam-policy-binding $PROJECT  \
--member="serviceAccount:m4a-ce-src@$PROJECT.iam.gserviceaccount.com" \
  --role="roles/compute.storageAdmin"

gcloud iam service-accounts keys create m4a-ce-src.json \
  --iam-account=m4a-ce-src@$PROJECT.iam.gserviceaccount.com \
  --project=$PROJECT

migctl source create ce my-ce-src --project $PROJECT --json-key=m4a-ce-src.json

while true; do
    migctl source status my-ce-src | grep 'State: READY' &> /dev/null
    if [ $? == 0 ]; then
        echo 'migctl source created successfully'
        break
    else
        sleep 10
    fi
done

# Create Migration
migctl migration create my-migration --source my-ce-src --vm-id $SOURCE_VM_NAME --intent Image --os-type=Windows


while true; do
    migctl migration status my-migration | grep 'Completed' &> /dev/null
    if [ $? == 0 ]; then
        echo 'migration created successfully'
        break
    else   
        echo 'processing...'
        sleep 10
    fi
done

# Generate migration details in a yaml file
migctl migration get my-migration

# Execute the Migration
migctl migration generate-artifacts my-migration

while true; do
    migctl migration status my-migration | grep 'Completed' &> /dev/null
    if [ $? == 0 ]; then
        echo 'migration completed successfully'
        migctl migration status my-migration
        break
    else   
        echo 'processing...'
        sleep 10
    fi
done

# Build a container image and Download the image
#   * output of the command contains gsutil command to download artifact
#   Artifacts are accessible through `gsutil cp gs://{$PATH}/v2k-system-my-migration/7103f348-29ca-4943-a93c-b47bc29c0245/artifacts.zip /home/michi/src/gcp-handson/windows-2tiers-application`

# The donwloaded artifact contains generated Dockerfile and binaries on the source machine that is required for containerize

migctl migration get-artifacts my-migration

# Unzip artifacts and build the docker image on a Windows machine

```
## Build container image
---

Create a Windows Machine as build machine, RDP into it and open powershell


```powershell
$PROJECT="kalschi-windows-ad"

gsutil cp gs://{PATH}/v2k-system-my-migration/7103f348-29ca-4943-a93c-b47bc29c0245/artifacts.zip .

Expand-Archive .\artifacts.zip C:\M4A


```

#### Note

This particular sample application requires WCF to be enabled, we need to manually update generated Dockerfile. The generated Dockerfile is located in the root folder of arttifiacts, in this case we just extraxt it to `C:\M4A`

```Dockerfile
# Applying ACLs
COPY set_acls.bat C:\set_acls.bat
RUN cmd /c C:\set_acls.bat
# M4A Entrypoint wrapper

####### Add below ####### 
WORKDIR  "c:\Windows\Microsoft.NET\Framework\v3.0\Windows Communication Foundation"
RUN .\ServiceModelReg.exe -i
########################


SHELL ["cmd", "/S", "/C" ]
ENTRYPOINT powershell -Command C:\m4a\entrypoint.ps1 

```

```powershell
cd C:\M4A

docker build -t gcr.io/$PROJECT/m4a-win:v1.0.0 .
gcloud auth configure-docker
docker push gcr.io/$PROJECT/m4a-win:v1.0.0

```
## Running locally
---

Once successfully built image, run below commands to test if it works as expected locally. Open a browser and navigate  to http://localhost:8080/wcf for testing.

```powershell
docker run -p 8080:80 -t gcr.io/$PROJECT/m4a-win:v1.0.0
```

## Deploy to GKE
---

Once completted building, create a [deployment.yam](./assets/migrate-for-anthos/deployment.yaml) and expose as a service on GKE cluster.



## Reference
---

* This document references [Qwiklab](https://www.qwiklabs.com/focuses/15534?catalog_rank=%7B%22rank%22%3A1%2C%22num_filters%22%3A0%2C%22has_search%22%3Atrue%7D&parent=catalog&search_id=11730390)

* [Manage and Download Service account key](https://cloud.google.com/iam/docs/creating-managing-service-account-keys#iam-service-account-keys-create-gcloud)