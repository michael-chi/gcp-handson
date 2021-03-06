"""
https://towardsdatascience.com/lets-build-a-streaming-data-pipeline-e873d671fc57
"""
from __future__ import absolute_import
import argparse
import logging
import re
import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions
import pyodbc
from apache_beam.io.gcp import gcsio
from bson import json_util
import json

class WriteToSeparateFiles(beam.DoFn):
    def __init__(self, outdir):
        self.outdir = outdir
    def process(self, element):
        writer = filesystems.FileSystems.create(self.outdir + element + '.json')
        # writer.write(element)
        writer.write(json.dumps(results, default=json_util.default))
        writer.close()


class DataIngestion:
    def read_data(self, connect_string, tsql):
        # connect_string = 'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};PORT=1443; DATABASE={database};UID={username};PWD={password}'.format(**details)
        connection = pyodbc.connect(connect_string)
        #grab a new cursor object from the connection
        cursor = connection.cursor()
        table = cursor.execute(tsql)

        columns = [column[0] for column in table.description]
        # tables = cursor.fetchall()
        results = []
        for row in table.fetchall():
            results.append(row)
            # results.append(dict(zip(json.dumps(results, default=json_util.default))))
        return results

class ConvertToString(beam.DoFn):
    def process(self, element):
        yield {'id':1}
        # return json.dumps(results, default=json_util.default)

def run(argv=None):
    """The main function which creates the pipeline and runs it."""

    parser = argparse.ArgumentParser()
    
    parser.add_argument(
        '--connectionString',
        dest='connection_string',
        required=True,
        help='Specify database connection string, must use ODBC 17 for SQL Server driver.')
    
    parser.add_argument(
            '--tsql',
            dest='tsql',
            required=True,
            help='Specify TSQL statment of the query.')
    
    parser.add_argument('--output-bucket',
                        dest='output_bucket',
                        required=True,
                        help='Output Storage Bucket.')

    # Parse arguments from the command line.
    known_args, pipeline_args = parser.parse_known_args(argv)
    print (known_args.output_bucket)
    # DataIngestion is a class we built in this script to hold the logic for
    # transforming the file into a BigQuery table.
    data_ingestion = DataIngestion()

    # Initiate the pipeline using the pipeline arguments passed in from the
    # command line. This includes information such as the project ID and
    # where Dataflow should store temp files.
    p = beam.Pipeline(options=PipelineOptions(pipeline_args))

    (p
     # Read the file. This is the source of the pipeline. All further
     # processing starts with lines read from the file. We use the input
     # argument from the command line. We also skip the first line which is a
     # header row.
     | 'Read from SQL' >> data_ingestion.read_data(known_args.connection_string, known_args.tsql)
     # This stage of the pipeline translates from a CSV file single row
     # input as a string, to a dictionary object consumable by BigQuery.
     # It refers to a function we have written. This function will
     # be run in parallel on different workers using input from the
     # previous stage of the pipeline.
     | 'Conver to String' >> beam.ParDo(ConvertToString())
     #| 'Write to Storage Bucket' >> beam.io.WriteToText(known_args.output_bucket, file_name_suffix='.json',append_trailing_newlines=True,shard_name_template=''))
     | 'Write to Storage Bucket' >> beam.ParDo(WriteToSeparateFiles(known_args.output_bucket)))
    p.run() #.wait_until_finish()

if __name__ == '__main__':
    logging.getLogger().setLevel(logging.INFO)
    run()
