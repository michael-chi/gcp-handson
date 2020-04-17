Overview
========

## Prerequisites

This step requires App1 and App2 deployed to different GKE clusters

## References

[Istio Get Started](https://istio.io/docs/setup/getting-started/#bookinfo)

[Istio Multi-Cluster deployment model](https://istio.io/docs/ops/deployment/deployment-models/#multiple-clusters)

[Build Multi-Cluster Service Mesh across GKE clusters using Istio Single Control Panel](https://cloud.google.com/solutions/building-multi-cluster-service-mesh-across-gke-clusters-using-istio-single-control-plane-architecture-single-vpc#whats-next)

[Building a multi-cluster service mesh on GKE using replicated control-plane architecture](https://cloud.google.com/solutions/building-a-multi-cluster-service-mesh-on-gke-using-replicated-control-plane-architecture)

## Prepare your GKE cluster

[Enable Istio (BETA) if not already on your GKE cluster](https://cloud.google.com/solutions/building-a-multi-cluster-service-mesh-on-gke-using-replicated-control-plane-architecture#before-you-begin)

Setup App1 and App2 with Istio
==============================

To leverage Istio, we need to make some changes to our [app2 service yaml](./app2/service.yaml)
```yaml
kind: Service
apiVersion: v1
metadata:
  labels:
    app: istio-app2
    service: istio-app2
  name: istio-app2
  annotations:
    # We don't need below annotations now since Istio take care for us
    # cloud.google.com/neg: '{"ingress": true}'
spec:
  selector:
    app: istio-app2
  ports:
  - protocol: TCP
    port: 9999
    name: istio-app2-port
    targetPort: 9999
  # type: NodePort  # We don't need this now since we will use Istio gateway to expose our service to internet
```

Now we can redploy my App2

```bash
kubectl apply -f ./deployment.yaml
kubectl apply -f ./service.yaml
```

Next, we need to create a [Istio gateway and a virtual service](./app2/istio-gw-vs.yaml) to expose our App2 to internet

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: Gateway
metadata:
  name: istio-app2-gateway
spec:
  selector:
    istio: ingressgateway   # use istio default controller
  servers:
  - port:
      number: 80            # internet facing port
      name: http
      protocol: HTTP
    hosts:
    - "*"
---
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: istio-app2-vs
spec:
  hosts:
  - "*"
  gateways:
  - istio-app2-gateway
  http:
  - match:
    - uri:
        exact: /app2
    route:
    - destination:
        host: istio-app2
        port:
          number: 9999
```

Deploy gateway and virtual service

```bash
kubectl apply -f ./istio-gw-vs.yaml
```

Wait for a few minutes until them become ready, if we go back to GCP console, we should see a new TCP Load balancer been created. Navigate to http://<LB IP>/app2 to verify app2 does gets exposed