// import { MongoClient } from 'mongodb'
// import { config } from "dotenv";
const { MongoClient } = require("mongodb");
const { config } = require("dotenv");
const bcrypt = require("bcrypt");
const saltRounds = 10;

config();
const client = new MongoClient(process.env.MONGO_URI);

const connection = async () => {
  const connect = await client.connect();
  if (connect) {
    return "connected to the database";
  } else {
    return "connection not established";
  }
};

const collection = client.db("Oyscatech").collection("administration");
const memorandum = client.db("Oyscatech").collection("memo");
const messages = client.db("Oyscatech").collection("messages");

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
  heading: heading,
  body: body,
  to: to,
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

module.exports = {
  createUser,
  sentMessages,
  createMemo,
  User,
  sendMessage,
  getMemos,
  readMessage,
};
