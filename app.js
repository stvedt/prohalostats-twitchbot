var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');

var indexRoutes = require('./routes/index');
var channelRoutes = require('./routes/channels');

//DATA
var channelsData = require('./data/channels');
var teamsData = require('./data/teams');
var scrimsData = require('./data/scrims');

var app = express();

var TWITCH_OAUTH_KEY = require('./keys/twitch');

//Twitch Bot
function updateDataFiles( updatedChannelsData , updatedTeamsData, updatedScrimsData ){
  fs.writeFile('./data/channels.json', JSON.stringify(updatedChannelsData, null, 4));
  fs.writeFile('./data/teams.json', JSON.stringify(updatedTeamsData, null, 4));
  fs.writeFile('./data/scrims.json', JSON.stringify(updatedScrimsData, null, 4));
}

function newTeam(teamName){

    teamsData[teamName] =
    {
        "currentScrim": null,
        "pastScrims": []
    };

}

function newScrim( channel, team1, team2){
    var newScrimID = scrimsData.total+1;
    channelsData[channel].currentScrim = newScrimID;
    teamsData[team1].currentScrim = newScrimID;
    if(typeof teamsData[team2] == "undefined"){
        newTeam(team2);
    }
    teamsData[team2].currentScrim = newScrimID;

    //console.log(scrimsData);

    scrimsData[newScrimID] = {
        team1:{
            "score": 0
        },
        team2:{
            "score": 0
        },
        "matches": []
    };

    //console.log(scrimsData);

    updateDataFiles(channelsData, teamsData, scrimsData);

}

function logWin(scrimID){
    scrimsData.scrimID.team1.score++;

}

function logLoss(scrimID){
    scrimsData.scrimID.team2.score++;

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
    var team = channelsData[justChannel].team;
    var playerTeam = teamsData[team];
    if (!self) {
        var split = message.toLowerCase().split(" ");

        switch (split[0]) {
            case "!win":
                //
                client.say(channel, "win logged");
                playerTeam.currentScrim.wins++;
                updateDataFiles(channelsData, teamsData);
                break;
            case "!loss":
                //
                client.say(channel, "loss logged");
                playerTeam.currentScrim.losses++;
                updateDataFiles(channelsData, teamsData);
                break;
            case "!newseries":
                // if(playerTeam.currentScrim.archived == false ){
                //     playerTeam.pastScrims.push(playerTeam.currentScrim);
                //     playerTeam.currentScrim.archived = true;
                // }

                var newOpponentName = message.substring(11);

                newScrim( justChannel, team, newOpponentName)
                // playerTeam.currentScrim.opponent = newOpponentName;
                // playerTeam.currentScrim.wins = 0;
                // playerTeam.currentScrim.losses = 0;
                // playerTeam.currentScrim.archived = false;
                // updateDataFiles(channelsData, teamsData);
                //console.log(split);
                //
                break;
            case "!finishseries":
                if(playerTeam.currentScrim.archived == false ){
                  playerTeam.pastScrims.push(playerTeam.currentScrim);
                  playerTeam.currentScrim.archived = true;
                  updateDataFiles(channelsData, teamsData);
                }
                break;
            case "!score":
                if(playerTeam.currentScrim.archived == false ){
                    var scoreString = team + ':' +
                                      playerTeam.currentScrim.wins + ' | ' +
                                      playerTeam.currentScrim.opponent + ':' +
                                      playerTeam.currentScrim.losses;
                    client.say(channel, scoreString);
                } else {
                    var scoreString = 'Series completed. Last Series Finished - ' +
                                      playerTeam.team + ':' +
                                      playerTeam.currentScrim.wins + ' | ' +
                                      playerTeam.currentScrim.opponent + ':' +
                                      playerTeam.currentScrim.losses;
                    client.say(channel, scoreString);
                }
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
