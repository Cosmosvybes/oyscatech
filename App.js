const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const { config } = require("dotenv");
const cookie = require("cookie-parser");
const {
  createDepartment,
  sendMessage,
  createMemo,
  User,
  getMemos,
  readMessage,
} = require("./Logic.js");
config();
const port = process.env.PORT;

const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

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

async function Auth(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    res.send({ response: "unauthorized user, sign in to your account" });
    return;
  }
  const data = jwt.verify(token, process.env.SECRET_KEY);
  req.user = data;
  next();
}

app.post("/api/account/login", async (req, res) => {
  const { name, password } = req.body;
  const user = await User(name);
  if (user) {
    const matchPass = await bcrypt.compare(password, user.password);
    if (matchPass) {
      const token = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: "1d" });
      res.cookie("token", token, {
        maxAge: "30000",
        httpOnly: true,
      });
      res.cookie("token", token, {
        maxAge: 60000 * 100,
        httpOnly: true,
        path: "/sugconnect",
      }); //
      res.cookie("token", token, {
        maxAge: 60000 * 100,
        httpOnly: true,
        path: "/readmessage",
      }); //parsing cookie for the home page route
      res.cookie("token", token, {
        maxAge: 60000 * 100,
        httpOnly: true,
        path: "/memos",
      });

      res.redirect(302, "/api/memos");
    } else {
      res.send({ response: "invalid password", signinStatus: false });
      return;
    }
  } else {
    res.send({ response: "User not found", signinStatus: false });
    return;
  }
});

app.post("/api/private/message", async (req, res) => {
  const { id, message, sender } = req.body;
  const data = await sendMessage(id, message, sender);
  res.send(data);
});

app.get("/api/memos", Auth, async (req, res) => {
  const memos = await getMemos();
  res.send(memos);
});

app.post("/api/memo", async (req, res) => {
  const data = await createMemo(req.body);
  res.status(200).send(data);
});

app.post("/api/account/signup", async (req, res) => {
  const { name, password } = req.body;
  try {
    const existUser = await User(name);
    if (existUser) {
      res.send({ response: "Account already exist" });
    } else {
      const newAccount = await createDepartment(name, password);
      res.send({ resposne: "Success, Welcome on board", data: newAccount });
    }
  } catch (error) {
    res.send("Registration not successful, try again");
  }
});

app.patch("/api/private/readmessage", Auth, async (req, res) => {
  const { id, messageId } = req.body;
  const status = await readMessage(id, messageId);
  res.send(status);
});

app.listen(port, function () {
  console.log(`Server running on ${port}`);
});
