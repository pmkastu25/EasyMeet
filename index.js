import dotenv from "dotenv"
dotenv.config();

import express from "express"
import {createServer} from "node:http" //socket setup
import mongoose from "mongoose"
import cors from "cors";
import { connectToSocket } from "./src/controllers/socketManager.js"; //socket setup
import {fileURLToPath} from "node:url";
import {dirname, join} from "node:path";
import userRoutes from "./src/routes/users.routes.js"
const app = express();

const server = createServer(app); //socket setup
const io = connectToSocket(server); //socket setup, returnedfrom socket manager in controller

app.set("port", (process.env.PORT || 8000)) //same as local storage


app.use(cors());
app.use(express.json({limit: "40kb"})); // to reduce payload
app.use(express.urlencoded({limit: "40kb", extended: true}));
app.use("/api/v1/users", userRoutes);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get("/", (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log("A user is connected");
    // socket.on('disconnect', ()=>{
    //     console.log("User disconnected");
    // })

    socket.on('chat message', (msg)=>{
        // console.log("message: "+ msg);
        io.emit('chat message', msg);
    })
})

const start = async()=>{
    const connectiondb = await mongoose.connect(`${process.env.MONGO_URL}`);

    console.log(`Mongo Connected DB Host: ${connectiondb.connection.host}`)

    server.listen(app.get("port"), () => {
    console.log("Listening on PORT 8000");
})
}

start();