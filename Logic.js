// import { MongoClient } from 'mongodb'
// import dotenv from "dotenv";
const { MongoClient } = require('mongodb');
const { config } = require('dotenv')
// const { Auth } = require('./Auth.js');
const jwt = require('jsonwebtoken');
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


const createDepartment = async ({ name: name, password: password }) => {
    const departmentId = Math.floor(Math.random() * 98765 + 1234);
    await collection.insertOne({
        id: departmentId,
        name: name,
        password: password,
        messages: []
    });
    return User(departmentId)
}

const sendMessage = async (id, message) => {
    const messageId = Math.floor(Math.random() * 862 + 123 + 2023)
    await collection.updateOne({ id: id },
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
    const user = User(id);
    return user
};


const User = async ({ id: id, password: password }) => {
    const user = await collection.findOne({ id: id });
    if (user) {
        if (user.password === password) {
            const jwtToken = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: '1d' });
            return jwtToken;
        }
        else { return ({ res: 'Incorrect password' }) }
    }
    else {
        return ({ res: 'Account does not exist' })
    }

}


async function createMemo({ heading: heading, body: body, cc: cc }) {
    const memoId = Math.floor(Math.random() * 862 + 123 * 2023);
    await memorandum.insertOne({
        id: memoId,
        heading: heading,
        date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(),
        body: body,
        cc: cc,
        likes: undefined
    });
    return getMemos()
}


async function getMemos() {
    const memos = memorandum.find({}).toArray();
    return memos
}
module.exports = { createDepartment, createMemo, User, sendMessage, getMemos }

// async function likeMemo(id, memoId) {
//     const user = await User(id);
//     const memo = await get
//     if (user) {
//         collection.updateOne({ memoId: memoId })
//     }
// }



