'use strict';

const mongoose = require('mongoose');

const ListSchema = mongoose.Schema({
    user: String,
    name: String,
    description: String,
    index: Number
});

const List = mongoose.model('List', ListSchema);

module.List = List;