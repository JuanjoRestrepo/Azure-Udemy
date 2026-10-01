const { app, input } = require('@azure/functions');

const inputDocument = input.cosmosDB({
    databaseName: 'BookDB',
    containerName: 'BookContainer',
    connection: 'afcmaincosmosaccount',
    sqlQuery: 'SELECT * FROM c',
});
inputDocument.name = 'inputDocument';

app.http('GetBookById', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'GetBookById',
    extraInputs: [inputDocument],
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const id = request.query.get('id');
        if (!id) {
            return {
                status: 400,
                jsonBody: { success: false, message: 'The id query parameter is required.' },
            };
        }

        const books = context.extraInputs.get(inputDocument) || [];
        const book = books.find((item) => item.id === id);

        if (!book) {
            return {
                status: 404,
                jsonBody: { success: false, message: 'Book not found.' },
            };
        }

        return {
            status: 200,
            jsonBody: { success: true, data: book },
        };
    }
});
