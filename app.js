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

function join(channel, user){
    console.log(channel);
    if(channel == "#norwegiansven"){
        return true;
    }

}

function newChannel(channel){
    channelsData[channel]= {
        "team": "",
        "pastTeams": [],
        "xuid": "",
        "currentScrim": "",
        "pastScrims": []
    };
    updateDataFiles(channelsData, teamsData, scrimsData);
    return "New channel created";
}

function newTeam(teamName){

    teamsData[teamName] =
    {
        "currentScrim": "",
        "pastScrims": []
    };
    updateDataFiles(channelsData, teamsData, scrimsData);

    return "Team " +teamName + " created";

}

function setTeam(justChannel, teamName){

    if(typeof teamsData[teamName] == "undefined"){
        channelsData[justChannel].team = teamName;
        newTeam(teamName);
    } else {
        //archive old team name
        channelsData[teamName].pastTeams.push(teamsData[teamName].team);

        //set new name
        teamsData[teamName].team = teamName;
    }
    updateDataFiles(channelsData, teamsData, scrimsData);
    return "Team name set to " + teamName;

}

function newScrim( channel, team1, team2){
    var newScrimID = 's' + (scrimsData.total+1);
    channelsData[channel].currentScrim = newScrimID;
    teamsData[team1].currentScrim = newScrimID;
    if(typeof teamsData[team2] == "undefined"){
        newTeam(team2);
    }
    teamsData[team2].currentScrim = newScrimID;

    scrimsData[newScrimID] = {
        [team1]:{
            "score": 0
        },
        [team2]:{
            "score": 0
        },
        "matches": [],
        "completed": false
    };
    scrimsData.total++;

    updateDataFiles(channelsData, teamsData, scrimsData);

    return "New scrim started";

}

function finishScrim(scrimID, usersTeam, opponentsTeam, channelName){
    if(scrimID == ""){
        return "No Scrims Played";
    }

    if(scrimsData[scrimID].completed === false ){
        channelsData[channelName].pastScrims.push({"scrimID":scrimID, "team":usersTeam });
        teamsData[usersTeam].pastScrims.push(""+scrimID);
        teamsData[opponentsTeam].pastScrims.push(""+scrimID);
        scrimsData[scrimID].completed = true;

        updateDataFiles(channelsData, teamsData, scrimsData);
        return "Scrim Ended";
    } else {
        return "No Active Scrims";
    }
}

function logWin(scrimID, usersTeam){
    if(scrimID == ""){
        return "No Scrims Played";
    }
    scrimsData[scrimID][usersTeam].score++;
    updateDataFiles(channelsData, teamsData, scrimsData);
    return "Win Logged";

}

function logLoss(scrimID, opponentsTeam){
    if(scrimID == ""){
        return "No Scrims Played";
    }
    scrimsData[scrimID][opponentsTeam].score++;
    updateDataFiles(channelsData, teamsData, scrimsData);
    return "Loss Logged";
}

function getScore(scrimID, usersTeam, opponentsTeam){
    if(scrimID == ""){
        return "No Scrims Played";
    }

    if(scrimsData[scrimID].completed == false ){
        var scoreString =   usersTeam + ':' +
                            scrimsData[scrimID][usersTeam].score + ' | ' +
                            opponentsTeam + ':' +
                            scrimsData[scrimID][opponentsTeam].score;
        return scoreString;
    } else {
        var scoreString =   'Series Completed.   ' +
                            usersTeam + ':' +
                            scrimsData[scrimID][usersTeam].score + ' | ' +
                            opponentsTeam + ':' +
                            scrimsData[scrimID][opponentsTeam].score;
        return scoreString;
    }
}

function getAllTeams(){
    var teamNames = [];
    for ( property in teamsData ) {
        teamNames.push(property);
    }

    var teams = teamNames.toString();
    console.log(teams);
    return teams;
}

function getTeams(scrimID){
    var scrim = scrimsData[scrimID];
    var teamNames = [];
    for ( property in scrim) {
        teamNames.push(property);
    }
    return teamNames;
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
    var justChannel = channel.substring(1);

    if(typeof channelsData[justChannel] == "undefined"){
        newChannel(justChannel);
    }

    var currentScrimID = channelsData[justChannel].currentScrim;

    //determing player team and opponent
    var teamName = channelsData[justChannel].team;
    var playerTeam = teamsData[teamName];
    var opponentsTeamName;
    var teamNames = getTeams(currentScrimID);
    for(i=0; i<=1; i++){
        if (teamNames[i] !== playerTeam){
            opponentsTeamName = teamNames[i];
        }
    }

    //mod only:
    if(user["user-type"] === "mod") {}
    
    // Make sure the message is not from the bot..
    if (!self) {
        var split = message.toLowerCase().split(" ");
        if(channelsData[justChannel].team == "" && split[0] !=="!setteam"){
            client.say(channel, "Team must be set using. !setteam");
            return;
        }

        switch (split[0]) {
            case "!commands":
                client.say(channel, "http://prohalostats.com/bot/");
                break;
            case "!join":
                if(join(channel, user)==true){
                    var channelJoin = '#' + user.username;
                    client.join(channelJoin);
                }
                break;
            case "!setteam":
                var newTeamName = message.substring(9);
                setTeam(justChannel, newTeamName);
                break;
            case "!win":
                //
                var result = logWin(currentScrimID, teamName);
                client.say(channel, result);
                break;
            case "!loss":
                //
                var result = logLoss(currentScrimID, opponentsTeamName);
                client.say(channel, result);
                break;
            case "!newseries":
                //
                var newOpponentName = message.substring(11);
                var result = newScrim( justChannel, teamName, newOpponentName);
                client.say(channel, result);
                break;
            case "!finishseries":
                var finishString = finishScrim(currentScrimID, teamName, opponentsTeamName, justChannel);
                client.say(channel, finishString);
                break;
            case "!score":
                //
                var scoreString = getScore(currentScrimID, teamName, opponentsTeamName);
                client.say(channel, scoreString);
                break;
            case "!getteams":
                //
                var teamsString = getAllTeams();
                client.say(channel, teamsString);
                break;
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
