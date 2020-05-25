## Overview

Below I am comparing different options on GCP for multiple GKE clusters to communicate with each others via Internal networks. (i,e. non-public facing traffic)

## Comparision

||Internal Load Balancing + Service Directory|Istio|Traffic Director|
|:--:|:--:|:--:|:--|
|Overview|<li> GCP Internal Load Balancing</li><li>GCP Native + GKE</li>|<li>Istio multi-cluster service mesh</li><li>Use Istio Ingress/Egress Gateway or GCP native iLB</li>|<li>Envoy proxy based traffic control</li><li>Works only in same VPC </li>|
|Multiple GKE clusters|Yes|Yes([*1](https://github.com/GoogleCloudPlatform/istio-samples/blob/master/internal-load-balancer/manifests/install.yaml#L103))|Yes|
|Multiple VPC(via VPC Peering)|Yes([*6])|Yes([*2](https://istio.io/docs/setup/install/multicluster/shared/#prerequisites))|No([*3](https://cloud.google.com/traffic-director/docs/traffic-director-concepts#limitations))|
|Non-GKE resources|Yes|Yes, ExternalName, Endpoints or VirtualService([*4]((https://kubernetes.io/docs/concepts/services-networking/service/#defining-a-service)))|Yes (Install Envoy proxy)([*5]((https://cloud.google.com/traffic-director/docs/set-up-gce-vms))) |
|Service Discovery|With GCP's Service Directory|<li>Istio built-in Service Mesh</li><li>External Names</li>|Traffic Director|
|References||<li>[Istiowith multicluster installation](https://istio.io/docs/setup/install/multicluster/shared/)</li><li>[K8S internal load balacing](https://kubernetes.io/docs/concepts/services-networking/service/#internal-load-balancer)</li>||


[*1](https://github.com/GoogleCloudPlatform/istio-samples/blob/master/internal-load-balancer/manifests/install.yaml#L103) Enable Istio with Internal Load Balancer

[*2](https://istio.io/docs/setup/install/multicluster/shared/#prerequisites) VPN must meet the following requirements
- Individual cluster Pod CIDR ranges and service CIDR ranges must be unique across the network and may not overlap.
- All pod CIDRs in the same network must be routable to each other.

[*3](https://cloud.google.com/traffic-director/docs/traffic-director-concepts#limitations) Traffic Director Limitations

[*4](https://kubernetes.io/docs/concepts/services-networking/service/#defining-a-service) Define a service in K8s without Selector by using Service and Endpoints

[*5](https://cloud.google.com/traffic-director/docs/set-up-gce-vms) Traffic Director uses Envoy proxy to direct traffic, install Envoy on GCE instances to enable GCE VM support.

*6 If your services and clients are located in different GCP regions, you must enable Internal Load Balancer's Global Access so that clients in different regions can access services via the Internal Load Balancer

## [Setup Internal Load Balancing with Service Directory](./iLB.md)