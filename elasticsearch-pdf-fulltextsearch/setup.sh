PROJECT=kalschi-dialogflow-cx
IMAGE=gcr.io/kalschi-dialogflow-cx/es:001
GCE_NAME=elasticsearch

# Create Firewall
gcloud compute --project=$PROJECT firewall-rules create default-allow-http --direction=INGRESS --priority=1000 --network=default --action=ALLOW --rules=tcp:80 --source-ranges=0.0.0.0/0 --target-tags=http-server
gcloud compute --project=$PROJECT firewall-rules create default-allow-https --direction=INGRESS --priority=1000 --network=default --action=ALLOW --rules=tcp:443 --source-ranges=0.0.0.0/0 --target-tags=https-server

# Create Elasticsearch
gcloud beta compute --project=$PROJECT instances create-with-container $GCE_NAME --zone=asia-east1-b --machine-type=e2-standard-2 --subnet=default --network-tier=PREMIUM --metadata=startup-script=sudo\ chmod\ 777\ /mnt/stateful_partition/elasticsearch/$'\n'\#\!\ /bin/bash$'\n'sudo\ su\ -$'\n'echo\ 262144\ \>\ /proc/sys/vm/max_map_count --maintenance-policy=MIGRATE --scopes=https://www.googleapis.com/auth/cloud-platform --tags=http-server,https-server --image=cos-stable-81-12871-1160-0 --image-project=cos-cloud --boot-disk-size=10GB --boot-disk-type=pd-standard --boot-disk-device-name=es4-1 --container-image=$IMAGE --container-restart-policy=always --container-mount-host-path=mount-path=/usr/share/elasticsearch/data,host-path=/mnt/stateful_partition/elasticsearch,mode=rw --labels=container-vm=cos-stable-81-12871-1160-0

# reboot so that to ensure `sudo chmod 777 /mnt/stateful_partition/elasticsearch/` ran
gcloud compute instances stop $GCE_NAME --zone=asia-east1-b
gcloud compute instances start $GCE_NAME --zone=asia-east1-b


# Create API Host
