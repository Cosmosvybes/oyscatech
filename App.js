const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const { config } = require("dotenv");
const cookieParser = require("cookie-parser");

config();
const { daVinci } = require("./Utils/Davinci.js");
const {
  signIn,
  userApi,
  myMessage,
  createMessage,
  createNewMemo,
  fwdMemo,
  createDialogue,
  shareNext,
  acceptReq,
  signup,
  readNewMessage,
  addNewUser,
  getAdmins,
  announce,
  getAllUpdates,
  passwordRecovery,
  forgotPassword,
  deleteMyMemo,
  signout,
} = require("./api/Api");
const { verificationAuth, Auth } = require("./Auths/Auth.js");

const port = process.env.PORT || 2006;
const path = require("path");
// const { getAllNews } = require("./Controllers/Logic");

// const bcrypt = require("bcrypt");

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

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.get("/drafts", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});
app.get("/request", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});
app.get("/feed", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});
app.get("/memorecieved", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});
app.get("/authority", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});
app.get("/mention", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});
app.get("/message", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.get("/forgotpassword", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.get("/api/user", Auth, userApi);

app.get("/api/mymessage", Auth, myMessage);

app.post("/api/login", signIn);

app.post("/api/private/message", Auth, createMessage);

app.get("/api/admin", Auth, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.post("/api/memo", Auth, createNewMemo);

app.patch("/api/forwardmemo", Auth, fwdMemo);

app.patch("/api/memo/dialogue", Auth, createDialogue);

app.patch("/api/share", Auth, shareNext);

app.patch("/api/user/accept", Auth, acceptReq);

app.post("/api/signup", signup);

app.patch("/api/private/readmessage", Auth, readNewMessage);

// app.post("/api/askvinci", async (req, res) => {
//   const { question } = req.body;
//   try {
//     const answer = await daVinci(question);
//     res.send(answer);
//   } catch (error) {
//     res.send(error);
//   }
// });

app.patch("/api/add", Auth, addNewUser);

// app.post("/api/authorities/signup", async (req, res) => {
//   const { name, role } = req.body;
//   const status = await createAuthority(name, role);
//   res.send(status);
// });

app.get("/api/admins", getAdmins);

app.post("/api/announcepage", Auth, announce);

app.get("/api/announcement", getAllUpdates);

app.delete("/api/delete", Auth, deleteMyMemo);

app.post("/api/forgotpassword", forgotPassword);

app.post("/api/recovery", verificationAuth, passwordRecovery);

app.post("/api/signout", Auth, signout);

app.listen(port, function () {
  console.log(`Server running on ${port}`);
});
