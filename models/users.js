'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        unique: false,
        required: false
    },
    email: {
        type: String,
        unique: false,
        required: false
    },
    password: {
        type: String, 
        trim: false,
        required: false
    }
});

// Pre-hook to hash password
/*userSchema.pre("save", async function(next) {
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
    next();
}); */
  
userSchema.methods.serialize = function () {
    return {
      id: this._id,
      email: this.email,
      name: this.name
    };
};

userSchema.methods.validatePassword = function(password, callback) {
    bcrypt.compare(password, this.password, (err, isValid) => {
        if (err) {
            callback(err);
            return;
        }
        callback(null, isValid);
    });
};


const User = mongoose.model('User', userSchema);

module.exports = User;