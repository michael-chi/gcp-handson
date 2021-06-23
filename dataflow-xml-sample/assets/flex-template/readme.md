## Dataflow pipeline for XML processing

#### Overview

This lab demonstrates how to process Xml file via Dataflow pipeline using Python, full source code can be found [here](./xml-demo.py)

```shell
export REGION="asia-east1"
export PROJECT=kalschi-agones
export DATASET=xmltobq
export TABLE=xml_data

# export TEMPLATE_PATH=gs://some-bucket/template-batch.json
# export TEMPLATE_IMAGE=gcr.io/kalschi-agones/dataflow/xml-batch-demo:008


# gcloud builds submit --tag $TEMPLATE_IMAGE .

# gcloud dataflow flex-template build $TEMPLATE_PATH \
#     --image "$TEMPLATE_IMAGE" \
#     --sdk-language "PYTHON" 
#     # --metadata-file "metadata.json"


# gcloud dataflow flex-template run "test-df-`date +%Y%m%d-%H%M%S`" \
# --template-file-gcs-location "$TEMPLATE_PATH" \
# --project=$PROJECT \
# --region "$REGION" \
# --parameters output="$PROJECT:$DATASET.$TABLE" \
# --parameters filename="gs://cdn-sample/sample-xml-4.xml" 
```

```shell
python xml-demo.py \
--runner=DataflowRunner \
--project=$PROJECT \
--region "$REGION" \
--output_sink="$PROJECT:$DATASET.$TABLE" \
--filename="gs://cdn-sample/sample-xml-4.xml" \
--save_main_session=True \
--requirements_file=./requirements.txt \
--output "$PROJECT:$DATASET.log_$TABLE" \
--temp_location=gs://cdn-sample/xml-temp \
--staging_location=gs://cdn-sample/xml-staging


gcloud dataflow flex-template run "test-`date +%Y%m%d-%H%M%S`" \
--template-file-gcs-location "$TEMPLATE_PATH" \
--project=$PROJECT \
--region "$REGION" \
--parameters output="$PROJECT:$DATASET.$TABLE" \
--parameters filename="gs://cdn-sample/sample_xml.xml" \
--staging-location=gs://cdn-sample/xml-staging

# https://beam.apache.org/documentation/sdks/python-pipeline-dependencies/
# Local
python xml-demo.py \
--runner=DataflowRunner \
--project=$PROJECT \
--region "$REGION" \
--region=asia-east1 \
--temp_location=gs://cdn-sample/temp \
--staging_location=gs://cdn-sample/staging \
--output="$PROJECT:$DATASET.$TABLE" \
--filename="gs://cdn-sample/sample_xml.xml" \
--save_main_session=True
```