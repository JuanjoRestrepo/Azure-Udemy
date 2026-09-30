const { app } = require('@azure/functions');
const sgMail = require('@sendgrid/mail');

app.cosmosDB('CosmosTriggerSendGridEmail', {
    connection: 'COSMOSDB_CONNECTION',
    databaseName: '%COSMOS_DATABASE_NAME%',
    containerName: '%COSMOS_CONTAINER_NAME%',
    leaseContainerName: 'leases',
    createLeaseContainerIfNotExists: true,
    handler: async function(documents, context) {
        if (!Array.isArray(documents) || documents.length === 0) {
            context.log('Cosmos DB trigger received no documents.');
            return;
        }

        var apiKey = process.env.SENDGRID_API_KEY;
        var to = process.env.SENDGRID_TO_EMAIL;
        var from = process.env.SENDGRID_FROM_EMAIL;

        if (!apiKey || !to || !from) {
            context.log('ERROR: Missing SendGrid env vars.');
            return;
        }

        sgMail.setApiKey(apiKey);

        var summaries = documents.map(function(document) {
            var topTags = Array.isArray(document.tags) ? document.tags.slice(0, 3) : [];
            var tagSummary = topTags.length > 0
                ? topTags.map(function(tag) {
                    var confidence = Number(tag.confidence);
                    return Number.isFinite(confidence)
                        ? tag.name + ' (' + (confidence * 100).toFixed(2) + '%)'
                        : tag.name;
                }).join(', ')
                : 'No tags detected';
            return 'Image: ' + (document.blobName || document.id) + '\nTop Tags: ' + tagSummary;
        });

        var subject = documents.length === 1 ? 'Image analysis completed' : documents.length + ' image analyses completed';
        var text = summaries.join('\n\n');

        context.log('Sending analysis email for ' + documents.length + ' document(s) via SendGrid SDK...');

        try {
            var result = await sgMail.send({ to: to, from: from, subject: subject, text: text });
            context.log('SUCCESS: Email sent! Status=' + result[0].statusCode);
        } catch (error) {
            context.log('ERROR sending email: ' + error.message);
            if (error.response) {
                context.log('SendGrid body: ' + JSON.stringify(error.response.body));
            }
        }
    },
});