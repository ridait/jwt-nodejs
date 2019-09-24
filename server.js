const dotenv = require("dotenv");
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();
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

app.get("/users", authenticateToken, (req, res) => {
  const body = { connectedAs: req.user, users };
  res.status(200).send(body);
});

app.post("/login", async (req, res) => {
  try {
    ({ username, password } = extractLoginRequest(req));
    handleLogin(username, password).then(({ statusCode, body }) => {
      const user = { name: username };
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
      res.status(statusCode).send({ ...body, accessToken });
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

app.get("/secrets", authenticateToken, (req, res) => {
  const body = { connectedAs: req.user, secrets };
  res.status(200).send(body);
});

app.listen(3000);

function authenticateToken(req, res, next) {
  const accessToken = extractAccessToken(req);
  if (accessToken == null) {
    res.status(401).send();
  } else {
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (error, user) => {
      if (error) res.status(403).send();
      else {
        req.user = user;
        next();
      }
    });
  }
}

const extractAccessToken = req => {
  const authHeader = req.headers["authorization"];
  const accessToken = authHeader && authHeader.split(" ")[1];
  return accessToken;
};

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
