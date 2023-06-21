const bodyParser = require('body-parser');
const cors = require('cors')
const express = require('express');
const { config } = require('dotenv')
const { createAdmin, sendMessage, createMemo, User, getMemos } = require('./Logic.js')
config()
const port = process.env.PORT
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors())



app.get('/memos', async (req, res) => {
    const memos = await getMemos();
    res.status(200).send(memos)
});

app.post('/memo', async (req, res) => {
    const data = await createMemo(req.body);
    res.status(200).send(data)

})


app.listen(port, function () {
    console.log(`Server running on ${port}`)
})