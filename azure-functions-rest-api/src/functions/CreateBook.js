const { randomUUID } = require('crypto');
const { app, output } = require('@azure/functions');

const bookDocument = output.cosmosDB({
    databaseName: 'BookDB',
    containerName: 'BookContainer',
    connection: 'afcmaincosmosaccount',
    createIfNotExists: true,
    partitionKey: '/author',
});
bookDocument.name = 'bookDocument';

app.http('CreateBook', {
    methods: ['POST'],
    authLevel: 'anonymous',
    extraOutputs: [bookDocument],
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        let book;
        try {
            book = await request.json();
        } catch {
            return {
                status: 400,
                jsonBody: { success: false, message: 'Request body must be valid JSON.' },
            };
        }

        if (!book || typeof book !== 'object' || Array.isArray(book)
            || typeof book.title !== 'string' || !book.title.trim()) {
            return {
                status: 400,
                body: 'Parameter missing: Title of the book',
            };
        }

        if (typeof book.author !== 'string' || !book.author.trim()) {
            return {
                status: 400,
                body: 'Parameter missing: Author of the book',
            };
        }

        const newBook = {
            author: book.author.trim(),
            title: book.title.trim(),
            date_published: book.date_published,
            id: typeof book.id === 'string' && book.id.trim() ? book.id.trim() : randomUUID(),
        };

        context.extraOutputs.set(bookDocument, newBook);

        return {
            status: 201,
            headers: { location: `/api/GetBookById/${encodeURIComponent(newBook.id)}` },
            body: 'Item added successfully',
        };
    }
});
