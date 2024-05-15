const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes and origins

const SECRET_KEY = 'a8ZuTAnzJ5_b8SmjGxT9OWEEZkLjYDE0v3lq90R5xlc';
const REFRESH_SECRET_KEY = '5GnCTZC98MLmpVUYEkQoMbLkPQa5f_e4c9aZ3p8B1nE';

// Dummy user data for demonstration
const users = {
    "something@example.com": {
        username: 'something@example.com',
        password: 'willneversendthepasswordhere',
        profile: {
            name: 'Something Someone',
            id: 12345,
            email: "something@example.com",
            role: "admin",
        },
    }
};

const accessTokenExpirySeconds = 5; // 5 seconds
const refreshTokenExpirySeconds = 60; // 1 minute

function generateRandomString(min, max) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    const length = Math.floor(Math.random() * (max - min + 1)) + min;
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

app.post('/login', (req, res) => {
    // Authenticate user
    const user = users[req.body.username];
    if (!user || user.password !== req.body.password) {
        return res.status(401).send({ error: 'Invalid credentials' });
    }

    // Calculate expiration timestamps
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds since epoch
    const accessTokenExpiresAt = currentTime + accessTokenExpirySeconds; // Expiration time in seconds since epoch
    const refreshTokenExpiresAt = currentTime + refreshTokenExpirySeconds; // Expiration time in seconds since epoch

    // Generate tokens
    const accessToken = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: accessTokenExpirySeconds });
    const refreshToken = jwt.sign({ username: user.username }, REFRESH_SECRET_KEY, { expiresIn: refreshTokenExpirySeconds });

    res.json({
        "authTokenData": {
            accessToken,
            accessTokenExpiresAt, // Timestamp in seconds since epoch
            refreshToken,
            refreshTokenExpiresAt
        },
        profile: user.profile,
    });
});

app.get('/content', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403); // Invalid token
        res.json({
            content: `This is the Protected content from API. La, la la, La with a random string: ${generateRandomString(4,20)}`
        });
    });
});

app.post('/refresh', (req, res) => {
    const refreshToken = req.body.token;

    if (!refreshToken) return res.sendStatus(401);

    jwt.verify(refreshToken, REFRESH_SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403); // Invalid refresh token

        const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds since epoch
        const accessTokenExpiresAt = currentTime + accessTokenExpirySeconds; // Expiration time in seconds since epoch

        const accessToken = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: accessTokenExpirySeconds });

        res.json({
            accessToken,
            accessTokenExpiresAt // Timestamp in seconds since epoch
        });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});