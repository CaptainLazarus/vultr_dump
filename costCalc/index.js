const express = require("express");
const parser = require("body-parser");

const app = express();

app.get("/" , (req , res) => {
    res.sendFile(__dirname + "/main.html")
});

app.listen(9010);