import argparse
import logging
import apache_beam as beam
from typing import Any, Dict, List
from apache_beam.options.pipeline_options import PipelineOptions
import xmltodict

class XmlIngestion:
    def parse_into_dict(self, xml):
        doc = xmltodict.parse(xml)
        return doc


    # The @ symbol is not allowed as a column name in BigQuery
    def cleanup(self, x):
        import copy
        y = copy.deepcopy(x)
        print(y)
        return y

    def get_orders(self, doc):
        for order in doc['Root']['Orders']['Order']:
            yield self.cleanup(order)

def run(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--output_sink',
        required=True,
        help=(
            'Specify text file orders.txt or BigQuery table project:dataset.table '))
    parser.add_argument(
        '--filename',
        required=True,
        help=(
            'Specify text file orders.txt or BigQuery table project:dataset.table '))
    # parser.add_argument(
    #     '--save_main_session',
    #     required=True,
    #     help=(
    #         'Specify text file orders.txt or BigQuery table project:dataset.table '))  
    known_args, pipeline_args = parser.parse_known_args(argv)    
    # options = PipelineOptions(beam_args, save_main_session=True, streaming=True)
    # known_args = PipelineOptions(known_args, save_main_session=True, streaming=True)

    table_schema = {
        'fields': [
            {'name' : 'CustomerID', 'type': 'STRING', 'mode': 'NULLABLE'},
            {'name' : 'EmployeeID', 'type': 'STRING', 'mode': 'NULLABLE'},
            {'name' : 'OrderDate', 'type': 'STRING', 'mode': 'NULLABLE'},
            {'name' : 'RequiredDate', 'type': 'STRING', 'mode': 'NULLABLE'}
            
        ]
    }
    xml_ingestion = XmlIngestion()
    p = beam.Pipeline(options=PipelineOptions(pipeline_args, streaming=False, save_main_session=True))
    (p
     | 'Read from a File' >> beam.io.ReadFromText(known_args.filename, skip_header_lines=0)
     | 'Parse XML into Dictionary' >> beam.Map(lambda s: xml_ingestion.parse_into_dict(s))
     | 'Parse Orders' >> beam.FlatMap(lambda doc: xml_ingestion.get_orders(doc))
     | 'Write to BigQuery - new' >> beam.io.WriteToBigQuery(
                                    known_args.output_sink,
                                    custom_gcs_temp_location = 'gs://cdn-sample/temp',
                                    schema = table_schema,
                                    write_disposition = beam.io.BigQueryDisposition.WRITE_APPEND,
                                    create_disposition = beam.io.BigQueryDisposition.CREATE_IF_NEEDED))

    p.run().wait_until_finish()


if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    run()