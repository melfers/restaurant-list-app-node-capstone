const User = require('./models/users');
const List = require('./models/lists');
const Restaurant = require('./models/restaurants');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const app = express();
const bcrypt = require('bcryptjs');
const moment = require('moment');

app.use(express.static('public'));
app.use(express.json());

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');


// ---------- Run/Close Server --------------------
let server;

//starts server and returns a Promise.
function runServer(databaseUrl, port = PORT) {

    return new Promise((resolve, reject) => {
      mongoose.connect(databaseUrl, err => {
        if (err) {
          return reject(err);
        }
        server = app.listen(port, () => {
          console.log(`Your app is listening on port ${port}`);
          resolve();
        })
          .on('error', err => {
            mongoose.disconnect();
            reject(err);
          });
      });
    });
  }

function closeServer() {
    return mongoose.disconnect().then(() => {
      return new Promise((resolve, reject) => {
        console.log('Closing server');
        server.close(err => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    });
  }

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

//----------User Endpoints----------

//Existing user Login
app.post('/auth/login', (req, res) => {
  console.log(req.body.email, req.body.password);
  User 
    .findOne({
      email: req.body.email
    }, function(err, items) {
      if (err) {
        return res.status(500).json({
          message: 'Internal server error'
        });
      }
      if (!items) {
        //bad email
        return res.status(401).json({
          message: "User not found"
        });
      } else {
        items.validatePassword(req.body.password, function(err, isValid) {
          if (err) {
            console.log('Sorry, we couldn\'t validate your email or password.')
          }
          if (!isValid) {
            return res.status(401).json({
              message: 'Not found'
            });
          } else {
            console.log('Login successful!');
            return res.json(items);
          }
        });
      };
    });
});

//Create new user on signup
app.post('/auth/signup', (req, res) => {
  let name = req.body.name;
  let email = req.body.email;
  let password = req.body.password;

  email = email.trim();
  password = password.trim();

  //Create encryption key
  bcrypt.genSalt(10, (err, salt) => {
      if (err) {
          return res.status(500).json({
              message: 'Encryption key creation failed'
          });
      }
      //encrypt password using key 
      bcrypt.hash(password, salt, (err, hash) => {
          if (err) {
              return res.status(500).json({
                  message: 'Password encryption failed'
              });
          }
          User.create({
              name,
              email,
              password: hash
          }, (err, item) => {
              if (err) {
                  return res.status(500).json({
                      message: 'Create new user failed'
                  });
              }
              if (item) {
                  return res.status(200).json(item);
              }
          });
      });
  });

});

//----------List Endpoints----------

//Get all lists for a user
app.get('/lists/user/:id', (req, res) => {
  console.log(req.params.user);
  List
    .find({user: req.params.user})
    .then(lists => {
        console.log(lists);
        let listOutput = [];
        lists.map(list => {
          listOutput.push(list);
        });
        res.json(listOutput);
      })
    .catch(err => {
      console.err(err);
      res.status(500).json({ error: 'Something went wrong'});
    });
});

//Create new list
app.post('/lists/user/addList', (req, res) => {
  let user = req.body.user;
  let name = req.body.name;
  let description = req.body.description;
  let index = req.body.index;

  name = name.trim();
  console.log(
    req.body.user,
    req.body.name,
    req.body.description, 
    req.body.index
    );

  List
    .create({
      user,
      name,
      description,
      index
    }, (err, item) => {
      if(err) {
        return res.status(500).json({
          message: 'Internal server error'
        });
      }
      if (item) {
        console.log(`Created a new List named ${name} to ${user}'s account`);
        return res.json(item);
      }
    });
});

//Delete a list
app.delete('/lists/user/listname/:listId', (req, res) => {
  console.log(req.params.listId);

  List
    .findOneAndDelete({
      user: req.params.user,
      _id: req.params.listId
    })
    .then(() => {
      console.log(`${req.params.listId} was deleted`);
      res.status(204).json({ message: `${req.params.listId} was deleted`});
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({
        message: 'Internal server error deleting entry'
      })
    });
});

//----------Restaurant Endpoints----------

//Get individual list of restaurants
app.get('/lists/user/listname/:id', (req, res) => {
  console.log(req.params.listId);
  Restaurant
    .find({listId: req.params.listId})
    .then(restaurants => {
        console.log(restaurants);
        let listOutput = [];
        lists.map(list => {
          listOutput.push(restaurant);
        });
        res.json(listOutput);
      })
    .catch(err => {
      console.err(err);
      res.status(500).json({ error: 'Something went wrong'});
    });
});

//View individual restaurant info
app.get('/lists/user/listname/:id/:restaurantId', (req, res) => {
  console.log(req.params.restaurantId);
  Restaurant
    .findOne({
      listId: req.params.listId,
      _id: req.params.restaurantId
    })
    .then(restaurant => {
      console.log(restaurant);
      res.json(estaurant);
    })
    .catch(err => {
      console.err(err);
      res.status(500).json({ error: 'Something went wrong'});
    });
});

//Edit user notes for an individual restaurant
app.put('/lists/user/listname/:id/:restaurantId/edit', (req, res) => {
  console.log(req.params.restaurantId, req.body.userNotes);

  Restaurant
  .update({
    _id: req.params.restaurantId
  }, { $set: { 
      userNotes: req.body.userNotes
    }
  })
    .then(updatedRestaurant => {
      res.status(200).json({
        _id: updatedRestaurant._id,
        userNotes: updatedRestaurant.userNotes
      });
    })
    .catch(err => res.status(500).json({ message: err}));
  });

//Remove an individual restaurant from a list
app.delete('/lists/user/listname/:id/:restaurantId/edit', (req, res) => {
  console.log(req.params.restaurantId);

  Restaurant
    .findOneAndDelete({
      _id: req.params.restaurantId
    })
    .then(() => {
      console.log(`${req.params.restaurantId} was deleted`);
      res.status(204).json({ message: `${req.params.restaurantId} was deleted`});
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({
        message: 'Internal server error deleting entry'
      })
    });
});

module.exports = { app, runServer, closeServer };