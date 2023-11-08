const jwt = require("jsonwebtoken");

function Auth(req, res, next) {
  const token = req.cookies.userToken;
  if (!token) {
    res.send({ response: "unauthorized user, sign in to your account" });
  }
  const data = jwt.verify(token, process.env.SECRET_KEY);
  req.user = data;
  next();
}

function verificationAuth(req, res, next) {
  const codeToken = req.cookies.code;
  if (!codeToken) {
    res.send("unauthorized user");
  }
  const codeData = jwt.verify(codeToken, process.env.SECRET_KEY);
  req.verify = codeData;
  next();
}

module.exports = { Auth, verificationAuth };
