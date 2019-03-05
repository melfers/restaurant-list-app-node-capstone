'use strict';

const mongoose = require('mongoose');

const restaurantSchema = mongoose.Schema({
    id: String,
    listsOn: {
        type: String
    },
    name: String,
    featured_image: String,
    location: {
        address: String,
        locality: String
    },
    cuisines: {
        type: string
    },
    userNotes: String
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;
