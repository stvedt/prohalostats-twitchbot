var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');

var indexRoutes = require('./routes/index');
var channelRoutes = require('./routes/channels');

var data = require('./data/channels');
console.log(data);

var app = express();

var TWITCH_OAUTH_KEY = require('./keys/twitch');

//Twitch Bot
function updateDataFile( updatedData ){
  fs.writeFile('./data/channels.json', JSON.stringify(updatedData, null, 4));
}

// Do NOT include this line if you are using the built js version!
var irc = require("tmi.js");

var options = {
    options: {
        debug: true
    },
    connection: {
        random: "chat",
        reconnect: true
    },
    identity: {
        username: "prohaloscrims",
        password: TWITCH_OAUTH_KEY
    },
    channels: ["#norwegiansven"]
};

var client = new irc.client(options);

client.on("chat", function(channel, user, message, self) {
    // Make sure the message is not from the bot..
    var justChannel = channel.substring(1);
    if (!self) {
        var split = message.toLowerCase().split(" ");

        switch (split[0]) {
            case "!series":
                //
                console.log(data[justChannel].team);
                client.say(channel, "Your message");
                break;
            case "!win":
                //
                client.say(channel, "win logged");
                data[justChannel].currentScrim.wins++;
                updateDataFile(data);
                break;
            case "!loss":
                //
                client.say(channel, "loss logged");
                data[justChannel].currentScrim.losses++;
                updateDataFile(data);
                break;
            case "!newseries":
                if(data[justChannel].currentScrim.archived == false ){
                  data[justChannel].pastScrims.push(data[justChannel].currentScrim);
                  var newOpponentName = message.substring(10);
                  data[justChannel].currentScrim.opponent = newOpponentName;
                  data[justChannel].currentScrim.wins = 0;
                  data[justChannel].currentScrim.losses = 0;
                  //data[justChannel].currentScrim.archived = true;
                } else {

                }
                updateDataFile(data);
                //console.log(split);
                //
                break;
            case "!score":
                var scoreString = data[justChannel].team + ':' +
                                  data[justChannel].currentScrim.wins + ' | ' +
                                  data[justChannel].currentScrim.opponent + ':' +
                                  data[justChannel].currentScrim.losses;
                client.say(channel, scoreString);
        }
    }
});

// Connect the client to the server..
client.connect();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/bot', indexRoutes);
app.use('/bot/channel', channelRoutes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
