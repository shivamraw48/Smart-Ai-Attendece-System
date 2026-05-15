const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const teacherSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

// A special Mongoose hook: Before we save a teacher, scramble their password!
teacherSchema.pre('save', async function() {
    // If the password wasn't modified, skip this step
    if (!this.isModified('password')) return;
    
    // Scramble the password with 10 rounds of salt
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    // Notice: We completely removed the `next()` stuff!
});

// A helper method to check if the typed password matches the scrambled database password
teacherSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Teacher', teacherSchema);