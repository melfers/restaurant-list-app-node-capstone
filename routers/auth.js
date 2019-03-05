const { User } = require("../models/users");
const { Logged } = require("../models/userLoggedIn");
const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

router.post("/signup", (req, res) => {
  User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password
  })
    .then(user => {
      const body = user.serialize();
      // Generate jwt with the contents of user object
      const token = jwt.sign(body, JWT_SECRET);
      return res.json({ token });
    })
    .catch(err => {
      if (err.code === 11000) {
        res.statusMessage = "Username or Email already exists.";
        return res.status(400).json(res.statusMessage);
      }
    });
});

router.post("/login", function(req, res, next) {
  passport.authenticate("login", { session: false }, (err, user, info) => {
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
});

router.get("/userLoggedIn", function(req, res) {
  Logged.find({})
    .then(users => {
      res.json({loggedIn: users});
    })
    .catch(err => {
      return res.status(400).json(res.statusMessage);
    });
});

router.post("/userLoggedIn", function(req, res) {
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

router.delete("/userLoggedIn", function(req, res) {
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

module.exports = router;

