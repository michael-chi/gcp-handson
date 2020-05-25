## Prerequisites

- Ensure Both VPCs in different regions and projects are peered via VPC Peering and routable

- Two GKE clusters in different VPCs and projects

## Architect


## Component table

#### GKE Component Table
|Components|Service|Client|
|:---:|:---:|:---:|
|Project|kalschi-td-001|kalschi-td-001|
|GKE Cluster|gke-api-istio-us|gke-app-istio-tw|
|VPC Network|vpc-istio-us-central|vpc-istio-tw|
|Subnet|us-central1|asia-east1|
|Subnet IP Range|10.100.0.0/16|172.16.0.0/16|
|Dynamic routing mode|Global|Global|
|GKE ZONE|us-central1-b|asia-east1-b|

## Steps

Create Two GKE Clusters

```bash
## US/API Cluster
export API_PROJECT_ID=kalschi-td-001
gcloud config set project $API_PROJECT_ID

export API_GKE_NAME=gke-api-istio-us
export API_ZONE=us-central1-b
export API_VPC_NAME=vpc-istio-us-central
export API_NETWORK=projects/$API_PROJECT_ID/global/networks/$API_VPC_NAME
export API_SUBNET=projects/$API_PROJECT_ID/regions/us-central1/subnetworks/us-central1

gcloud beta container clusters create $API_GKE_NAME --zone $API_ZONE --no-enable-basic-auth --cluster-version "1.14.10-gke.36" --machine-type "e2-standard-2" --image-type "COS" --disk-type "pd-standard" --disk-size "100" --scopes "https://www.googleapis.com/auth/cloud-platform" --num-nodes "1" --enable-stackdriver-kubernetes --enable-private-nodes --master-ipv4-cidr "192.168.100.0/28" --enable-master-global-access --enable-ip-alias --network $API_NETWORK --subnetwork $API_SUBNET --no-enable-master-authorized-networks --addons HorizontalPodAutoscaling,HttpLoadBalancing --enable-autoupgrade --enable-autorepair --max-surge-upgrade 1 --max-unavailable-upgrade 0

gcloud compute firewall-rules create allow-ingress-health-check --direction=INGRESS --priority=1000 --network=$API_NETWORK --action=ALLOW --rules=tcp --source-ranges 35.191.0.0/16,130.211.0.0/22


## APP/TW Cluster
export APP_PROJECT_ID=kalschi-td-002
gcloud config set project $APP_PROJECT_ID

export APP_GKE_NAME=gke-api-istio-tw
export APP_ZONE=asia-east1-b
export APP_VPC_NAME=vpc-istio-tw
export APP_NETWORK=projects/$APP_PROJECT_ID/global/networks/$APP_VPC_NAME
export APP_SUBNET=projects/$APP_PROJECT_ID/regions/asia-east1/subnetworks/asia-east1

gcloud beta container clusters create $APP_GKE_NAME --zone $APP_ZONE --no-enable-basic-auth --cluster-version "1.14.10-gke.36" --machine-type "e2-standard-2" --image-type "COS" --disk-type "pd-standard" --disk-size "100" --scopes "https://www.googleapis.com/auth/cloud-platform" --num-nodes "1" --enable-stackdriver-kubernetes --enable-private-nodes --master-ipv4-cidr "192.168.100.0/28" --enable-master-global-access --enable-ip-alias --network $APP_NETWORK --subnetwork $APP_SUBNET --no-enable-master-authorized-networks --addons HorizontalPodAutoscaling,HttpLoadBalancing --enable-autoupgrade --enable-autorepair --max-surge-upgrade 1 --max-unavailable-upgrade 0

gcloud compute firewall-rules create allow-ingress-health-check --direction=INGRESS --priority=1000 --network=$APP_NETWORK --action=ALLOW --rules=tcp --source-ranges 35.191.0.0/16,130.211.0.0/22
```

Create VPC Peering
```bash
## US Cluster
gcloud config set project $API_PROJECT_ID
export US_PEERING_NAME=istio-us-to-tw-peering
gcloud compute networks peerings create $US_PEERING_NAME \
    --network=$API_VPC_NAME \
    --peer-project $APP_PROJECT_ID \
    --peer-network $APP_VPC_NAME \
    --async --auto-create-routes 

## TW Clustergcloud config set project $API_PROJECT_ID
export TW_PEERING_NAME=istio-tw-to-us-peering
gcloud config set project $APP_PROJECT_ID
gcloud compute networks peerings create $TW_PEERING_NAME \
    --network=$APP_VPC_NAME \
    --peer-project $API_PROJECT_ID \
    --peer-network $API_VPC_NAME \
    --async --auto-create-routes 
```