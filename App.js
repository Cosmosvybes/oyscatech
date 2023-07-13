const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const { config } = require("dotenv");
const cookie = require("cookie-parser");
const {
  sendMessage,
  createMemo,
  User,
  getMemos,
  readMessage,
  sentMessages,
  createUser,
  personel,
} = require("./Logic.js");
const { daVinci } = require("./Davinci.js");

config();

const port = process.env.PORT || 2006;
const path = require("path");

const bcrypt = require("bcrypt");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(cookie());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Credientials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  next();
});

app.use(express.static(path.join(__dirname, "dist")));

function Auth(req, res, next) {
  const token = req.cookies.myToken;
  console.log(token);
  if (!token) {
    res.send({ response: "unauthorized user, sign in to your account" });
  }
  const data = jwt.verify(token, process.env.SECRET_KEY);
  req.user = data;
  next();
}

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.get("/api/user", Auth, async (req, res) => {
  console.log(req.user);
  // try {
  //   const user = await User(name);
  //   if (user) {
  //     res.json(user);
  //   }
  // } catch (error) {
  //   res.send(error);
  // }
});

app.get("/api/mymessage", Auth, async (req, res) => {
  const messages = await sentMessages(req.user.name);
  res.send(messages);
});

app.post("/api/login", async (req, res) => {
  const { name, password } = req.body;
  const user = await User(name);
  if (user) {
    const matchPass = await bcrypt.compare(password, user.password);
    if (matchPass) {
      const jwt_ = jwt.sign({ payload: user }, process.env.SECRET_KEY, {
        expiresIn: "2 days",
      });
      res.cookie("userToken", jwt_, { maxAge: 900000, path: "/api/user" });
      res.setHeader("Content-Type", "Application/json");
      res.redirect(302, "/api/user");
      // res.send(jwt_);
    } else {
      res.send({ response: "invalid password", signinStatus: false });
      return;
    }
  } else {
    res.send({ response: "User not found", signinStatus: false });
    return;
  }
});

app.patch("/api/verification", (req, res) => {});

app.post("/api/private/message", Auth, async (req, res) => {
  const { username, message } = req.body;
  const data = await sendMessage(username, message, req.user.payload);
  res.send({ message: data });
});

app.get("/api/memos", Auth, async (req, res) => {
  const memos = await getMemos();
  res.json(memos);
});

app.get("/api/admin", Auth, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.post("/api/memo", Auth, async (req, res) => {
  const data = await createMemo(req.body);
  res.send(data);
});

app.post("/api/signup", async (req, res) => {
  const { name, email, username, password, role } = req.body;
  try {
    const existUser = await User(username);
    if (existUser) {
      res.send({ response: "Account already exist" });
    } else {
      const newAccount = await createUser(
        name,
        username,
        password,
        email,
        role
      );
      res.send({
        response: "sucess! You have succesfully registered your account 🤩",
        data: newAccount,
      });
    }
  } catch (error) {
    res.send(error);
  }
});

app.patch("/api/private/readmessage", Auth, async (req, res) => {
  const { messageId } = req.body;
  const status = await readMessage(messageId, req.user.payload);
  res.send(status);
});

app.post("/api/askvinci", async (req, res) => {
  const { question } = req.body;
  try {
    const answer = await daVinci(question);
    res.send(answer);
  } catch (error) {
    res.send(error);
  }
});

app.get("/api/signout", (req, res) => {
  res.clearCookie("token");
  res.redirect(301, "/");
});

app.post("/api/register/personel", async (req, res) => {
  const user = personel("Ololade", "asakemusik", "Student");
  const regStatus = await user.joinAdmin();
  res.send(regStatus);
});

app.listen(port, function () {
  console.log(`Server running on ${port}`);
});
