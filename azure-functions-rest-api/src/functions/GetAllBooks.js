const { app, input } = require('@azure/functions');

const inputDocument = input.cosmosDB({
    databaseName: 'BookDB',
    containerName: 'BookContainer',
    connection: 'afcmaincosmosaccount',
    sqlQuery: 'SELECT * FROM c',
});
inputDocument.name = 'inputDocument';

app.http('GetAllBooks', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'GetAllBooks',
    extraInputs: [inputDocument],
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const books = context.extraInputs.get(inputDocument) || [];

        return { 
            status: 200,
            jsonBody: {
                success: true,
                count: books.length,
                data: books
            },
        };
    }
});
