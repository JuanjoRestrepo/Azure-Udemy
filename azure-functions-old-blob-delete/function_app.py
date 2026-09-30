from datetime import datetime, timezone
import logging
import os
import azure.functions as func
from azure.storage.blob import ContainerClient

app = func.FunctionApp()

@app.timer_trigger(schedule="*/10 * * * * *", arg_name="myTimer", run_on_startup=False,
              use_monitor=False)
@app.queue_output(arg_name="outputQueueItem", queue_name="image-input-queue",
              connection="AzureWebJobsStorage")
def TimeTriggerDeleteOldBlob(myTimer: func.TimerRequest,
                              outputQueueItem: func.Out[str]) -> None:
    if myTimer.past_due:
        logging.info('The timer is past due!')

    utc_timestamp = datetime.now(timezone.utc)

    logging.info('Python timer trigger function ran at %s', utc_timestamp.isoformat())

    storage_connection_string = os.environ["afcmasterstorage account_STORAGE"]
    container = ContainerClient.from_connection_string(
        conn_str=storage_connection_string,
        container_name="image-input"
    )
    blob_list = container.list_blobs()

    for blob in blob_list:
        diff = utc_timestamp - blob.creation_time
        # If the blob is older than X days/minutes/seconds, delete it
        if diff.seconds > 120:
            blob_client = container.get_blob_client(blob)
            blob_client.delete_blob()

            # Store it in the queue output binding
            outputQueueItem.set(blob.name)