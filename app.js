var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');

//Routes
var indexRoutes = require('./routes/index');
var channelRoutes = require('./routes/users');

//DATA
var usersData = require('./data/users');
var teamsData = require('./data/teams');
var scrimsData = require('./data/scrims');

var helpers = require('./helpers.js');

var app = express();
app.locals.siteTile = "Pro Halo Stats";

//Twitch Login Auth
var TWITCH_APP_KEYS= require('./keys/twitch-app');
var passport       = require("passport");
var twitchStrategy = require("passport-twitch").Strategy;
 
passport.use(new twitchStrategy({
    clientID: TWITCH_APP_KEYS.client,
    clientSecret: TWITCH_APP_KEYS.secret,
    callbackURL: "http://127.0.0.1:3001/bot/auth/twitch/callback",
    scope: "user_read"
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({ twitchId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));

app.get("/bot/auth/twitch", passport.authenticate("twitch"));
app.get("/bot/auth/twitch/callback", passport.authenticate("twitch", { failureRedirect: "/bot/" }), function(req, res) {
    // Successful authentication, redirect home. 
    res.redirect("/bot/");
});

//Twitch username login key for bot
var TWITCH_OAUTH_KEY = require('./keys/twitch');

//Twitch Bot
function updateDataFiles( updatedusersData , updatedTeamsData, updatedScrimsData ){
  fs.writeFile('./data/users.json', JSON.stringify(updatedusersData, null, 4));
  fs.writeFile('./data/teams.json', JSON.stringify(updatedTeamsData, null, 4));
  fs.writeFile('./data/scrims.json', JSON.stringify(updatedScrimsData, null, 4));
}

function join(channel, user){
    //console.log(channel);
    if(channel == "#norwegiansven"){
        return true;
    }
}

function newChannel(channel){
    usersData.push({
        "name": channel,
        "team": "",
        "pastTeams": [],
        "xuid": "",
        "currentScrim": "",
        "pastScrims": []
    });
    updateDataFiles(usersData, teamsData, scrimsData);
    return "New channel created";
}

function newTeam(teamName){

    teamsData.push({
        "name":teamName,
        "currentScrim": "",
        "pastScrims": []
    });
    updateDataFiles(usersData, teamsData, scrimsData);

    return "Team " +teamName + " created";

}

function setTeam(justUser, teamName){

    if(teamName == "") {
        return "Plass enter team name following command. (ex: !setteam Final Boss)";
    }
    if(typeof teamsData.find(function (res) { return res.name === teamName; }) == "undefined"){
        usersData.find(function (res) { return res.name === justUser; }).team = teamName;

        newTeam(teamName);
    } else {
        //archive old team name
        usersData.find(function (res) { return res.name === justUser; }).pastTeams.push(teamsData.find(function (res) { return res.name === teamName; }).team);

        //set new name
        usersData.find(function (res) { return res.name === justUser; }).team = teamName;
        teamsData.find(function (res) { return res.name === teamName; }).team = teamName;
    }
    updateDataFiles(usersData, teamsData, scrimsData);
    return "Team name set to " + teamName;

}

function newScrim( user, team1, team2){
    var newScrimID = 's' + (scrimsData.length+1);
    usersData.find(function (res) { return res.name === user; }).currentScrim = newScrimID;
    teamsData.find(function (res) { return res.name === team1; }).currentScrim = newScrimID;
    if(typeof teamsData.find(function (res) { return res.name === team2; }) == "undefined"){
        newTeam(team2);
    }
    teamsData.find(function (res) { return res.name === team2; }).currentScrim = newScrimID;

    scrimsData.push({
        "id": newScrimID,
        "team1": {
            "name": team1,
            "score": 0
        },
        "team2": {
            "name": team2,
            "score": 0
        },
        "matches": [],
        "completed": false
    });

    updateDataFiles(usersData, teamsData, scrimsData);

    return "New scrim started";

}

function finishScrim(scrimID, usersTeam, opponentsTeam, usersName){
    if(scrimID == ""){
        return "No Scrims Played";
    }
    var thisScrim = scrimsData.find(function (res) { return res.id === scrimID; });

    if( thisScrim.completed === false ){
        usersData.find(function (res) { return res.name === usersName; }).pastScrims.push({"scrimID":scrimID, "team":usersTeam });
        teamsData.find(function (res) { return res.name === usersTeam; }).pastScrims.push(""+scrimID);
        teamsData.find(function (res) { return res.name === opponentsTeam; }).pastScrims.push(""+scrimID);
        thisScrim.completed = true;

        updateDataFiles(usersData, teamsData, scrimsData);
        return "Scrim Ended";
    } else {
        return "No Active Scrims";
    }
}

function logWin(scrimID, usersTeam){
    if(scrimID == ""){
        return "No Scrims Played";
    }

    var thisScrim = scrimsData.find(function (res) { return res.id === scrimID; });

    if( thisScrim.completed == true ){
        return "Scrim Has Ended";
    }

    if( thisScrim.team1.name === usersTeam){
        thisScrim.team1.score++;
    } else {
        thisScrim.team2.score++;
    }

    updateDataFiles(usersData, teamsData, scrimsData);
    return "Win Logged";

}

function logLoss(scrimID, opponentsTeam){
    if(scrimID == ""){
        return "No Scrims Played";
    }

    var thisScrim = scrimsData.find(function (res) { return res.id === scrimID; });

    if( thisScrim.completed == true ){
        return "Scrim Has Ended";
    }
    if( thisScrim.team1.name === opponentsTeam){
        thisScrim.team1.score++;
    } else {
        thisScrim.team2.score++;
    }
    updateDataFiles(usersData, teamsData, scrimsData);
    return "Loss Logged";
}

function getScore(scrimID, usersTeam, opponentsTeam){
    if(scrimID == ""){
        return "No Scrims Played";
    }

    var thisScrim = scrimsData.find(function (res) { return res.id === scrimID; });

    if( thisScrim.team1.name === usersTeam){
        usersTeam = 'team1';
        opponentsTeam = 'team2';
    } else {
        usersTeam = 'team2';
        opponentsTeam = 'team1';
    }

    if( thisScrim.completed == false ){
        var scoreString =   thisScrim[usersTeam].name + ':' +
                            thisScrim[usersTeam].score + ' | ' +
                            thisScrim[opponentsTeam].name + ':' +
                            thisScrim[opponentsTeam].score;
        return scoreString;
    } else {
        var scoreString =   'Series Completed.   ' +
                            thisScrim[usersTeam].name + ':' +
                            thisScrim[usersTeam].score  + ' | ' +
                            thisScrim[opponentsTeam].name + ':' +
                            thisScrim[opponentsTeam].scoreString;
        return scoreString;
    }
}

function getAllTeams(){
    var teamNames = teamsData.map(function(team){ return team.name; });
    var teams = teamNames.toString();
    return teams;
}

// Do NOT include this line if you are using the built js version!
var irc = require("tmi.js");

var chatChannels = ["#norwegiansven"];
if (app.get('env') === 'development') {
    chatChannels = ["#svenhalo"];
}

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
    channels: chatChannels
};

var client = new irc.client(options);
client.on("chat", function(channel, user, message, self) {    
    var justUser = channel.substring(1);

    if(typeof usersData.find(function (res) { return res.name === justUser; }) == "undefined"){
        newChannel(justUser);
        return;
    }

    var currentScrimID = usersData.find(function (res) { return res.name === justUser; }).currentScrim;

    //determing player team and opponent
    var teamName = usersData.find(function (res) { return res.name === justUser; }).team;
    var playerTeam = teamsData.find(function (res) { return res.name === teamName; });
    var opponentsTeamName, teamNames;

    if(currentScrimID !== ""){
        teamNames = helpers.getTeams(currentScrimID);
        for(i=0; i<=1; i++){
            if (teamNames[i] !== playerTeam){
                opponentsTeamName = teamNames[i];
            }
        }
    }

    //mod only:
    if(user["user-type"] === "mod") {}

        console.log( user );
    
    // Make sure the message is not from the bot..
    if (!self) {
        var split = message.toLowerCase().split(" ");
        if(usersData.find(function (res) { return res.name === justUser; }).team == "" && split[0] !=="!setteam" && user.username == justUser){
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
                var result = setTeam(justUser, newTeamName);
                client.say(channel, result);
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
                var result = newScrim( justUser, teamName, newOpponentName);
                client.say(channel, result);
                break;
            case "!finishseries":
                var finishString = finishScrim(currentScrimID, teamName, opponentsTeamName, justUser);
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
app.use('/bot/user', channelRoutes);

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
    console.log('dev');
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
