'use strict';

const mongoose = require('mongoose');

const restaurantSchema = mongoose.Schema({
    listId: String,
    name: String,
    featured_image: String,
    location: {
        address: String,
        locality: String
    },
    cuisines: String,
    userNotes: String
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;
