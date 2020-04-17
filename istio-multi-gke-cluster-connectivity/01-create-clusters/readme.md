建立Private GKE Cluster
============

## Setup enviornment variables

```bash
export APP1_CLUSTER=gke1
export APP2_CLUSTER=gke2
export APP1_REGION=asia-east1
export APP2_REGION=asia-northeast1
```

## Setup VPCs for App1 and App2 clsuters

-   首先建立兩組Private GKE Cluster

```bash
#   Create VPC Networks
gcloud compute networks create app1
gcloud compute networks create app2

export KUBECONFIG=istio-kubeconfig

#   Create GKE Clusters
gcloud container clusters create $APP1_CLUSTER --region asia-east1 --username "admin" \
    --machine-type "n1-standard-2" --image-type "COS" \
    --disk-size "100" --cluster-version=1.14 \
    --scopes "https://www.googleapis.com/auth/compute",\
"https://www.googleapis.com/auth/devstorage.read_only",\
"https://www.googleapis.com/auth/logging.write",\
"https://www.googleapis.com/auth/monitoring",\
"https://www.googleapis.com/auth/servicecontrol",\
"https://www.googleapis.com/auth/service.management.readonly",\
"https://www.googleapis.com/auth/trace.append" \
    --num-nodes "1" --network "app1" --enable-cloud-logging --enable-cloud-monitoring --async \
    --enable-ip-alias --enable-master-authorized-networks --enable-private-nodes --master-ipv4-cidr "172.16.0.32/28"  --enable-stackdriver-kubernetes 

gcloud container clusters create $APP2_CLUSTER --region asia-northeast1 --username "admin" \
    --machine-type "n1-standard-2" --image-type "COS" \
    --disk-size "100" --cluster-version=1.14 \
    --scopes "https://www.googleapis.com/auth/compute",\
"https://www.googleapis.com/auth/devstorage.read_only",\
"https://www.googleapis.com/auth/logging.write",\
"https://www.googleapis.com/auth/monitoring",\
"https://www.googleapis.com/auth/servicecontrol",\
"https://www.googleapis.com/auth/service.management.readonly",\
"https://www.googleapis.com/auth/trace.append" \
    --num-nodes "1" --network "app2" --enable-cloud-logging --enable-cloud-monitoring --async --enable-ip-alias \
    --enable-ip-alias --enable-master-authorized-networks --enable-private-nodes --master-ipv4-cidr "172.16.0.32/28"  --enable-stackdriver-kubernetes  
```

-   [建立Firewall Rules, 允許TCP:9443](https://cloud.google.com/kubernetes-engine/docs/how-to/private-clusters#add_firewall_rules)

```shell
export MASTER_CIDR=172.16.0.32/28

gcloud compute --project=kalschi-istio firewall-rules create allow-ingress-app1-tcp-9443 --direction=INGRESS --priority=1000 --network=app1 --action=ALLOW --rules=tcp:9443 --source-ranges=$MASTER_CIDR


gcloud compute --project=kalschi-istio firewall-rules create allow-ingress-app2-tcp-9443 --direction=INGRESS --priority=1000 --network=app2 --action=ALLOW --rules=tcp:9443 --source-ranges=$MASTER_CIDR
```
-   設定Authorized Network允許指定IP範圍存取Master Nodes

```shell
export DEVMACHINE=10.128.0.3/32 # change to your environment
gcloud container clusters update $APP1_CLUSTER \
    --enable-master-authorized-networks \
    --master-authorized-networks $DEVMACHINE --region $APP1_REGION

gcloud container clusters update $APP2_CLUSTER \
    --enable-master-authorized-networks \
    --master-authorized-networks $DEVMACHINE --region $APP2_REGION
```

## Update credentials for each clusters

```bash
# Get credentials for each clusters
export PROJECT_ID=$(gcloud info --format='value(config.project)')
gcloud container clusters get-credentials $APP1_CLUSTER --region $APP1_REGION --project ${PROJECT_ID}
gcloud container clusters get-credentials $APP2_CLUSTER --region $APP2_REGION --project ${PROJECT_ID}

kubectx app1=gke_${PROJECT_ID}_${APP1_REGION}_${APP1_CLUSTER}
kubectx app2=gke_${PROJECT_ID}_${APP2_REGION}_${APP2_CLUSTER}
```

## Create role binding

-   將自己的Google Account賦予Cluster admin角色權限

```shell
kubectl create clusterrolebinding user-admin-binding \
    --clusterrole=cluster-admin --user=$(gcloud config get-value account) \
    --context app1
kubectl create clusterrolebinding user-admin-binding \
    --clusterrole=cluster-admin --user=$(gcloud config get-value account) \
    --context app2
```

## Create Cloud NAT

-   Private Cluster需要與外界溝通時, 需要透過Cloud NAT. 這個步驟在Private Cluster是必要的, 否則Pull image也會失敗

```shell
# create cloud router
gcloud compute routers create ${APP1_CLUSTER}-router --project=$PROJECT_ID --region=$APP1_REGION --network=app1
gcloud compute routers create ${APP2_CLUSTER}-router --project=$PROJECT_ID --region=$APP2_REGION --network=app2

gcloud compute routers nats create ${APP1_CLUSTER}-nat \
    --router=${APP1_CLUSTER}-router \
    --auto-allocate-nat-external-ips \
    --nat-all-subnet-ip-ranges \
    --enable-logging --region $APP1_REGION

gcloud compute routers nats create ${APP2_CLUSTER}-nat \
    --router=${APP2_CLUSTER}-router \
    --auto-allocate-nat-external-ips \
    --nat-all-subnet-ip-ranges \
    --enable-logging --region $APP2_REGION
```

