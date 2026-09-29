const { app, output } = require('@azure/functions');
const axios = require('axios');

const cosmosOutput = output.cosmosDB({
    connection: 'COSMOSDB_CONNECTION',
    databaseName: '%COSMOS_DATABASE_NAME%',
    containerName: '%COSMOS_CONTAINER_NAME%',
    createIfNotExists: false,
});

app.storageBlob('BlobTrigger1', {
    path: 'image-input/{name}',
    connection: 'afcmainstorageaccount_STORAGE',
    extraOutputs: [cosmosOutput],
    handler: async (blob, context) => {
        context.log(`Processing: ${context.triggerMetadata.name}`);

        const endpoint = process.env.VISION_ENDPOINT;
        const apiKey = process.env.VISION_KEY;

        try{
            const response = await axios({
                method: 'post',
                url: `${endpoint}vision/v2.0/analyze?visualFeatures=Tags`,
                data: blob,
                headers: {
                    'Ocp-Apim-Subscription-Key': apiKey,
                    'Content-Type': 'application/octet-stream'
                }
            });
            
            context.log('Computer Vision Response:');
            //context.log(JSON.stringify(response.data));
            response.data.tags.forEach(tag => {
                context.log(
                    `${tag.name} (${(tag.confidence * 100).toFixed(2)}%)`
                );
            });

            const requestId = response.data.requestId || context.invocationId;
            context.extraOutputs.set(cosmosOutput, {
                ...response.data,
                id: requestId,
                requestId,
                blobName: context.triggerMetadata.name,
                analyzedAtUtc: new Date().toISOString(),
            });
            
        } catch (error){

            context.log('Computer Vision Error');

            if (error.response){
                context.log(error.response.data);
            } else {
                context.log(error.message);
            }
        }
        
        
        context.log(`Storage blob function processed blob "${context.triggerMetadata.name}" with size ${blob.length} bytes`);
    }
});
