## Pre-requesists'
- Ensure Both VPC peering enabled and connected

## Steps
```shell
## API Cluster Setup
export API_PROJECT_ID=api-project
gcloud config set project $API_PROJECT_ID


export API_GKE_NAME=us-api-gke
export API_ZONE=us-central1-b
export API_NETWORK=projects/kalschi-td-001/global/networks/vpc-td-us
export API_SUBNET=projects/kalschi-td-001/regions/us-central1/subnetworks/td-us-central

gcloud beta container clusters create $API_GKE_NAME  --zone $API_ZONE --no-enable-basic-auth --cluster-version "1.14.10-gke.36" --machine-type "e2-standard-2" --image-type "COS" --disk-type "pd-standard" --disk-size "100" --scopes "https://www.googleapis.com/auth/cloud-platform" --num-nodes "1" --enable-stackdriver-kubernetes --enable-private-nodes --master-ipv4-cidr "172.16.100.0/28" --enable-master-global-access --enable-ip-alias --network $API_NETWORK --subnetwork $API_SUBNET --no-enable-master-authorized-networks --addons HorizontalPodAutoscaling,HttpLoadBalancing --enable-autoupgrade --enable-autorepair --max-surge-upgrade 1 --max-unavailable-upgrade 0

gcloud compute firewall-rules create allow-ingress-health-check --direction=INGRESS --priority=1000 --network=$API_NETWORK --action=ALLOW --rules=tcp --source-ranges 35.191.0.0/16,130.211.0.0/22



## Client Cluster
export APP_GKE_NAME=tw-app-gke
export APP_ZONE=asia-east1-b
export APP_NETWORK=projects/kalschi-td-002/global/networks/vpc-td-tw
export APP_SUBNET=projects/kalschi-td-002/regions/asia-east1/subnetworks/td-tw


gcloud beta container clusters create $APP_GKE_NAME  --zone $APP_ZONE --no-enable-basic-auth --cluster-version "1.14.10-gke.36" --machine-type "e2-standard-2" --image-type "COS" --disk-type "pd-standard" --disk-size "100" --scopes "https://www.googleapis.com/auth/cloud-platform" --num-nodes "1" --enable-stackdriver-kubernetes --enable-private-nodes --master-ipv4-cidr "172.16.100.0/28" --enable-master-global-access --enable-ip-alias --network $APP_NETWORK --subnetwork $APP_SUBNET --no-enable-master-authorized-networks --addons HorizontalPodAutoscaling,HttpLoadBalancing --enable-autoupgrade --enable-autorepair --max-surge-upgrade 1 --max-unavailable-upgrade 0

gcloud compute firewall-rules create allow-ingress-health-check --direction=INGRESS --priority=1000 --network=$APP_NETWORK --action=ALLOW --rules=tcp --source-ranges 35.191.0.0/16,130.211.0.0/22


```