  FROM gcr.io/dataflow-templates-base/python3-template-launcher-base

  ARG WORKDIR=/dataflow/template
  RUN mkdir -p ${WORKDIR}
  WORKDIR ${WORKDIR}
  
  # Due to a change in the Apache Beam base image in version 2.24, you must to install
  # libffi-dev manually as a dependency. For more information:
  #   https://github.com/GoogleCloudPlatform/python-docs-samples/issues/4891

  # https://cloud.google.com/dataflow/docs/guides/templates/using-flex-templates

  RUN apt-get update && apt-get install -y libffi-dev && rm -rf /var/lib/apt/lists/*

  COPY . .

  ENV FLEX_TEMPLATE_PYTHON_REQUIREMENTS_FILE="${WORKDIR}/requirements.txt"
  ENV FLEX_TEMPLATE_PYTHON_PY_FILE="${WORKDIR}/xml-demo.py"

  RUN pip install -U -r ./requirements.txt