
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')

const { config } = require('dotenv')
const cookie = require('cookie-parser')
const { createDepartment, sendMessage, createMemo, User, getMemos, readMessage } = require('./Logic.js');
config()
const port = process.env.PORT


const jwt = require('jsonwebtoken');
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors())
app.use(cookie())



async function Auth(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        res.send({ response: 'unauthorized user, sign in to your account' })
    }
    else {
        const data = jwt.verify(token, process.env.SECRET_KEY);
        req.user = data
        next()
    }
}



app.post('/login', async (req, res) => {
    const { id, password } = req.body
    const user = await User(id);
    if (user) {
        if (user.password === password) {
            const token = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: '1d' });
            res.cookie('token', token, { maxAge: '30000', httpOnly: true, path: '/' });
            res.redirect('/memos')
        }
        else {
            res.send({ response: 'invalid password' })
            return;
        }
    }
    else {
        res.send({ response: 'User not found' });
        return;
    }

});

app.post('/private/message', async (req, res) => {
    const { id, message } = req.body;
    const data = await sendMessage(id, message);
    res.send(data);
});


app.get('/memos', Auth, async (req, res) => {
    const memos = await getMemos();
    res.status(200).send(memos)
});

app.post('/memo', async (req, res) => {
    const data = await createMemo(req.body);
    res.status(200).send(data)

});


app.post('/account/signup', async (req, res) => {
    const { name, password } = req.body;
    const userAccount = await createDepartment(name, password)
    res.send(userAccount);
});

app.patch('/private/readmessage', async (req, res) => {
    const { id, messageId } = req.body
    const status = await readMessage(id, messageId);
    res.send(status);

});





app.listen(port, function () {
    console.log(`Server running on ${port}`)
})