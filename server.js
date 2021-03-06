const User = require("./models/users");
const { List } = require("./models/lists");
const Restaurant = require("./models/restaurants");
const Logged = require("./models/userLoggedIn");
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const app = express();
const bcrypt = require("bcryptjs");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, PORT, DATABASE_URL } = require("./config");
const passport = require("passport");
const BasicStrategy = require("passport-http").BasicStrategy;
const unirest = require("unirest");
const https = require("https");
const http = require("http");
const events = require("events");
const axios = require("axios");

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));
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
      server = app
        .listen(port, () => {
          console.log(`Your app is listening on port ${port}`);
          resolve();
        })
        .on("error", err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log("Closing server");
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

// external API call for user search
var getFromZomatoAxios = function(cityId, term) {
  let url = `https://developers.zomato.com/api/v2.1/search?entity_id=${cityId}&entity_type=city&q=${term}`;

  return axios.get(url, {
    headers: {
      Authorization: "2ec54e7675164eec06fdfa23d608c529",
      "Content-Type": "application/json",
      Port: 443,
      "User-Agent": "Paw/3.1.2 (Macintosh; OS X/10.12.5) GCDHTTPRequest",
      "user-key": "2ec54e7675164eec06fdfa23d608c529"
    }
  });
};

// external API call for pulling single restaurant info
var pullRestaurantInfo = function(restId) {
  var emitter = new events.EventEmitter();
  //https://developers.zomato.com/api/v2.1/search?entity_id=${cityId}&entity_type=city&q=${term}
  var options = {
    host: "developers.zomato.com",
    path: `/api/v2.1/restaurant?res_id=${restId}`,
    method: "GET",
    headers: {
      Authorization: "2ec54e7675164eec06fdfa23d608c529",
      "Content-Type": "application/json",
      Port: 443,
      "User-Agent": "Paw/3.1.2 (Macintosh; OS X/10.12.5) GCDHTTPRequest",
      "user-key": "2ec54e7675164eec06fdfa23d608c529"
    }
  };

  https
    .get(options, function(res) {
      let data = "";

      res.on("data", chunk => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      res.on("end", () => {
        let jsonFormattedResults = JSON.parse(data);
        emitter.emit("end", jsonFormattedResults);
      });
    })
    .on("error", function(e) {
      emitter.emit("error", e);
    });
  return emitter;
};

//----------User Endpoints----------

//Existing user Login
app.post("/auth/login", (req, res) => {
  console.log("user login initiated");
  User.findOne(
    {
      email: req.body.email
    },
    function(err, user) {
      if (err) {
        return res.status(500).json({
          message: "Internal server error"
        });
      }
      if (!user) {
        //bad email
        console.log("bad email");
        return res.status(401).json({
          message: "User not found"
        });
      }
      user.validatePassword(req.body.password, function(err) {
        if (err) {
          console.log("There was an error validating email or password.");
        } else {
          console.log("user logged in successfully");
          const body = user.serialize();
          // Generate jwt with the contents of user object
          const token = jwt.sign(body, JWT_SECRET);
          return res.json({ token });
        }
      });
    }
  );
});

//Create new user on signup
app.post("/auth/signup", (req, res) => {
  console.log("152");
  let name = req.body.name;
  let email = req.body.email;
  let password = req.body.password;

  email = email.trim();
  password = password.trim();

  //Create encryption key
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      console.log("163");
      return res.status(500).json({
        message: "Encryption key creation failed"
      });
    }
    //encrypt password using key
    bcrypt.hash(password, salt, (err, hash) => {
      if (err) {
        console.log("171");
        return res.status(500).json({
          message: "Password encryption failed"
        });
      }
      User.create(
        {
          name,
          email,
          password: hash
        },
        (err, user) => {
          if (err) {
            console.log("182");
            return res.status(500).json({
              message: "Create new user failed"
            });
          }
          if (user) {
            console.log("188", user);
            const body = user.serialize();
            // Generate jwt with the contents of user object
            const token = jwt.sign(body, JWT_SECRET);
            return res.json({ token });
            //return res.json(user);
          }
        }
      );
    });
  });
});

//For persisting user login
app.get("/auth/userLoggedIn", function(req, res) {
  Logged.find({})
    .then(users => {
      res.json({ loggedIn: users });
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
      Logged.find({}).then(users => {
        res.json({ loggedIn: users });
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
app.get("/lists/user/:id", (req, res) => {
  console.log(req.params.id);
  List.find({ user: req.params.id })
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
      res.status(500).json({ error: "Something went wrong" });
    });
});

//Verify no list exists with input name
app.get("/addList/verify/:user", (req, res) => {
  console.log(req.params.user, req.body.name);
  List.findOne({
    user: req.params.user,
    name: req.body.name
  })
    .then(result => {
      console.log(result);
      res.json({ result });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ error: "Something went wrong" });
    });
});

//Create new list
app.post("/user/add/list", (req, res) => {
  let user = req.body.user;
  let name = req.body.name;
  let description = req.body.description;

  name = name.trim();
  console.log(req.body.user, req.body.name, req.body.description);

  List.create(
    {
      user,
      name,
      description
    },
    (err, item) => {
      if (err) {
        return res.status(500).json({
          message: "Internal server error"
        });
      }
      if (item) {
        console.log(`Created a new List named ${name} to ${user}'s account`);
        return res.json(item);
      }
    }
  );
});

//Delete a list
app.delete("/deleteList/:listId", (req, res) => {
  console.log(req.params.listId);
  List.findOneAndDelete({
    _id: req.params.listId
  })
    .then(() => {
      console.log(`${req.params.listId} was deleted`);
      res.status(204).json({ message: `${req.params.listId} was deleted` });
    })
    /*.then(() => {
      Restaurant
        .deleteMany({
          listId: req.params.listId
        })
    })
    .then(() => {
      res.status(204).json({ message: `${req.params.listId} was deleted`});
    })*/
    .catch(err => {
      console.error(err);
      res.status(500).json({
        message: "Internal server error deleting entry"
      });
    });
});

//----------Restaurant Endpoints----------

//Get individual list of restaurants
app.get("/singleList/:listId", (req, res) => {
  console.log(req.params.listId);
  Restaurant.find({ listId: req.params.listId })
    .then(restaurants => {
      console.log(restaurants);
      let listOutput = [];
      restaurants.map(restaurant => {
        listOutput.push(restaurant);
      });
      console.log(listOutput);
      res.json(listOutput);
    })
    .catch(err => {
      console.err(err);
      res.status(500).json({ error: "Something went wrong" });
    });
});

//View individual restaurant info from list
app.get("/restaurant/:restaurantId", (req, res) => {
  console.log(req.params.restaurantId);
  Restaurant.findOne({
    _id: req.params.restaurantId
  })
    .then(restaurant => {
      console.log(restaurant);
      res.json(restaurant);
    })
    .catch(err => {
      console.err(err);
      res.status(500).json({ error: "Something went wrong" });
    });
});

//Add a restaurant to a list
app.post("/list/add/:selectedList/:currentRestaurant", (req, res) => {
  let restaurantInfo = req.body.restaurantInfo;
  let listName = req.body.listName;
  let listId = req.body.listId;
  let notes = req.body.notes;

  console.log(restaurantInfo);

  Restaurant.create(
    {
      listId,
      listName,
      name: restaurantInfo.name,
      featured_image: restaurantInfo.featured_image,
      thumb: restaurantInfo.thumb,
      location: restaurantInfo.location,
      cuisines: restaurantInfo.cuisines,
      userNotes: notes
    },
    (err, item) => {
      if (err) {
        return res.status(500).json({
          message: "Internal server error"
        });
      }
      if (item) {
        console.log(`Restaurant added to list`);
        return res.json(item);
      }
    }
  );
});

//View individual restaurant info from search
app.get("/search/:restaurantName", (req, res) => {
  console.log(req.params.restaurantId);
  Restaurant.findOne({
    listId: req.params.listId,
    _id: req.params.restaurantId
  })
    .then(restaurant => {
      console.log(restaurant);
      res.json(estaurant);
    })
    .catch(err => {
      console.err(err);
      res.status(500).json({ error: "Something went wrong" });
    });
});

//Edit user notes for an individual restaurant
app.put("/lists/user/listname/:id/:restaurantId/edit", (req, res) => {
  console.log(req.params.restaurantId, req.body.userNotes);

  Restaurant.update(
    {
      _id: req.params.restaurantId
    },
    {
      $set: {
        userNotes: req.body.userNotes
      }
    }
  )
    .then(updatedRestaurant => {
      res.status(200).json({
        _id: updatedRestaurant._id,
        userNotes: updatedRestaurant.userNotes
      });
    })
    .catch(err => res.status(500).json({ message: err }));
});

//Remove an individual restaurant from a list
app.delete("/restaurant/delete/:restaurantId", (req, res) => {
  console.log(req.params.restaurantId);

  Restaurant.findOneAndDelete({
    _id: req.params.restaurantId
  })
    .then(() => {
      console.log(`${req.params.restaurantId} was deleted`);
      res
        .status(204)
        .json({ message: `${req.params.restaurantId} was deleted` });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({
        message: "Internal server error deleting entry"
      });
    });
});

//----------Search Endpoint----------
//Gets search results from user query
app.get("/search/:cityId/:term", (req, res) => {
  const term = req.params.term;
  const cityId = req.params.cityId;
  console.log("term=", term, "cityId=", cityId);
  //external api function call and response
  let searchReq = getFromZomatoAxios(cityId, term);

  searchReq.then(function(response) {
    return res.json(response.data.restaurants);
  });
});

//Gets restaurant info for a selected restaurant from search results
app.get("/singleRestaurant/:id", (req, res) => {
  const restId = req.params.id;
  console.log(restId);
  //external api function call and response
  let searchReq = pullRestaurantInfo(restId);

  //get the data from the first api call
  searchReq.on("end", function(item) {
    res.json(item);
  });

  //error handling
  searchReq.on("error", function(code) {
    res.sendStatus(code);
  });
});

module.exports = { app, runServer, closeServer };
