const express = require('express');
const path = require('path');
const app = express();

// app.use(express.static(path.join(process.cwd() + "/public")));

// app.use('*/css',express.static('public/css'));
// app.use('*/js',express.static('public/js'));

// app.get("/", (req, res) => {
//     res.sendFile(path.join(__dirname , "public" , "index.html"));
//   });  

app.use(express.static(path.join(__dirname, 'build')));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(9000);

