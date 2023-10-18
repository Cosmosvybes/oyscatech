// import { MongoClient } from "mongodb";
// import { config } from "dotenv";
// import bcrypt from "bcrypt";
const { MongoClient } = require("mongodb");
const { config } = require("dotenv");
const bcrypt = require("bcrypt");
const saltRounds = 10;

config();
const client = new MongoClient(process.env.MONGO_URI);

const collection = client.db("Oyscatech").collection("administration");
const messages = client.db("Oyscatech").collection("messages");
const announcement = client.db("Oyscatech").collection("announcements");

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
  const referrenceId = Date.now();
  const encryptedPassword = await bcrypt.hash(password, saltRounds);
  const registeredRoles = await getAccounts();
  const existRole = registeredRoles.find((user) => user.role == role);
  if (existRole) {
    return "Selected role is active";
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
    recievedMemo: [],
    admin: admin,
    request: [],
    drafts: [],
  });
  return {
    response: "Account successfully created",
    data: await User(username),
  };
};

//create a new memo into the draft
async function createMemo(heading, from, to, ref, body, key) {
  // const memoId = Date.now();
  const date = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
  const memo = await collection.updateOne(
    { role: from },
    {
      $push: {
        drafts: {
          key: key,
          date: date,
          heading: heading,
          from: from,
          to: to,
          ref: ref,
          body: body,
          cc: [{ id: Date.now(), name: from }],
          response: [],
        },
      },
    }
  );

  return memo.modifiedCount === 1
    ? { response: "new memo drafted" }
    : { response: "internal error try again" };
}

const forwardMemo = async (recipient, sender, memoId) => {
  const userAccount = await User(recipient);
  const memoRecieved = userAccount.recievedMemo;

  const existMemo = memoRecieved.find((memo) => memo.key === memoId);
  if (existMemo) {
    return "memo already sent in the past,send message!";
  } else {
    const memoSender = await User(sender);
    const memoDrafts = memoSender.drafts;
    const memo = memoDrafts.find((memo) => memo.key === memoId);
    await collection.updateOne(
      { username: recipient },
      {
        $push: {
          recievedMemo: memo, // now put the memo forwarded into the the concerned user inbox
        },
      }
    );

    return {
      user: await User(recipient), // return the the user
    };
  }
};

const shareNextAuthority = async (recipient, sender, memoId, memoCreator) => {
  const userAccount = await User(recipient);
  const memoRecieved = userAccount.recievedMemo;
  const existMemo = memoRecieved.find((memo) => memo.key === memoId);

  if (existMemo) {
    return "memo sent already!";
  } else {
    const memoSender = await User(sender);
    const memoInbox = memoSender.recievedMemo;
    const memo = memoInbox.find((memo) => memo.key === memoId);

    const shareStatus = collection.updateOne(
      { username: recipient },
      { $push: { recievedMemo: memo } }
    );
    collection.updateOne(
      { role: memoCreator, "drafts.key": memoId },
      { $push: { "drafts.$.cc": { id: Date.now(), name: recipient } } }
    );
    return shareStatus;
  }
};

//memo minutes / dialogue function
const memoDialogue = async (id, user, sender, response) => {
  const responseUpdate = await collection.updateOne(
    {
      username: user,
      "recievedMemo.key": id,
    },
    {
      $push: {
        "recievedMemo.$.response": {
          id: Date.now(),
          response: response,
          sender: user,
        },
      },
    }
  );

  await collection.updateOne(
    { role: sender, "drafts.key": id },
    {
      $push: {
        "drafts.$.response": {
          id: Date.now(),
          sender: user,
          response: response,
        },
      },
    }
  );

  return responseUpdate;
  // return responseUpdate.modifiedCount === 1
  // ? { response: "new minutes on memo!! - response sent" }
  //   : { response: "internal error , try again" };
};

//sendMessage func
const sendMessage = async (username, message, sender) => {
  const messageId = Date.now();
  await messages.insertOne({
    id: messageId,
    date: new Date().toLocaleString("en-US", {
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
          date: new Date().toLocaleString("en-US", {
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

async function draftedMemo(sender) {
  const allDrafts = memorandum.find({ from: sender }).toArray();
  return { allDrafts };
}

async function getMemos() {
  const memos = memorandum.find({}).toArray();
  return memos;
}

//function to update the message read status
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
  const memo = await announcement.findOne({ id: id });
  return memo;
}

async function announceMemo(sender, memoKey) {
  const announcer = await User(sender);
  const memoToShare = announcer.drafts.find((memo) => memo.key === memoKey);
  const existMemo = await getMemo(memoKey);
  if (existMemo) {
    return "existing news";
  }
  const insertStatus = announcement.insertOne(memoToShare);
  return insertStatus;
}

// new user to your connects
const addUser = async (username, connectName, role) => {
  let id = Date.now();
  const user = await User(username);
  let existingUsers = user["connects"];
  const userAccount = existingUsers.find(
    (account) => account.username == connectName
  );
  if (username == connectName) {
    return "sorry, you can't add yourself";
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

// accept new request mad to your account
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

async function getAccounts() {
  const accounts = await collection.find({ admin: true }).toArray();
  return accounts;
}

const getAllNews = async () => {
  const allAnnouncement = await announcement.find({}).toArray();
  return allAnnouncement;
};

module.exports = {
  getAllNews,
  shareNextAuthority,
  acceptRequest,
  getAccounts,
  forwardMemo,
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
  announceMemo,
};
