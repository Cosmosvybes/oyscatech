// import { MongoClient } from 'mongodb'
// import { config } from "dotenv";
const { MongoClient } = require('mongodb');
const { config } = require('dotenv')

config()
const client = new MongoClient(process.env.MONGO_URI)


const connection = async () => {
    const connect = await client.connect();
    if (connect) {
        return 'connected to the database';
    }
    else {
        return 'connection not established'
    }
}

const collection = client.db('Oyscatech').collection('administration');
const memorandum = client.db('Oyscatech').collection('memo');
const likes = client.db('Oyscatech').collection('likes');


const User = async (id) => {
    const user = await collection.findOne({ id: id })
    return user;
}



const createDepartment = async (name, password) => {
    const departmentId = Math.floor(Math.random() * 98765 + 1234);
    const accountID = await collection.insertOne({
        id: departmentId,
        name: name,
        password: password,
        messages: []
    });
    return User(departmentId)
}

const sendMessage = async (id, message) => {
    const messageId = Math.floor(Math.random() * 862 + 123 + 2023)
    const sendMessage = await collection.updateOne({ id: id },
        {
            $push: {
                messages: {
                    id: messageId,
                    date: new Date().toLocaleDateString(),
                    time: new Date().toLocaleTimeString(),
                    message: message,
                    readStatus: false
                }
            }
        }
    )

    if (sendMessage) {
        return "message sent succesfully "
    }
    else { return "message not sent try again" }
};





async function createMemo({ heading: heading, body: body, cc: cc }) {
    const memoId = Math.floor(Math.random() * 862 + 123 * 2023);
    await memorandum.insertOne({
        id: memoId,
        heading: heading,
        date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(),
        body: body,
        cc: cc
    });
    return getMemos()
}


async function getMemos() {
    const memos = memorandum.find({}).toArray();
    return memos
}


async function readMessage(id, messageId) {
    const readStatus = await collection.updateOne({ id: id, "messages.id": messageId },
        {
            $set: { "messages.$.readStatus": true }
        });
    return readStatus;
};



async function getMemo(id) {
    const memo = await memorandum.findOne({ id: id });
    return memo;
}



async function likes(memo, user) {
    const memo = await getMemo(id);
    const user = await User(user)
    if (memo && user) {

    }
}


const memo = await getMemo(248929);
console.log(memo)

module.exports = { createDepartment, createMemo, User, sendMessage, getMemos, readMessage }


