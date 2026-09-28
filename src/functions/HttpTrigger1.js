const { app } = require('@azure/functions');

app.http('HttpTrigger1', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        let body;
        try {
            body = await request.json();
        } catch {
            body = undefined;
        }

        const name = request.query.get('name') || body?.name;

        if (name) {
            return { body: `Hello ${name}` };
        }

        return {
            status: 400,
            body: 'Please pass a name on the query string or in the request body'
        };
    }
});