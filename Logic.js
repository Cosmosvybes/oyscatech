// import { MongoClient } from "mongodb";
// import { config } from "dotenv";
const { MongoClient } = require("mongodb");
const { config } = require("dotenv");
const bcrypt = require("bcrypt");
const saltRounds = 10;

config();
const client = new MongoClient(process.env.MONGO_URI);

const collection = client.db("Oyscatech").collection("administration");
const memorandum = client.db("Oyscatech").collection("memo");
const messages = client.db("Oyscatech").collection("messages");
const generalPost = client.db("Oyscatech").collection("posts");

const User = async (name) => {
  const user = await collection.findOne({ name: name });
  return user;
};

//get all user messages
const sentMessages = async (sender) => {
  const allMessage = await messages.findOne({ sender: sender });
  return allMessage;
};

//createDepartmemnt

const createUser = async (name, username, password, email, role) => {
  const referrenceId = Math.floor(Math.random() * 98765 + 1234);
  const encryptedPassword = await bcrypt.hash(password, saltRounds);
  await collection.insertOne({
    id: referrenceId,
    name: name,
    username: username,
    password: encryptedPassword,
    email: email,
    role: role,
    verification: false,
    messages: [],
    outbox: [],
  });
  return User(username);
};

//sendMessage func
const sendMessage = async (username, message, sender) => {
  const messageId = Math.floor(Math.random() * 862 + 123 + 2023);

  await messages.insertOne({
    id: messageId,
    date: new Date().toLocaleString("en-Us", {
      month: "long",
      day: "numeric",
      minute: "numeric",
      seconds: "numeric",
      hour12: true,
      hour: "numeric",
      year: "2-digit",
    }),
    message: message,
    readStatus: false,
    sender: sender,
  });

  await collection.updateOne(
    { username: sender },
    {
      $push: {
        outbox: {
          id: messageId,
          date: new Date().toLocaleString("en-Us", {
            month: "long",
            day: "numeric",
            minute: "numeric",
            seconds: "numeric",
            hour12: true,
            hour: "numeric",
            year: "2-digit",
          }),
          message: message,
          readStatus: false,
        },
      },
    }
  );

  const sendMessage = await collection.updateOne(
    { username: username },
    {
      $push: {
        messages: {
          id: messageId,
          date: new Date().toLocaleString("en-Us", {
            month: "long",
            day: "numeric",
            minute: "numeric",
            seconds: "numeric",
            hour12: true,
            hour: "numeric",
            year: "2-digit",
          }),
          message: message,
          readStatus: false,
          sender: sender,
        },
      },
    }
  );

  if (sendMessage) {
    return "message succesfully sent";
  } else {
    return "message not sent try again";
  }
};

async function createMemo({
  cc: cc,
  from: from,
  to: to,
  ref: ref,
  heading: heading,
  body: body,
}) {
  const memoId = Math.floor(Math.random() * 862 + 123 * 2023);
  const memo = await memorandum.insertOne({
    id: memoId,
    ref: ref,
    type: "INTERNAL MEMORANDUM",
    heading: heading,
    from: from,
    to: to,
    date: new Date().toLocaleString("en-Us", {
      month: "long",
      day: "numeric",
      minute: "numeric",
      seconds: "numeric",
      hour12: true,
      hour: "numeric",
      year: "2-digit",
    }),
    body: body,
    cc: cc,
  });
  if (memo) {
    return "memo successfully created";
  } else {
    return "internal error, try again ";
  }
}

async function getMemos() {
  const memos = memorandum.find({}).toArray();
  return memos;
}

async function readMessage(messageId, recipient) {
  const sender = await messages.findOne({ id: messageId });

  await messages.updateOne({ id: messageId }, { $set: { readStatus: true } });

  await collection.updateOne(
    {
      username: sender.sender,
      "outbox.id": messageId,
    },
    {
      $set: {
        "outbox.$.readStatus": true,
      },
    }
  );

  const updateStatus = await collection.updateOne(
    { username: recipient, "messages.id": messageId },
    {
      $set: { "messages.$.readStatus": true },
    }
  );
  return updateStatus;
}

async function getMemo(id) {
  const memo = await memorandum.findOne({ id: id });
  return memo;
}

async function createPost(sender, body) {
  const id = Math.floor(Math.random() * 1234 * 9983);
  const post = await generalPost.insertOne({
    id: id,
    body: body,
    sender: sender,
    date: new Date().toLocaleString("en-Us", {
      year: "2-digit",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }),
    likes: [],
    comments: [],
  });
  return getPosts();
}

const findPost = async (id) => {
  const post = await generalPost.findOne({ id: id });
  return post;
};

const getPosts = async () => {
  const allPost = await generalPost.find({}).toArray();
  return allPost;
};

const likePost = async (user, id) => {
  const post = await findPost(id);
  const likes = post.likes;
  if (likes.includes(user)) {
    await generalPost.updateOne({ id: id }, { $pull: { likes: user } });
  } else {
    await generalPost.updateOne({ id: id }, { $push: { likes: user } });
  }
};

const commentPost = async (user, postId, message) => {
  const comment = await generalPost.updateOne(
    { id: postId },
    { $push: { comments: { user: user, message: message } } }
  );
  return comment;
};

function personel(name, password, role) {
  return {
    name,
    role,
    connects: new Array(),
    joinAdmin: async function () {
      let encryptedPassword = await bcrypt.hash(password, saltRounds);
      const newMemeber = await collection.insertOne({
        id: Math.floor(Math.random() * 2023 + 2321),
        name: this.name,
        role: this.role,
        password: encryptedPassword,
        connects: this.connects,
      });
      return newMemeber;
    },

    addCircle: async function (user) {
      const newUser = await collection.updateOne(
        { id: this.id },
        { $push: { connects: user } }
      );
      return newUser;
    },
    findConnect: async function (id) {
      let user = await collection.findOne({ id: this.id });
      let allConnects = user.connects;
      let connect = allConnects.find((user) => user.id === id);
      let response = connect
        ? `${connect.name}found`
        : "The user you sought for is not part of your connects";
      return response;
    },
  };
}
// const Dean = personel(1, "onike", "Dean");
// // const newAdmin = await Dean.joinAdmin();
// // const newCircle = await Dean.addCircle({
// //   id: 2,
// //   name: "Adewale ayomide ",
// //   role: "HOD COMPUTER",
// // });
// const allConnects = await Dean.findConnect(2);
// console.log(allConnects);

module.exports = {
  personel,
  commentPost,
  likePost,
  commentPost,
  getPosts,
  createPost,
  createUser,
  sentMessages,
  createMemo,
  readMessage,
  User,
  sendMessage,
  getMemos,
};
