const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // We use mongoose to connect, passing in the secret URL from our .env file
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1); // Stop the server completely if the database fails to connect
    }
};

module.exports = connectDB; // Export this function so we can use it in server.js