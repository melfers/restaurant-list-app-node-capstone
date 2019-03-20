const User = require('./models/users');
const { List } = require('./models/lists');
const Restaurant = require('./models/restaurants');
const Logged = require('./models/userLoggedIn');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const app = express();
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require("jsonwebtoken");
const { JWT_SECRET, PORT, DATABASE_URL } = require("./config");
const passport = require("passport");
const BasicStrategy = require('passport-http').BasicStrategy;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.json());

mongoose.Promise = global.Promise;


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
  //console.log(req.body.email, req.body.password);
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
        console.log('bad email');
        return res.status(401).json({
          message: "User not found"
        });
      } else {/*
        items.validatePassword(req.body.password)
        .then(function(isValid) {
          console.log(isValid);
          if (!isValid) {
            return res.status(401).json({
              message: 'Not found'
            });
          } else {
            console.log('Login successful!');
            return res.json(items);
          }
        });
      */
     items.validatePassword(req.body.password, function(err, isValid) {
      console.log(isValid, err);
      if (err) {
          console.log('There was an error validating email or password.');
      }
      /*if (!isValid) {
          return res.status(401).json({
              message: "Is not valid"
          });*/
      else {
          console.log("user logged in successfully");
          return res.json(items);
      }
  });
    };
    });
});
/*
app.post("/auth/login", function(req, res, next) {
  passport.authenticate("login", { session: false }, (err, user, info) => {
    console.log(user);
    if (err || !user) {
      res.statusMessage = info.message;
      return res.status(400).json(res.statusMessage);
    }

    req.login(user, { session: false }, err => {
      if (err) {
        res.status(400).json(err);
      }

      const body = user.serialize();
      // Generate jwt with the contents of user object
      const token = jwt.sign(body, JWT_SECRET);
      return res.json({ token });
    });
  })(req, res);
});*/

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
          }, (err, user) => {
              if (err) {
                  return res.status(500).json({
                      message: 'Create new user failed'
                  });
              }
              if (user) {
                console.log(user);
                /*const body = user.serialize();
                // Generate jwt with the contents of user object
                const token = jwt.sign(body, JWT_SECRET);
                return res.json({ token });*/
                return res.json(user);
              }
          });
      });
  });
});

//For persisting user login
app.get("/auth/userLoggedIn", function(req, res) {
  Logged.find({})
    .then(users => {
      res.json({loggedIn: users});
    })
    .catch(err => {
      return res.status(400).json(res.statusMessage);
    });
});

app.post("/auth/userLoggedIn", (req, res) => {
  console.log(req.body.user);
  Logged.create({
    usersLoggedIn: req.body.user
  })
  .then(user => {
    Logged.find({})
      .then(users => {
        res.json({loggedIn: users});
      });
  })
  .catch(err => {
    return res.status(400).json(res.statusMessage);
  });
});

app.delete("/auth/userLoggedIn", function(req, res) {
  console.log(req.body.user);
  Logged.deleteMany({
    usersLoggedIn: req.body.user
  })
  .then(user => {
    console.log(`Deleted ${user}!`);
  })
  .catch(err => {
    return res.status(400).json(res.statusMessage);
  });
});

//----------List Endpoints----------

//Get all lists for a user
app.get('/lists/user/:id', (req, res) => {
  console.log(req.params.id);
  List
    .find({user: req.params.id})
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

//----------Search Endpoint----------
app.get('/search/:term', (req, res) => {
  const term = req.params.term;
  const cityId = req.params.cityId;
  console.log(term);
  request(
    "https://developers.zomato.com/api/v2.1/search",
    {
      json: true,
      qs: {
        entity_id: cityId,
        entity_type: city,
        q: term
      }
    },
    function(err, response, body) {
      if (!err && response.statusCode === 200) {
        console.log("searching for restaurants!");
        return res.json({ response });
      } else {
        console.log(err);
        res.status(400).json(err);
      }
    }
  );
});

module.exports = { app, runServer, closeServer };
