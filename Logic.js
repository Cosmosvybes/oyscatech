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
  const user = await collection.findOne({ name: name });
  return user;
};

//createDepartmemnt

const createDepartment = async (name, password) => {
  const departmentId = Math.floor(Math.random() * 98765 + 1234);
  const encryptedPassword = await bcrypt.hash(password, saltRounds);
  await collection.insertOne({
    id: departmentId,
    name: name,
    password: encryptedPassword,
    messages: [],
    outbox: [],
  });
  return User(name);
};

//sendMessage func
const sendMessage = async (id, message, sender) => {
  const messageId = Math.floor(Math.random() * 862 + 123 + 2023);

  await messages.insertOne({
    id: messageId,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    message: message,
    readStatus: false,
    sender: sender,
  });

  const sendMessage = await collection.updateOne(
    { id: id },
    {
      $push: {
        messages: {
          id: messageId,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          message: message,
          readStatus: false,
          sender: sender,
        },
      },
    }
  );

  if (sendMessage) {
    return "message succesfully sent~~";
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
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    body: body,
    cc: cc,
  });
  return getMemos();
}

async function getMemos() {
  const memos = memorandum.find({}).toArray();
  return memos;
}

async function readMessage(id, messageId) {
  await messages.updateOne({ id: messageId }, { $set: { readStatus: true } });

  const readStatus = await collection.updateOne(
    { id: id, "messages.id": messageId },
    {
      $set: { "messages.$.readStatus": true },
    }
  );
  return readStatus;
}

async function getMemo(id) {
  const memo = await memorandum.findOne({ id: id });
  return memo;
}

module.exports = {
  createDepartment,
  createMemo,
  User,
  sendMessage,
  getMemos,
  readMessage,
};
