const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
    ({ username, password } = extractLoginRequest(req));
    handleLogin(username, password).then(({ statusCode, body }) => {
      res.status(statusCode).send(body);
    });
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
    ({ username, password, passwordConfirmation } = extractRegisterRequest(
      req
    ));
    handleRegistration(username, password, passwordConfirmation).then(
      ({ statusCode, body }) => {
        res.status(statusCode).send(body);
      }
    );
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

const extractLoginRequest = req => {
  return ({ username, password } = req.body);
};

const extractRegisterRequest = req => {
  return ({ username, password, passwordConfirmation } = req.body);
};

const handleRegistration = async (username, password, passwordConfirmation) => {
  if (password !== passwordConfirmation) {
    return {
      statusCode: 400,
      body: {
        status: "fail",
        message: "password and password confirmation should be same"
      }
    };
  }
  const exist = users.filter(user => user.username === username).length !== 0;
  if (exist)
    return {
      statusCode: 400,
      body: { status: "fail", message: "username already exists" }
    };

  const salt = await bcrypt.genSalt();
  const hashedPass = await bcrypt.hash(password, salt);

  users.push({
    username,
    password: hashedPass
  });
  return {
    statusCode: 201
  };
};

const handleLogin = async (username, password) => {
  const user = users.find(user => user.username === username);
  if (user) {
    const valid = await bcrypt.compare(password, user.password);
    if (valid)
      return {
        statusCode: 200,
        body: { status: "Success", message: "Logged In" }
      };
    return {
      statusCode: 400,
      body: { status: "fail", message: "Not Allowed" }
    };
  }
  return {
    statusCode: 400,
    body: { status: "fail", message: "Cannot find user" }
  };
};
