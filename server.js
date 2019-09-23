const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");

const app = express();

app.use(bodyParser.json());

const users = [];
const secrets = [
  {
    owner: "CIA",
    secret: "Top secret"
  },
  {
    owner: "FBI",
    secret: "Top secret again"
  }
];

app.get("/users", (req, res) => {
  res.send(users);
});

app.post("/login", async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const user = users.find(user => user.username === username);
    if (user) {
      const valid = await bcrypt.compare(password, user.password);
      if (valid) {
        res.status(200).send({
          status: "Success",
          message: "Logged In"
        });
      } else {
        res.status(400).send({
          status: "fail",
          message: "Not Allowed"
        });
      }
    } else {
      res.status(400).send({
        status: "fail",
        message: "Cannot find user"
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: "fail",
      message: error.message
    });
  }
});

app.post("/register", async (req, res) => {
  try {
    console.log(req.body);
    const username = req.body.username;
    const password = req.body.password;
    const passwordConfirmation = req.body.passwordConfirmation;
    if (password !== passwordConfirmation) {
      res.status(400).send({
        status: "fail",
        message: "password and password confirmation should be same"
      });
    } else {
      const exist =
        users.filter(user => user.username === username).length !== 0;
      if (exist) {
        res.status(400).send({
          status: "fail",
          message: "username already exists"
        });
      } else {
        const salt = await bcrypt.genSalt();
        const hashedPass = await bcrypt.hash(password, salt);

        users.push({
          username,
          password: hashedPass
        });
        res.status(201).send();
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: "fail",
      message: error.message
    });
  }
});

app.get("/secrets", (req, res) => {
  res.json(secrets);
});

app.listen(3000);
