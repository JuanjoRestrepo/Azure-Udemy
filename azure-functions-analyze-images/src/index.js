const { app } = require('@azure/functions');
const axios = require('axios');

app.setup({
    enableHttpStream: true,
});
