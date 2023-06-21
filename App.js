const bodyParser = require('body-parser');
const cors = require('cors')
const express = require('express');
const { config } = require('dotenv')
const cookie = require('cookie-parser')
const { createDepartment, sendMessage, createMemo, User, getMemos } = require('./Logic.js');
// const { Auth } = require('./Auth.js');
config()
const port = process.env.PORT

const jwt = require('jsonwebtoken');
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors())
app.use(cookie())
// app.use(cookieParser(process.env.SECRET_KEY))


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


app.get('/memos', Auth, async (req, res) => {
    const memos = await getMemos();
    res.status(200).send(memos)
});

app.post('/memo', async (req, res) => {
    const data = await createMemo(req.body);
    res.status(200).send(data)

});

app.post('/account', async (req, res) => {
    const account = await createDepartment(req.body);
    res.status(200).send(account);
});


app.post('/login', async (req, res) => {
    const user = await User(req.body)
    res.cookie('token', user, { maxAge: 900000, httpOnly: true })
    res.send(user);
})

app.listen(port, function () {
    console.log(`Server running on ${port}`)
})