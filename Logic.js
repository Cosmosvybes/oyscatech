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
  const user = await collection.findOne({ username: name });
  return user;
};

//get all user messages
const sentMessages = async (sender) => {
  const allMessage = await messages.findOne({ sender: sender });
  return allMessage;
};

//createDepartmemnt

const createUser = async (name, username, password, email) => {
  const departmentId = Math.floor(Math.random() * 98765 + 1234);
  const encryptedPassword = await bcrypt.hash(password, saltRounds);
  await collection.insertOne({
    id: departmentId,
    name: name,
    username: username,
    password: encryptedPassword,
    email: email,
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
  heading: heading,
  body: body,
  type: type,
}) {
  const memoId = Math.floor(Math.random() * 862 + 123 * 2023);
  await memorandum.insertOne({
    id: memoId,
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
  return getMemos();
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

module.exports = {
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
