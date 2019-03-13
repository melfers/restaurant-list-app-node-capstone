'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
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
UserSchema.pre("save", async function(next) {
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
    next();
  });
  
  UserSchema.methods.serialize = function () {
    return {
      id: this._id,
      email: this.email,
      name: this.name
    };
  };
  
  UserSchema.methods.validatePassword = async function (password) {
      const user = this;
      const compare = await bcrypt.compare(password, user.password);
      return compare;
  };

const User = mongoose.model('User', UserSchema);

module.exports = User;