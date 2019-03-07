'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        unique: false,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String, 
        trim: true,
        required: true
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

exports.User = User;