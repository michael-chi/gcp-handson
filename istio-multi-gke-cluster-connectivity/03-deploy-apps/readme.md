部署應用程式
==========
-   建立ConfigMap, 指定App1的位置. 注意其中`remote`這個變數的值設定為`http://app1.default.global/app1`, 其FQDN是以`.global`結尾, 當程式試著與這個位置通訊息, Istio CoreDNS會負責解析

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app2-config
  namespace: default
data:
  remote: http://app1.default.global/app1
```

-   建置Docker imagea並部署應用程式

```shell
cd src/app1
sudo docker build . -t gcr.io/kalschi-istio/demo-app1:istio-v1
sudo docker push gcr.io/kalschi-istio/demo-app1:istio-v1

cd ../app2
sudo docker build . -t gcr.io/kalschi-istio/demo-app2:istio-v1
sudo docker push gcr.io/kalschi-istio/demo-app2:istio-v1

cd ../..
kubectx app1
kubectl apply -f ./src/app1/deployment.yaml 
kubectl apply -f ./src/app1/service.yaml 

kubectx app2
kubectl apply -f ./assets/app2-configMap.yaml 
kubectl apply -f ./src/app2/deployment.yaml 
kubectl apply -f ./src/app2/service.yaml 
```

-   設定Istio, [開放App2給Internet使用者](../assets/istio-gw-vs.yaml)

>Istio中, 每一個要開放的微服務都是一個VirtualService, 其`host`指向服務Server定義的名稱. 以我的例子來說, 就是[App2 Service.yaml](../src/app2/service.yaml)的`name`
>另外, VirtualService的`uri`設定也應該與程式中所指定的`path`一致, 在我的範例中, App2會回應`/app2`的要求
```yaml
    - uri:
        exact: /app2
```

完整的Yaml如下

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: Gateway
metadata:
  name: istio-app2-mc-gateway
spec:
  selector:
    istio: ingressgateway # use istio default controller
  servers:
  - port:
      number: 80    # internet facing port
      name: http
      protocol: HTTP
    hosts:
    - "*"
---
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: istio-app2-istio-vs
spec:
  hosts:
  - "*"
  gateways:
  - istio-app2-mc-gateway
  http:
  - match:
    - uri:
        exact: /app2
    route:
    - destination:
        host: app2  # Match to App2's service.yaml
        port:
          number: 9999

```

-   執行以下指令

```shell
kubectl apply -f ./assets/istio-gw-vs.yaml 
```

-   取得External Load Balancer的IP位址

```shell
 kubectl get svc istio-ingressgateway -n istio-system
 ```
 你應該可以看到如下的結果
 ```
 NAME                   TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)                                                                                                                                      AGE
istio-ingressgateway   LoadBalancer   10.79.11.194   <IP>   15020:30451/TCP,80:31380/TCP,443:31390/TCP,31400:31400/TCP,15029:30711/TCP,15030:30444/TCP,15031:30461/TCP,15032:32088/TCP,15443:32282/TCP   112m
```

-   透過這個網址驗證應該要可以看到App2回應的內容    
>http://\<IP\>/app2