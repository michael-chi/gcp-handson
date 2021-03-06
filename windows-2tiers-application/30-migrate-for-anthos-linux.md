
## Migrate for Anthos - Linux
---

Migrating a Linux box is similar to migrating a Windows box, difference is that in a Linux scenario container images are generated by `Migrate for Anthos` during migration, we don't have to manually create one by running `docker build`

The migration process takes longer time than migrating a Windows box, using a [sample book store web application](https://github.com/shashirajraja/onlinebookstore) took around 10 minutes to extract images.

This lab assume that Migrate for Anthos has already been installed and configured

## Migrate
---

```powershell
migctl source create ce my-ce-src --project $PROJECT --json-key=m4a-ce-src.json

while true; do
    migctl source status my-ce-src | grep 'State: READY' &> /dev/null
    if [ $? == 0 ]; then
        echo 'migctl source created successfully'
        break
    else
        sleep 10
    fi
done

# Create Migration

export MIGRATION=my-migration

migctl migration create $MIGRATION --source my-ce-src --vm-id $SOURCE_VM_NAME --intent Image --os-type=Linux


while true; do
    migctl migration status $MIGRATION | grep 'Completed' &> /dev/null
    if [ $? == 0 ]; then
        echo 'migration created successfully'
        break
    else   
        echo 'processing...'
        migctl migration status -v $MIGRATION 
        sleep 10
    fi
done

# Generate migration details in a yaml file
migctl migration get $MIGRATION

# Execute the Migration
migctl migration generate-artifacts $MIGRATION

while true; do
    migctl migration status $MIGRATION | grep 'Completed' &> /dev/null
    if [ $? == 0 ]; then
        echo 'migration completed successfully'
        migctl migration status $MIGRATION
        break
    else   
        echo 'processing...'
        sleep 10
    fi
done

# Build a container image and Download the image
#   * output of the command contains gsutil command to download artifact
#   Artifacts are accessible through `gsutil cp gs://{$PATH}/v2k-system-my-migration/7103f348-29ca-4943-a93c-b47bc29c0245/artifacts.zip /home/michi/src/gcp-handson/windows-2tiers-application`

# The donwloaded artifact contains generated Dockerfile and binaries on the source machine that is required for containerize

migctl migration get-artifacts $MIGRATION

# Unzip artifacts and build the docker image on a Windows machine

```

## Deploy to GKE cluster
---

The artifact we downloaded includes a `deployment_spec.yaml`, we simply need to [modify container ports](./assets/containerize-linux/deployment_spec.yaml) in the yaml file.


```powershell
kubectl apply -f deployment_spec.yaml
kubectl expose deploy $DEPLOYMENT_NAME --type=LoadBalancer --name=linux-service
```
