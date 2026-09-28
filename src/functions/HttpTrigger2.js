const { app } = require('@azure/functions');

app.http('HttpTrigger2', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const name = request.query.get('name') || await request.text();

        if (!name) {
            return { body: 'Please pass a name on the query string or in the request body' };
        }

        return { body: `Hello, ${name}!` };
    }
});