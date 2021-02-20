FROM docker.elastic.co/elasticsearch/elasticsearch:5.6.5
ADD ./elasticsearch.yml /usr/share/elasticsearch/config/
# Remove x-pack
RUN bin/elasticsearch-plugin remove x-pack --purge

# Install mapper-attachments for PDF ingestion
RUN bin/elasticsearch-plugin install mapper-attachments

USER root
RUN chown elasticsearch:elasticsearch config/elasticsearch.yml
USER elasticsearch