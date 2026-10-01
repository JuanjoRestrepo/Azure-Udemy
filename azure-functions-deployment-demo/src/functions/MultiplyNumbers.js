 const { app } = require('@azure/functions');

app.http('MultiplyNumbers', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const num1Value = request.query.get('num1');
        const num2Value = request.query.get('num2');
        const num1 = Number(num1Value);
        const num2 = Number(num2Value);

        if (num1Value === null || num1Value.trim() === '' || !Number.isFinite(num1) ||
            num2Value === null || num2Value.trim() === '' || !Number.isFinite(num2)) {
            return {
                status: 400,
                jsonBody: { error: 'num1 and num2 must be valid numbers.' },
            };
        }

        return { jsonBody: { result: num1 * num2 } };
    }
});
