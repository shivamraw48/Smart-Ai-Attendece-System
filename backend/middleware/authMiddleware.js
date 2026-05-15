const jwt = require('jsonwebtoken');
const Teacher = require('../models/Teacher');

const protect = async (req, res, next) => {
    let token;

    // 1. Check if the request has a token in the headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // The header looks like "Bearer eyJhbGci...". We split it to get just the token string.
            token = req.headers.authorization.split(' ')[1];

            // 2. Verify the wristband is real using our secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Find the teacher in the database using the ID hidden inside the token
            // .select('-password') means "get the teacher data, but DO NOT return the password"
            req.teacher = await Teacher.findById(decoded.id).select('-password');

            // 4. The Bouncer steps aside and lets the request through!
            next();
        } catch (error) {
            console.error('Bouncer Error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    // If no token was provided at all
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

module.exports = { protect };