## Overview

In this lab I am to setup an Elasticsearch node to demonstrate PDF full text search with Elasticsearch

## Create Elasticsearch on GCP

I am to deploy ElasticSearch container instance on GCP instance for simplicity sake. This is simple since we can leverage existing Elasticsearch docker image.

To ingest PDF files to Elasticsearch, I am using `mapper-attachment` plugin to help us ingesting PDF files as well as to index PDF files.

First step is to create a docker file which setup required plugins and Elasticsearch service.

```Dockerfile
FROM docker.elastic.co/elasticsearch/elasticsearch:5.6.5
ADD elasticsearch.yml /usr/share/elasticsearch/config/
# Remove x-pack
RUN bin/elasticsearch-plugin remove x-pack --purge

# Install mapper-attachments for PDF ingestion
RUN bin/elasticsearch-plugin install mapper-attachments

USER root
RUN chown elasticsearch:elasticsearch config/elasticsearch.yml
USER elasticsearch
```

Create [elasticsearch.yaml](./assets/elasticsearch.yaml), basically leave everything defaults

```yaml
network.host: 0.0.0.0
```

Now that we have Dockerfile and elasticsearch.yaml, we can than simply build this image.

```shell
sudo docker build . -t gcr.io/kalschi-project/es:001
sudo docker push gcr.io/kalschi-project/es:001
```

To simplify our setup, I simply create a GCE instance and deploy my image

Below is commands to create VM and deploy my Elasticsearch image.

>Note that I've also added a startup script to setup max mapping count, and mount a volume to the container.

```bash
PROJECT=kalschi-dialogflow-cx
IMAGE=gcr.io/kalschi-dialogflow-cx/es:001
GCE_NAME=elasticsearch
gcloud beta compute --project=$PROJECT instances create-with-container $GCE_NAME --zone=asia-east1-b --machine-type=e2-standard-2 --subnet=default --network-tier=PREMIUM --metadata=startup-script=sudo\ chmod\ 777\ /mnt/stateful_partition/elasticsearch/$'\n'\#\!\ /bin/bash$'\n'sudo\ su\ -$'\n'echo\ 262144\ \>\ /proc/sys/vm/max_map_count --maintenance-policy=MIGRATE --scopes=https://www.googleapis.com/auth/cloud-platform --tags=http-server,https-server --image=cos-stable-81-12871-1160-0 --image-project=cos-cloud --boot-disk-size=10GB --boot-disk-type=pd-standard --boot-disk-device-name=es4-1 --container-image=$IMAGE --container-restart-policy=always --container-mount-host-path=mount-path=/usr/share/elasticsearch/data,host-path=/mnt/stateful_partition/elasticsearch,mode=rw --labels=container-vm=cos-stable-81-12871-1160-0

gcloud compute --project=$PROJECT firewall-rules create default-allow-http --direction=INGRESS --priority=1000 --network=default --action=ALLOW --rules=tcp:80 --source-ranges=0.0.0.0/0 --target-tags=http-server

gcloud compute --project=$PROJECT firewall-rules create default-allow-https --direction=INGRESS --priority=1000 --network=default --action=ALLOW --rules=tcp:443 --source-ranges=0.0.0.0/0 --target-tags=https-server

# reboot so that to ensure `sudo chmod 777 /mnt/stateful_partition/elasticsearch/` ran
gcloud compute instances stop $GCE_NAME --zone=asia-east1-b
gcloud compute instances start $GCE_NAME --zone=asia-east1-b
```

Once running, you can run below command to verify if Elasticsearch is up and running

```bash
curl -XGET http://localhost:9200
```

## Define Index

PDF contents will be indexed as other documents, so we need to first create our index for PDF files first. In this case, I will be creating an Index ccalled `fad`, and my contents will have two properties, `name` for document name, `question` for questions and `answer` for PDF content.

Use below command to create index, where `10.140.0.13` is my Elasticsearch's private IP address

```bash
curl -X PUT "http://localhost:9200/faq" -d '{
  "mappings":{
     "faq":{
        "properties":{
           "answer":{
              "type":"string"
           },
           "question":{
              "type":"string"
           },
           "name":{
              "type":"string"
           }
        }
     }
  }
}'
```
## Ingest PDF file to Elasticsearch

I am using [`mapper-attachment`](https://github.com/elastic/elasticsearch-mapper-attachments) for PDF ingestion.Once ingested

Now, to ingest PDF to Elasticsearch, obviously I need to first convert PDF content to Elasticsearch understandable format. I do this via [node.js script](data_prep/app-faq.js)

Once converted, follow `mapper-attachments` instruction to use below REST call to ingest PDF content.

```bash
export id=1
export json_file=/home/tmp/1.pdf.json
curl -X POST 'http://10.140.0.13:9200/faq/faq/${id}' --header 'Context-Type: application/json' -d @'${json_file}'
```

```
curl -X POST 'http://localhost:8080/upload' --header 'Content-Type: application/json' -d @${json_file}
```

## Query indexted PDF

Create a json file which contains our query
```json
{
  "query": {
    "query_string": {
      "query": "i want to change domain password"
}}}
```

Run below REST call to query indexted PDF content
```bash
curl -X POST 'http://10.140.0.13:9200/faq/faq/_search' \
--header 'Context-Type: application/json' \
-d @'query.json'
```
