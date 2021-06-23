## Dataflow pipeline for XML processing

#### Overview

This lab demonstrates how to process Xml file via Dataflow pipeline using Python, full source code can be found [here](./xml-demo.py)

* `--runner` specify Dataflow runner, set to `DataflowRunner` to have the pipeline running on GCP Dataflow

* `--requirements_file` specified dependencied which will be installed on remote Dataflow worker

* `--filename` specified Xml source file

* `--save_main_session` This will cause the state of the global namespace to be pickled and loaded on the Dataflow worker. See [here](https://cloud.google.com/dataflow/docs/resources/faq#how_do_i_handle_nameerrors)

```shell
export REGION="asia-east1"
export PROJECT=kalschi-agones
export DATASET=xmltobq
export TABLE=xml_data

python xml-demo.py \
--runner=DataflowRunner \
--project=$PROJECT \
--region "$REGION" \
--output_sink="$PROJECT:$DATASET.$TABLE" \
--filename="gs://cdn-sample/sample-xml-4.xml" \
--requirements_file=./requirements.txt

```
