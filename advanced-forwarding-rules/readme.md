## Overview

GCP HTTP/S Load Balancing recently introcuded a new feature: HTTP Header Based routing. With this feature, customers can easily route traffic to different backends by request HTTP headers.

For example, a QA team may access to QA backend with a custom HTTP header that spcecific set to them, while RD team can access to backend specific for RD teams if incoming request has particualr HTTP header set.

## Component Table

Here I have a Global HTTP/S Load Balacing setup with two backends created. 

|Component|RD|QA|Comment|
|:--:|:--:|:--:|:--:|
|Backend Service|apache-2|nginx-1||
|HTTP Header Name|Custom-Team|Custom-Team||
|HTTP Header Value|RD|QA||


## Steps

- First create a HTTP/S load balancer as usual and configure a single backend

- Update the [yaml file](./rule.yaml) to reflect your routeing rules

```yaml
name: [YOUR LOAD BALANCER NAME]
## Omitted
- defaultService: https://www.googleapis.com/compute/v1/projects/kalschi-istio/global/backendServices/nginx-1
  name: matcher1
  routeRules:
    - matchRules:
        - headerMatches:
            - headerName: Custom-Team
              exactMatch: QA
      priority: 2
      service: https://www.googleapis.com/compute/v1/projects/kalschi-istio/global/backendServices/apache-2
```

- Run below command to update the newly created Load Balancer and wait for a while until update completely

```bash
gcloud compute url-maps import test-lb-forwarding-rule-20200526 --source ./rule.yaml --global
```