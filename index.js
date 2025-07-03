const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Hello");
})

app.listen(8000, (req, res) => {
    console.log("Listening on PORT 8000");
})