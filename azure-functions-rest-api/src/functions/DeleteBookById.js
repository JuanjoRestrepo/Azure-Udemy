const { CosmosClient } = require('@azure/cosmos');
const { app, input } = require('@azure/functions');

const endpoint = process.env.CosmosDBEndpoint;
const key = process.env.CosmosDBAuthKey;
const databaseName = process.env.DatabaseName;
const containerName = process.env.CollectionName;
const client = new CosmosClient({ endpoint, key });

const inputDocument = input.cosmosDB({
    databaseName,
    containerName,
    connection: 'afcmaincosmosaccount',
    sqlQuery: 'SELECT * FROM c',
});
inputDocument.name = 'inputDocument';

app.http('DeleteBookById', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'DeleteBookById',
    extraInputs: [inputDocument],
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const id = request.query.get('id') || request.query.get('Id');
        if (!id) {
            return { status: 400, body: 'Parameter missing: id' };
        }

        const documents = context.extraInputs.get(inputDocument) || [];
        const book = documents.find((item) => item.id === id);

        if (!book) {
            return {
                status: 404,
                jsonBody: { success: false, message: 'Book not found.' },
            };
        }

        try {
            const container = client.database(databaseName).container(containerName);
            await container.item(book.id, book.author).delete();
        } catch (error) {
            context.error('DeleteBookById failed.', error);
            return { status: 500, body: 'Failed to delete item' };
        }

        return { status: 200, body: 'Item deleted successfully' };
    }
});
