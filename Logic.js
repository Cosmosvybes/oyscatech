import { MongoClient } from 'mongodb'
import dotenv from "dotenv";
dotenv.config()
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

const createAdmin = async () => {
    const adminId = Math.floor(Math.random() * 98765 + 1234)
    const admin = await collection.insertOne({ id: adminId, name: 'Alex otti', messages: [{ date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(), details: 'We need to meet by 6pm today! ' }] });
    return admin
}

const updateAdmin = async () => {
    const admin = await collection.updateOne({ id: 36089 }, { $push: { messages: { date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(), details: 'Join the Escos by 12 ! ' } } });
    return admin;
};


const getAdmin = async () => {
    const user = await collection.findOne({ id: 36089 });
    return user;

}


async function createMemo() {
    const memo = await memorandum.insertOne({ heading: 'ADMISSION ONGOING', date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(), body: 'This is to announce the admision process is open for the nds and hnds', cc: 'Registar' });
    return memo;
}

const admin = await getAdmin();
console.log(admin.messages)