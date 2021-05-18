import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';

// app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1204237",
    key: "7e8362aadba831b086c3",
    secret: "7785659742b74efd9fa8",
    cluster: "eu",
    useTLS: true
});

const db = mongoose.connection;

db.once('open', () => {
    console.log('DB connected');

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log(change);
        
        if(change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted',
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    received: messageDetails.received
                }
            )
        } else {
            console.log('Error triggering Pusher');
        }
    });
});

// middle
app.use(express.json());
app.use(cors())


// db config
const connection_url = 'mongodb+srv://thepleiad:Mypassword1@cluster0.euaif.mongodb.net/whatsup?retryWrites=true&w=majority';
mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// 

// api routes
app.get('/', (req, res) => res.status(200).send('hello world'));

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        err ? res.status(500).send(err) : res.status(200).send(data)
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data) => {
        err ? res.status(500).send(err) : res.status(201).send(`${data}`)
    })
})


// listen
app.listen(port, () => console.log(`Listening on ${port}`));