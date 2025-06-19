const jwt = require("jsonwebtoken");

//@ This function creates a JWT (JSON Web Token) for a user
const generateToken = (userId) => {
  //@ Create a token that includes the userId as payload
  //@ It uses a secret key stored in .env (JWT_SECRET)
  //@ The token will expire in 1 hour
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  //@ Return the generated token
  return token;
};
//@ Export the function so it can be used in other files
module.exports = generateToken;
