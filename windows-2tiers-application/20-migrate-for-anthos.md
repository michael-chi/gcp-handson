
This document references [Qwiklab](https://www.qwiklabs.com/focuses/15534?catalog_rank=%7B%22rank%22%3A1%2C%22num_filters%22%3A0%2C%22has_search%22%3Atrue%7D&parent=catalog&search_id=11730390)

https://cloud.google.com/iam/docs/creating-managing-service-account-keys#iam-service-account-keys-create-gcloud


## Setup Processing Cluster and Windiws Nodes

```shell
export ZONE=asia-east1-b
export REGION=asia-east1
export SUBNET=default
export PROJECT=kalschi-windows-ad
export GCS=kalschi-windows-env
export GKE_PROCESS=win-migration-processing
export SOURCE_VM_NAME=win-iis-domain-003

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
