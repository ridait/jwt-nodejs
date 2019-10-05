const dotenv = require("dotenv");
const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");

dotenv.config();
const app = express();

app.use(bodyParser.json());

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

app.get("/secrets", authenticateToken, (req, res) => {
  const body = { connectedAs: req.user, secrets };
  res.status(200).send(body);
});

app.listen(4000);

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
