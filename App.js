const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const { config } = require("dotenv");
const cookieParser = require("cookie-parser");
const {
  sendMessage,
  getAllNews,
  createMemo,
  User,
  readMessage,
  sentMessages,
  createUser,
  addUser,
  createAuthority,
  getAccounts,
  acceptRequest,
  memoDialogue,
  shareNextAuthority,
  forwardMemo,
  announceMemo,
  deleteMemo,
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
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Credientials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  next();
});

app.use(express.static(path.join(__dirname, "dist")));

function Auth(req, res, next) {
  const token = req.cookies.userToken;
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

app.get("/drafts", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});
app.get("/request", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.get("/api/user", Auth, async (req, res) => {
  const name = req.user.payload;
  try {
    const user = await User(name);
    if (user) {
      res.json(user);
    }
  } catch (error) {
    res.send(error);
  }
});

app.get("/api/mymessage", Auth, async (req, res) => {
  const messages = await sentMessages(req.user.name);
  res.send(messages);
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User(username);
    if (user) {
      const matchPass = await bcrypt.compare(password, user.password);
      if (matchPass) {
        const jwt_ = jwt.sign(
          {
            payload: user.username,
          },
          process.env.SECRET_KEY,
          {
            expiresIn: "2 days",
          }
        );
        res.cookie("userToken", jwt_, { maxAge: 9000000, path: "/api/" });
        res.setHeader("Content-Type", "Text/html");
        res.redirect(302, "/api/user");
      } else {
        res.send({ response: "invalid password", signinStatus: false });
        return;
      }
    } else {
      res.send({ response: "User not found", signinStatus: false });
      return;
    }
  } catch (error) {
    res.send({ response: "inernal error, failed to sign in" });
  }
});

app.post("/api/private/message", Auth, async (req, res) => {
  const { username, message } = req.body;
  const data = await sendMessage(username, message, req.user.payload);
  res.send({ message: data });
});

app.get("/api/admin", Auth, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.post("/api/memo", Auth, async (req, res) => {
  const { heading, from, to, ref, body, key } = req.body;
  try {
    const data = await createMemo(heading, from, to, ref, body, key);
    res.send(data);
  } catch (error) {
    res.send(error);
  }
});

app.patch("/api/forwardmemo", Auth, async (req, res) => {
  const { recipient, memoId } = req.body;

  try {
    const status = await forwardMemo(recipient, req.user.payload, memoId);
    res.send({ response: "memo successfully forwarded", status });
  } catch (error) {
    res.send({ response: "internal error, Unable to forward memo", error });
  }
});

app.patch("/api/memo/dialogue", Auth, async (req, res) => {
  const { response, id, sender } = req.body;
  try {
    const status = await memoDialogue(id, req.user.payload, sender, response);
    res.send(status);
  } catch (error) {
    res.send(error);
  }
});

app.patch("/api/share", Auth, async (req, res) => {
  const { recipient, memoId, memoCreator } = req.body;

  try {
    const data = await shareNextAuthority(
      recipient,
      req.user.payload,
      memoId,
      memoCreator
    );
    res.send({ response: "memo successfully forwarded!", data });
  } catch (error) {
    res.send({ response: "memo could not be shared, internal error" });
  }
});

app.patch("/api/user/accept", Auth, async (req, res) => {
  const { id, username } = req.body;
  let user = req.user.payload;
  const status = await acceptRequest(id, username, user);
  res.send(status);
});

app.post("/api/signup", async (req, res) => {
  const { name, email, username, password, role } = req.body;
  try {
    const existUser = await User(username);
    if (existUser) {
      res.send({ response: "username is taken" });
    } else {
      let result = await createUser(name, username, password, email, role);
      res.send({
        response: result,
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

app.patch("/api/add", Auth, async (req, res) => {
  const { connectName, role } = req.body;
  const name = req.user.payload;
  try {
    const addStatus = await addUser(name, connectName, role);
    res.send({ response: addStatus });
  } catch (error) {
    res.send(error);
  }
});

app.post("/api/authorities/signup", async (req, res) => {
  const { name, role } = req.body;
  const status = await createAuthority(name, role);
  res.send(status);
});

app.get("/api/admins", async (req, res) => {
  const accounts = await getAccounts();
  res.send(accounts);
});

app.post("/api/announcepage", Auth, async (req, res) => {
  const { memoKey } = req.body;
  try {
    const data = await announceMemo(req.user.payload, memoKey);
    res.send({
      response: "memo successfully posted",
      data,
    });
    console.log(data);
  } catch (error) {
    res.send({
      response: "internal error, unable be share to the anouncement page",
      error,
    });
  }
});

app.get("/api/announcement", async (req, res) => {
  try {
    const allData = await getAllNews();
    res.send(allData);
  } catch (error) {
    res.send(error);
  }
});

app.delete("/api/delete", Auth, async (req, res) => {
  const { memoId } = req.body;
  try {
    const deleteStatus = await deleteMemo(req.user.payload, memoId);
    res.send({ response: "memo deleted successfully", deleteStatus });
  } catch (error) {
    res.send({ response: "Error occured", error });
  }
});

app.delete("/api/signout", Auth, (req, res) => {
  res.clearCookie("userToken");
  res.redirect(302, "/");
});

app.listen(port, function () {
  console.log(`Server running on ${port}`);
});
