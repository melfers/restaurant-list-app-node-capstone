"use strict";

const mongoose = require("mongoose");

const userLoggedSchema = new mongoose.Schema({
  usersLoggedIn: String
});

const Logged = mongoose.model("session", userLoggedSchema);

module.exports = Logged;