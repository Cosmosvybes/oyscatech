//import { MongoClient } from "mongodb";
// import { config } from "dotenv";
const { MongoClient } = require("mongodb");
const { config } = require("dotenv");
const bcrypt = require("bcrypt");
const e = require("express");
const saltRounds = 10;

config();
const client = new MongoClient(process.env.MONGO_URI);

const collection = client.db("Oyscatech").collection("administration");
const memorandum = client.db("Oyscatech").collection("memo");
const messages = client.db("Oyscatech").collection("messages");
const generalPost = client.db("Oyscatech").collection("posts");
// const authorities = client.db("Oyscatech").collection("authorities");

const User = async (name) => {
  const user = await collection.findOne({ username: name });
  return user;
};

//get all user messages
const sentMessages = async (sender) => {
  const allMessage = await messages.findOne({ sender: sender });
  return allMessage;
};

//create Account
const createUser = async (name, username, password, email, role) => {
  const referrenceId = Math.floor(Math.random() * 98765 + 1234);
  const encryptedPassword = await bcrypt.hash(password, saltRounds);
  let registeredRoles = await getAccounts();
  let existRole = registeredRoles.find((user) => user.role == role);

  if (existRole) {
    return "Selected role is active ";
  }

  let admin = role == "student" || role == "lecturer" ? false : true;
  await collection.insertOne({
    id: referrenceId,
    name: name,
    username: username,
    password: encryptedPassword,
    email: email,
    role: role,
    verification: false,
    messages: [],
    connects: [],
    outbox: [],
    mention: [],
    admin: admin,
    request: [],
    drafts: [],
  });
  return {
    response: "Account successfully created",
    data: await User(username),
  };
};

const mentionUser = async (user, memoId) => {
  const userAccount = await User(user);
  const mentions = userAccount.mention;
  const existMemo = mentions.find((memo) => memo.id == memoId);
  if (existMemo) {
    return "memo already sent in the past, send message! ";
  } else {
    await memorandum.updateOne(
      { id: memoId },
      {
        $push: {
          cc: { id: Math.floor(Math.random() * 323 * 2323), name: user },
        },
      }
    );
    let newMemo = await getMemo(memoId);
    await collection.updateOne(
      { username: user },
      {
        $push: {
          mention: newMemo,
        },
      }
    );
    return {
      user: await User(user),
    };
  }
};
// const mention = await mentionUser("extrofrets", 249136);
// console.log(mention);

const memoDialogue = async (id, sender, response) => {
  await memorandum.updateOne(
    { id: id },
    {
      $push: {
        responses: {
          id: Math.floor(Math.random() * 232 + 2323),
          message: response,
          sender: sender,
        },
      },
    }
  );
  const memo = await getMemo(id);
  await collection.updateOne(
    { username: sender },
    { $push: { mention: memo } }
  );
  return {
    user: await User(sender),
    memo: await getMemo(id),
  };
};

// const dialogue = await memoDialogue(
//   248841,
//   "olatunde",
//   "okay we shallwork on this on G."
// );
// console.log(dialogue);

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
    cc: [{ id: Math.floor(Math.random() + 2323 + 123), name: from }],
    responses: [],
  });

  if (memo.insertedId == 1) {
    return {
      message: "memo successfully created",
      data: await getMemo(memoId),
    };
  } else {
    return "internal error, try again ";
  }
}

async function draftedMemo(sender) {
  const allDrafts = memorandum.find({ from: sender }).toArray();
  return allDrafts;
}

// const userOneDraft = await draftedMemo("abobi");
// console.log(userOneDraft);
// const newMemo = await createMemo({
//   from: "abobi",
//   to: "Public Jagbajantise Promax",
//   ref: "ref/refID-xL",
//   heading: "The heading",
//   body: "Some data to store jagbajantify",
// });
// console.log(newMemo);

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

const addUser = async (username, connectName, role) => {
  let id = Math.random(Math.random() * 1234 + 985);
  const user = await User(username);
  let existingUsers = user["connects"];
  const userAccount = existingUsers.find(
    (account) => account.username == connectName
  );
  if (username == connectName) {
    return "forbidden to add yourself";
  } else if (userAccount) {
    return "user added already exist";
  } else {
    const status = await collection.updateOne(
      { username: username },
      {
        $push: {
          connects: {
            id: id,
            username: connectName,
            role: role,
            requestStatus: false,
          },
        },
      }
    );
    let name = await User(username);
    await collection.updateOne(
      {
        username: connectName,
      },
      {
        $push: {
          request: {
            isConfirmed: false,
            id: id,
            name: name.name,
            role: name.role,
            username: name.username,
          },
        },
      }
    );
    return "new user added";
  }
};

async function getAccounts() {
  const accounts = await collection.find({ admin: true }).toArray();
  return accounts;
}

async function acceptRequest(id, username, peerAccount) {
  const acceptStatus = await collection.updateOne(
    { username: username, "connects.id": id },
    {
      $set: { "connects.$.requestStatus": true },
    }
  );
  let user = await User(username);
  await collection.updateOne(
    { username: user.username },
    {
      $push: {
        connects: {
          id: id,
          username: peerAccount,
          role: user.role,
          isConfirmed: false,
        },
      },
    }
  );

  await collection.updateOne(
    { username: peerAccount, "request.id": id },
    { $set: { "request.$.isConfirmed": true } }
  );

  return acceptStatus;
}

module.exports = {
  acceptRequest,
  getAccounts,
  mentionUser,
  createPost,
  createUser,
  sentMessages,
  createMemo,
  readMessage,
  User,
  sendMessage,
  getMemos,
  addUser,
  memoDialogue,
  draftedMemo, 
};
