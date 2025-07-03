import dotenv from "dotenv"
dotenv.config();

import express from "express"
import {createServer} from "node:http"
import mongoose from "mongoose"
import cors from "cors";
import { connectToSocket } from "./src/controllers/socketManager.js";
import userRoutes from "./src/routes/users.routes.js"
const app = express();

const server = createServer(app);
const io = connectToSocket(server);

app.set("port", (process.env.PORT || 8000)) //same as local storage


app.use(cors());
app.use(express.json({limit: "40kb"})); // to reduce payload
app.use(express.urlencoded({limit: "40kb", extended: true}));
app.use("/api/v1/users", userRoutes);

app.get("/", (req, res) => {
    return res.json({"Hello":"World"})
});


const start = async ()=>{
    const connectiondb = await mongoose.connect(`${process.env.MONGO_URL}`);

    console.log(`Mongo Connected DB Host: ${connectiondb.connection.host}`)

    server.listen(app.get("port"), () => {
    console.log("Listening on PORT 8000");
})
}

start();