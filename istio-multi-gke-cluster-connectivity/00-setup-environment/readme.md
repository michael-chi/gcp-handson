Setup Dev Machine
=================
```bash
export SRCDIR=$(pwd)
mkdir temp
cd temp
cd $HOME
git clone https://github.com/GoogleCloudPlatform/istio-multicluster-gke.git
cd $HOME/istio-multicluster-gke
WORKDIR=$(pwd)
HELM_VERSION=v2.13.0
HELM_PATH="$WORKDIR"/helm-"$HELM_VERSION"
wget https://storage.googleapis.com/kubernetes-helm/helm-"$HELM_VERSION"-linux-amd64.tar.gz
tar -xvzf helm-"$HELM_VERSION"-linux-amd64.tar.gz
mv linux-amd64 "$HELM_PATH"
rm $WORKDIR/helm-"$HELM_VERSION"-linux-amd64.tar.gz
git clone https://github.com/ahmetb/kubectx $WORKDIR/kubectx
export PATH=$PATH:$WORKDIR/kubectx

cd $SRCDIR


```
