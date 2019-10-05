const dotenv = require("dotenv");
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();
const app = express();

app.use(bodyParser.json());

const users = [];
let refreshTokens = [];

app.post("/token", (req, res) => {
  const { refreshToken } = extractRefreshToken(req);

  if (refreshToken == null) res.status(401).send();
  else if (!refreshTokens.includes(refreshToken)) res.status(403).send();
  else {
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (error, user) => {
        if (error) res.status(403).send();
        else {
          const accessToken = generateAccessToken({ name: user.name });
          res.status(200).send({ accessToken });
        }
      }
    );
  }
});

app.post("/login", async (req, res) => {
  try {
    ({ username, password } = extractLoginRequest(req));
    handleLogin(username, password).then(({ statusCode, body }) => {
      if (statusCode == 200) {
        const user = { name: username };
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        refreshTokens.push(refreshToken);
        res.status(statusCode).send({ ...body, accessToken, refreshToken });
      } else {
        res.status(statusCode).send({ body });
      }
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

app.delete("/logout", (req, res) => {
  const { refreshToken } = extractRefreshToken(req);
  refreshTokens = refreshTokens.filter(token => token !== refreshToken);
  res.status(204).send();
});

app.listen(3000);

const generateAccessToken = user => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1m" });
};

const generateRefreshToken = user => {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
};

const extractRefreshToken = req => {
  return ({ refreshToken } = req.body);
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
