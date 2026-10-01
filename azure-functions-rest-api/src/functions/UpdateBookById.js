const { app, input, output } = require('@azure/functions');

const inputDocument = input.cosmosDB({
    databaseName: 'BookDB',
    containerName: 'BookContainer',
    connection: 'afcmaincosmosaccount',
    sqlQuery: 'SELECT * FROM c',
});
inputDocument.name = 'inputDocument';

const outputDocument = output.cosmosDB({
    databaseName: 'BookDB',
    containerName: 'BookContainer',
    connection: 'afcmaincosmosaccount',
});
outputDocument.name = 'outputDocument';

app.http('UpdateBookById', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    route: 'UpdateBookById',
    extraInputs: [inputDocument],
    extraOutputs: [outputDocument],
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const id = request.query.get('id');
        if (!id) {
            return { status: 400, body: 'Parameter missing: id' };
        }

        const books = context.extraInputs.get(inputDocument) || [];
        const book = books.find((item) => item.id === id);

        if (!book) {
            return { status: 404, body: 'Book with given Id not found' };
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return { status: 400, body: 'Request body must be valid JSON' };
        }

        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return { status: 400, body: 'Request body must be a JSON object' };
        }

        const author = body.author || book.author;
        if (author !== book.author) {
            return {
                status: 400,
                body: 'Author cannot be changed because it is the container partition key',
            };
        }

        const updatedBook = {
            id,
            author,
            title: body.title || book.title,
            date_published: body.date_published || book.date_published,
        };

        context.extraOutputs.set(outputDocument, updatedBook);

        return {
            status: 200,
            jsonBody: updatedBook,
        };
    }
});
