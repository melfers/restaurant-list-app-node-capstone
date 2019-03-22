'use strict';

const mongoose = require('mongoose');

const ListSchema = mongoose.Schema({
    user: String,
    name: String,
    description: String
});

const List = mongoose.model('List', ListSchema);

exports.List = List;