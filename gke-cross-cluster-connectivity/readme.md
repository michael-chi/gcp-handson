Overview
========

We will be deploying two services: app1 and app2, both services exposed to the internet via Ingress, which in turns, a Global HTTP Load Balancer on GCP.

With this setup, app2 can talek to app2 via GKE network.

Then, we will have two GKE clusters created, and deploy app1 and app2 to different clsuters, then we will create an internal load balancer for app1 and the other internal load balancer for app2 so that they can communicate with each other via interal load balancer when required.

With this setup, app2 should be able to talk to app1 via internal load balancer

## Single Cluster

To deploy both applications to same cluster, create a GKE clsuter first then execute below commands

```bash
kubectl apply -f ./app1/deployment.yaml
kubectl apply -f ./app2/deployment.yaml
kubectl apply -f ./app2/configMap.yaml
kubectl apply -f ./app1/service.yaml
kubectl apply -f ./app2/service.yaml
kubectl apply -f ./ingress.yaml
```

## Multiple Cluster

Now deploy app1 and app2 to different clusters, in this case, I am deploying app2 to another clsuter and create an internal load balancer for app2 to invoke.

There're two ways to do internal load balancer

### Service Type: Load Balancer

Create two GKE clusters, one for app1, the other for app2. Both cluster must be connected via VPC or in same VPC to ensuer internal connectivity.

#### App1 Cluster

Now switch to app1 cluster

```shell
gcloud container clusters get-credentials app1-cluster --zone asia-east1-b --project my-project
```

I created another service to represent internal app1 interface

```yaml
kind: Service
apiVersion: v1
metadata:
  name: app1-internal
  annotations:
    # this annotations tells GCP this is an internal load balancer
    cloud.google.com/load-balancer-type: "Internal"
spec:
  selector:
    app: app1
  ports:
  - protocol: TCP
    port: 8888
    targetPort: 8888
  type: LoadBalancer
```

Apply this configuration to create a seperated service for app1

```bash
kubectl apply -f ./multiple-cluster/internal-loadbalancer-no-ingress.app1/app1-internal-service.yaml
```

Use below commnad to get inernal load balancer IP address

```shell
kubectl get svc
```

#### App2 Cluster

Now we need to update our app2's configMap, first switch to GKE cluster for app2

```shell
gcloud container clusters get-credentials app2-cluster --zone asia-east1-b --project my-project
```


Update our [configmap](./app2/configMap.yaml)

```yaml
data:
  remote: <INTERNAL LOAD BALANCER IP>
```

Deploy all services in app2 cluster
```shell
kubectl apply -f ./app2/deployment.yaml
kubectl apply -f ./app2/configMap.yaml
kubectl apply -f ./app2/service.yaml
```


#### Ingress for Internal HTTPS Load Balancer

This is still in BETA, reference to below document for details, we do not encourage to use BETA features on your production environment
-   https://cloud.google.com/kubernetes-engine/docs/how-to/internal-load-balance-ingress#deploying_ingress_for