const { app } = require('@azure/functions');
const axios = require('axios');

app.http('TwitterTextAnalytics', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const hashtag = (request.query.get('hashtag') ?? '').trim().replace(/^#/, '');
        if (!/^[A-Za-z0-9_]+$/.test(hashtag)) {
            return {
                status: 400,
                jsonBody: { message: 'Provide a valid hashtag using the hashtag query parameter.' }
            };
        }

        if (!process.env.TWITTER_TOKEN) {
            return {
                status: 500,
                jsonBody: { message: 'The TWITTER_TOKEN application setting is required.' }
            };
        }

        if (!process.env.COGNITIVE_SERVICES_ENDPOINT || !process.env.COGNITIVE_SERVICES_KEY) {
            return {
                status: 500,
                jsonBody: {
                    message: 'The COGNITIVE_SERVICES_ENDPOINT and COGNITIVE_SERVICES_KEY application settings are required.'
                }
            };
        }

        try {
            const tweetsResponse = await axios.get('https://api.x.com/2/tweets/search/recent', {
                headers: {
                    Authorization: `Bearer ${process.env.TWITTER_TOKEN}`
                },
                params: {
                    query: `#${hashtag} lang:en`,
                    'tweet.fields': 'lang',
                    max_results: 100
                }
            });
            const tweets = (tweetsResponse.data.data ?? []).map(tweet => ({
                id: tweet.id,
                text: tweet.text
            }));

            if (tweets.length === 0) {
                return {
                    jsonBody: {
                        positiveTweets: [],
                        negativeTweets: [],
                        neutralTweets: [],
                        mixedTweets: []
                    }
                };
            }

            const endpoint = process.env.COGNITIVE_SERVICES_ENDPOINT.replace(/\/+$/, '');
            const sentimentResponse = await axios.post(
                `${endpoint}/text/analytics/v3.1/sentiment`,
                {
                    documents: tweets.map(tweet => ({
                        id: tweet.id,
                        language: 'en',
                        text: tweet.text
                    }))
                },
                {
                    headers: {
                        'Ocp-Apim-Subscription-Key': process.env.COGNITIVE_SERVICES_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const tweetsById = new Map(tweets.map(tweet => [tweet.id, tweet]));
            const summary = {
                positiveTweets: [],
                negativeTweets: [],
                neutralTweets: [],
                mixedTweets: []
            };

            (sentimentResponse.data.documents ?? []).forEach(result => {
                const tweet = tweetsById.get(result.id);
                const category = `${result.sentiment.toLowerCase()}Tweets`;
                if (tweet && Object.hasOwn(summary, category)) {
                    summary[category].push(tweet);
                }
            });

            return { jsonBody: summary };
        } catch (error) {
            const upstreamStatus = axios.isAxiosError(error) ? error.response?.status : undefined;
            context.error('Tweet sentiment request failed.', {
                upstreamStatus,
                message: error.message
            });

            return {
                status: upstreamStatus === 429 ? 429 : 502,
                jsonBody: {
                    message: upstreamStatus === 429
                        ? 'An upstream API rate limit was reached. Try again later.'
                        : 'Unable to retrieve and analyze tweets.'
                }
            };
        }
    }
});
