const express = require('express')
const app = express()
const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

app.use(cors({
    origin: 'http://localhost:3000', // frontend address
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization', 'Content-Type'],
}));
const port = 3003

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/api/healthcheck', (req, res) => {
    res.status(200).json({ status: 'OK' });
}
);
// 👇 Replace these with your real values
const tenantId = process.env.TENANT_ID;
const clientId = process.env.CLIENT_ID;

// 👇 JWKS client to get public keys from Azure AD
const jwksClient = jwksRsa({
    jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`
});

// 👇 Get signing key from kid
function getKey(header, callback) {
    jwksClient.getSigningKey(header.kid, function (err, key) {
        if (err) {
            callback(err);
        } else {
            const signingKey = key.getPublicKey();
            callback(null, signingKey);
        }
    });
}

// 👇 Middleware to validate token
function checkJwt(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(
        token,
        getKey,
        {
            algorithms: ['RS256'],
            issuer: `https://sts.windows.net/${tenantId}/`,
            audience: `api://${clientId}`
        },
        (err, decoded) => {
            if (err) {
                console.error('JWT verification error:', err);
                return res.status(401).send('Invalid token');
            }
            req.user = decoded;
            next();
        }
    );
}

app.get('/api/profile', checkJwt, (req, res) => {
    res.json({
        message: 'Access granted to protected resource',
        user: req.user
    });
});

// Protected API endpoint
app.get('/api/auth/me', checkJwt, async (req, res) => {
    console.log('Received request to /api/auth/me');
    try {
        // The user information is available in the auth token
        const user = {
            oid: req.user.oid,
            name: req.user.name,
            email: req.user.upn
        };

        res.json(user);
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})