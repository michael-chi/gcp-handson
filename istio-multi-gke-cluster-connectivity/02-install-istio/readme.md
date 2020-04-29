安裝並設定Istio
========

接著要安裝Istio在兩個GKE Cluster上. 如果在建立GKE Cluster時已經先Enable了Istio, 則Istio CoreDNS並不會一起安裝, 這個元件在Cross cluster通訊時是必要的, 因為我們需要透過Core DNS解析外部(另一個Cluster)的DNS名稱.
在GKE上, 外部的網址都會是`svc.namespace.global`的格式. 當程式要求這樣的網址時, Core DNS便會解析其名稱已找到正確的遠端Cluster IP位置.

## Download Istio and install Istio

```shell
mkdir temp
cd temp

export ISTIO_VERSION=1.5.2
wget https://github.com/istio/istio/releases/download/${ISTIO_VERSION}/istio-${ISTIO_VERSION}-linux.tar.gz
tar -xzf istio-${ISTIO_VERSION}-linux.tar.gz
rm -r istio-${ISTIO_VERSION}-linux.tar.gz

cd ..
```

## Setup GKE Clsuter for Istio

-   建立`istio-system` namespace

```shell
for cluster in $(kubectx);
do
  kubectx $cluster;
  kubectl create namespace istio-system;
done
```

-   賦予Tiller `cluster-admin`角色, 允許Tiller在兩個Cluster上安裝元件

```shell
for cluster in $(kubectx);
do
  kubectx $cluster;
  kubectl create serviceaccount tiller --namespace kube-system;
  kubectl create clusterrolebinding tiller-admin-binding \
      --clusterrole=cluster-admin --serviceaccount=kube-system:tiller;
done
```

-   安裝Tiller, 並初始化Helm


```shell
for cluster in $(kubectx);
do
  kubectx $cluster;
  ${HELM_PATH}/helm init --service-account=tiller;
  ${HELM_PATH}/helm update;
done
```


## [Configure Certs](https://cloud.google.com/solutions/building-a-multi-cluster-service-mesh-on-gke-using-replicated-control-plane-architecture#configuring_certificates_on_both_clusters)

在Istio中, 服務之間的安全通訊是透過CA加密達成的. [Citadel](https://istio.io/docs/concepts/security/)是Istio中用以Sign以及部署憑證的CA服務.
Istio預設會使用Citadel自建的Self-signed root certificate來簽署workload使用的憑證, 實務上我們也可以使用自己的憑證.
在這裡我會安裝預先建好的[憑證](../assets), 並儲存為Secret.

```shell
for cluster in $(kubectx)
do
  kubectl --context $cluster create secret generic cacerts -n istio-system \
    --from-file=../assets/ca-cert.pem \
    --from-file=../assets/ca-key.pem \
    --from-file=../assets/root-cert.pem \
    --from-file=../assets/cert-chain.pem;
  done
```
## Install Istio CRDs

```shell
for cluster in $(kubectx)
do
  kubectx $cluster;
  ${HELM_PATH}/helm repo update
  ${HELM_PATH}/helm del --purge istio-init
  ${HELM_PATH}/helm install ./temp/istio-${ISTIO_VERSION}/install/kubernetes/helm/istio-init --name istio-init --namespace istio-system;
done
```

## Install Helm Charts in multi-cluster mode

-   安裝multi-cluster模式的Istio Helm chart, 這裡我使用Istio範例中的`values-istio-multicluster-gateways.yaml`, 檔案已經下載在[這裏](...assets/values-istio-multicluster-gateways.yaml)


```shell
for cluster in $(kubectx)
do
  kubectx $cluster;
  ${HELM_PATH}/helm del --purge istio
  ${HELM_PATH}/helm install ./temp/istio-${ISTIO_VERSION}/install/kubernetes/helm/istio --name istio --namespace istio-system \
--values https://raw.githubusercontent.com/GoogleCloudPlatform/istio-multicluster-gke/master/istio-multi-controlplane/istio/values-istio-multicluster-gateways.yaml;
done
```

>Note that I am using yaml file from Google Cloud Platform Github, the file has already been downloaded [here](./values-istio-multicluster-gateways.yaml)
>So instead use below if want to use local version

```shell
for cluster in $(kubectx)
do
  kubectx $cluster;
  ${HELM_PATH}/helm install ./temp/istio-${ISTIO_VERSION}/install/kubernetes/helm/istio --name istio --namespace istio-system \
--values ./assets/values-istio-multicluster-gateways.yaml;
done
```

-   執行以下命令確定是否正確安裝

```shell
kubectl --context app1 get pods -n istio-system
kubectl --context app2 get pods -n istio-system
```

你應該會看到類似以下的輸出
```
NAME                                      READY   STATUS              RESTARTS   AGE
grafana-6fc987bd95-8dmgx                  1/1     Running             0          112s
istio-citadel-54677757b8-6pgsr            1/1     Running             0          111s
istio-egressgateway-c78d849db-xjvs2       0/1     Running             0          112s
istio-galley-664b9468d6-fxhzp             0/1     ContainerCreating   0          112s
istio-ingressgateway-cb48c6ffc-npcbq      0/1     Running             0          112s
istio-init-crd-10-1.3.3-4cvjd             0/1     Completed           0          3m6s
istio-init-crd-11-1.3.3-f6mfb             0/1     Completed           0          3m6s
istio-init-crd-12-1.3.3-8n4n2             0/1     Completed           0          3m6s
istio-pilot-6fbc48bcfb-bgtw9              1/2     Running             0          111s
istio-policy-85469bdfbb-czcrr             2/2     Running             3          112s
istio-sidecar-injector-7c5d49854d-cqrvw   1/1     Running             0          111s
istio-telemetry-9fddf6d99-5ktc9           2/2     Running             4          112s
istio-tracing-669fd4b9f8-rdlpd            1/1     Running             0          111s
istiocoredns-f5cfd8c74-xx86n              2/2     Running             0          112s
kiali-94f8cbd99-475m2                     1/1     Running             0          112s
prometheus-776fdf7479-qwmnq               0/1     ContainerCreating   0          111s
```

設定DNS
======

Istio使用預設的registry解析所有運行在本地Cluster的微服務, 我們可以透過為外部服務定義[ServiceEntry](https://istio.io/docs/reference/config/networking/service-entry/)來解析運行在遠端Cluster的微服務.
運行於本地端Cluster的服務其名稱會以`some_great_service.namespace.svc.cluster.local`存在, 運行在遠端的服務名稱則會是`svc.namespace.global`的形式, 遠端服務可以是另一個GKE Cluster上的服務, 也可以是運行在虛擬主機上的REST API等等.


```mermaid
graph TD
    ServiceA-->ServiceB

    subgraph APP2 Cluster
    subgraph kube-dns
    ServieA=serviceA.namespace.svc.cluster.local
    end
    subgraph core-dns
    ServieB=serviceB.namespace.global
    end
    ServiceA
    end

    subgraph External Services
    ServiceB
    end
```

- 建立一個[ConfigMap](../assets/stub-domain-ConfigMap.yaml), 在這個ConfigMap裡面, 會透過`stubDomains`設定, 將`.global`指定為Stub domain

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: kube-dns
  namespace: kube-system
data:
  stubDomains: |
    {"global": ["$(kubectl get svc -n istio-system istiocoredns -o jsonpath={.spec.clusterIP})"]}
```

- 執行以下指令
```shell
for cluster in $(kubectx)
do
  kubectx $cluster;
  kubectl apply -f ./assets/stub-domain-ConfigMap.yaml
done
```
- 現在我們已經完成了所有準備了, 接著, 我們要在APP2 Cluster上建立一個ServiceEntry, [指定App1的位置]

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: ServiceEntry
metadata:
  name: external-svc-http
spec:
  hosts:
  - app1.default.global
  location: MESH_EXTERNAL
  ports:
#   - number: 443
#     name: https
#     protocol: TLS
  - number: 80
    name: http
    protocol: HTTP
  resolution: DNS
```

- 執行以下指令

```shell
kubectx app2
kubectl apply -f ./assets/app1-serviceEntry.yaml
```