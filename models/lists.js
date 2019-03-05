'use strict';

const mongoose = require('mongoose');

const listSchema = mongoose.Schema({
    list_id: String, 
    user: String,
    name: String,
    description: String,
    index: Number,
    restaurants: {
        type: Array
    }
});

const History = mongoose.model('List', listSchema);

module.exports = History;