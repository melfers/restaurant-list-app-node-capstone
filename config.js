'use strict';
exports.DATABASE_URL = process.env.DATABASE_URL ||
                      'mongodb://user:password1@ds255005.mlab.com:55005/restaurant-list-node';
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ||
                      'mongodb://user:password1@ds255005.mlab.com:55005/restaurant-list-node';
exports.PORT = process.env.PORT || 8080;