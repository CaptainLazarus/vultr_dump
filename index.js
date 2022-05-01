const express = require("express");
const path = require("path");

const app = express();

app.use(express.static(path.join(process.cwd() + "/public")));

app.use('*/css',express.static('public/css'));
app.use('*/js',express.static('public/js'));

// app.get("/", (req, res) => {
//     res.sendFile(__dirname + "/index.html");
//   });  

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

app.listen(port);

