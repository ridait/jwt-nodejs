## JWT authentification using Node.js

# initial setup

- npm install
- go to `.env.template` and add your secret keys
- rename `.env.template` to `.env`

# Project Architecture

Project has 2 main servers :

- `authServer.js` listening on port 3000 : handles authentification services
- `server.js` listening on port 4000 : handles other services

# Run Project

- `npm run startAuth` to start Auth Server
- `npm run start` to start webservices

# EndToEnd Test

- Run both servers
- Regiter a new user :

```
Request:

POST http://localhost:3000/register
{
	"username":"rida",
	"password":"test",
	"passwordConfirmation":"test"
}

Response:
201 Created

```

- Login with registered user :

```
Request :

POST http://localhost:3000/login
{
	"username":"rida",
	"password":"test"
}

Response :
{
    "status": "Success",
    "message": "Logged In",
    "accessToken": "[your acccess token]",
    "refreshToken": "[your refresh token]"
}

```

- Access resource in webservices server :

```
Request :

GET http://localhost:4000/secrets
Authorization Bearer [your access token]

```

- In case of token expiration use token endpoint to get new access token

```
Request :

POST http://localhost:3000/token
{
   "refreshToken" : "[your refresh token]"
}

Response :

{
   "accessToken": "[your new access token]"
}

```

- Logout

```
DELETE http://localhost:3000/logout
{
    "refreshToken" : "[your refresh token]"
}

Response :

204 No Content

```
