const args = process.argv.slice(2);

const app = require('express')();
const path = require('path');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const mysql = require('mysql');

var dbArgs = getDbArgs(args);
console.log("connecting using args:",dbArgs);
var con = mysql.createConnection({host: dbArgs["ip"], port: dbArgs["port"], user: dbArgs["user"], password: dbArgs["pw"], database: dbArgs["db"]});
con.connect(function(err) {
    if(err) {
      throw err;
    }
    else {
      console.log("connection successful");
      server.listen(3000, '0.0.0.0');
    }
});

app.get('/', function(req, res) {
    let scoreboard = req.query.scoreboard;
    if (typeof scoreboard === "undefined")
      res.sendFile(path.join(__dirname + '/../views/index.html'));
    else
      res.sendFile(path.join(__dirname + '/../views/index.html?scoreboard=' + scoreboard));
})

app.get('/controls', function(req, res) {
    res.sendFile(path.join(__dirname + '/../views/controls.html'));
})

app.get('/settings', function(req, res) {
    let scoreboard = req.query.scoreboard;
    if (typeof scoreboard === "undefined")
      res.sendFile(path.join(__dirname + '/../views/settings.html'));
    else
      res.sendFile(path.join(__dirname + '/../views/settings.html?scoreboard=' + scoreboard));
})

io.sockets.on('connection', function (socket) {
  var address = socket.handshake.address;
  console.log('New connection from ', address);
});

app.get('/scores', function(req, res) {
    // Get data from database
    console.log("getting data");
    let userstring = req.query.users;
    if (typeof userstring === "undefined")
      con.query("SELECT * FROM trash", function(err, result) {
        if (err)
        {
            console.log(err);
            res.setHeader('Content-Type', 'text/plain');
            res.status(500).send("SQL Error!");
        }
        else
        {
            console.log("success");
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(result);
        }
    });
    else {
      let users = userstring.split(',');
      let sql = "SELECT * FROM trash WHERE username=";
      users.forEach(user => sql += con.escape(user) + " OR username=");
      sql = sql.substr(0,sql.length-13);
      con.query(sql, function(err, result) {
        if (err)
        {   
            console.log(err);
            res.setHeader('Content-Type', 'text/plain');
            res.status(500).send("SQL Error!");
        }
        else
        {   
            console.log("success");
            res.setHeader('Content-Type', 'application/json');
            res.status(200).send(result);
        }
    });
    }
})

app.get('/config', function(req, res) {
    console.log("getting config");
    let scoreboard = req.query.scoreboard;
    if (typeof scoreboard === "undefined")
    {
        con.query("SELECT username FROM config", function (err, result) {
          if (err)
        {
            console.log(err);
            res.setHeader('Content-Type', 'text/plain');
            res.status(500).send("SQL Error!");
        }
        else
        {
          console.log("success");
          res.setHeader('Content-Type', 'application/json');
          res.send(result);
        }
      });
    }
    else {
      let sql = "SELECT username FROM config WHERE scoreboard=" + con.escape(scoreboard);
      con.query(sql, function (err, result) {
        if (err)
        {
            console.log(err);
            res.setHeader('Content-Type', 'text/plain');
            res.status(500).send("SQL Error!");
        }
        else
        {
          console.log("success");
          res.setHeader('Content-Type', 'application/json');
          res.send(result);
        }
      });
    }
})

app.get('/addItem', function(req, res) {
    console.log("adding trash item");
    let username = req.query.username;
    if (typeof username === "undefined")
    {
        res.setHeader('Content-Type', 'text/plain');
        res.status(500).send("Must specify username!");
        return;
    }
    let trashcan = req.query.trashcan;
    if (typeof trashcan === "undefined")
    {
        res.setHeader('Content-Type', 'text/plain');
        res.status(500).send("Must specify trashcan!");
        return;
    }
    let type = req.query.type;
    if (typeof type === "undefined")
    {
        res.setHeader('Content-Type', 'text/plain');
        res.status(500).send("Must specify type!");
        return;
    }
    let weight = req.query.weight;
    if (typeof weight === "undefined")
    {
        res.setHeader('Content-Type', 'text/plain');
        res.status(500).send("Must specify weight!");
        return;
    }
    let sql = "INSERT INTO trash (username,trashcan,type,weight) VALUES (" + con.escape(username) + "," + con.escape(trashcan) + "," + con.escape(type) + "," + con.escape(weight) + ")";
    con.query(sql, function (err, result) {
      if (err)
      {
          console.log(err);
          res.setHeader('Content-Type', 'text/plain');
          res.status(500).send("SQL Error!");
      }
      else
      {
        console.log("success");
        res.setHeader('Content-Type', 'application/json');
        res.send(result);
        io.emit('update');
      }
    });
})

app.get('/addUser', function(req, res) {
    console.log("adding user");
    let scoreboard = req.query.scoreboard;
    if (typeof scoreboard === "undefined")
    {
        res.setHeader('Content-Type', 'text/plain');
        res.status(500).send("Must specify scoreboard!");
        return;
    }
    let username = req.query.username;
    if (typeof username === "undefined")
    {
        res.setHeader('Content-Type', 'text/plain');
        res.status(500).send("Must specify username!");
        return;
    }
    let sql = "INSERT INTO config (scoreboard,username) VALUES (" + con.escape(scoreboard) + "," + con.escape(username) + ")";
    con.query(sql, function (err, result) {
      if (err)
      {
          console.log(err);
          res.setHeader('Content-Type', 'text/plain');
          res.status(500).send("SQL Error!");
      }
      else
      {
        console.log("success");
        res.setHeader('Content-Type', 'application/json');
        res.send(result);
        io.emit('refresh');
      }
    });
})

app.get('/removeUser', function(req, res) {
    console.log("removing user");
    let scoreboard = req.query.scoreboard;
    if (typeof scoreboard === "undefined")
    {
        res.setHeader('Content-Type', 'text/plain');
        res.status(500).send("Must specify scoreboard!");
        return;
    }
    let username = req.query.username;
    if (typeof username === "undefined")
    {
        res.setHeader('Content-Type', 'text/plain');
        res.status(500).send("Must specify username!");
        return;
    }
    let sql = "DELETE FROM config WHERE scoreboard=" + con.escape(scoreboard) + " AND username=" + con.escape(username);
    con.query(sql, function (err, result) {
      if (err)
      {
          console.log(err);
          res.setHeader('Content-Type', 'text/plain');
          res.status(500).send("SQL Error!");
      }
      else
      {
        console.log("success");
        res.setHeader('Content-Type', 'application/json');
        res.send(result);
        io.emit('refresh');
      }
    });
})

function getDbArgs(args) {
    res = {"ip": "172.17.0.2", "port": "3306", "user": "root", "pw": "", "db": "DIS"};
    for (let i = 0; i < args.length; i++)
    {
        switch (args[i]) {
            case '--db-ip':
                res["ip"] = args[i+1];
                break;
            case '--db-port':
                res["port"] = args[i+1];
                break;
            case '--db-user':
                res["user"] = args[i+1];
                break;
            case '--db-pw':
                res["pw"] = args[i+1];
                break;
            case '--db-name':
                res["db"] = args[i+1];
                break;
        }
    }
    return res;
}
