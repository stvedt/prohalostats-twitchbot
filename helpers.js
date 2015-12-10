//DATA
var usersData = require('./data/users');
var teamsData = require('./data/teams');
var scrimsData = require('./data/scrims');

module.exports = {
    getTeams: function(scrimID) {
        var scrim = scrimsData.find(function (res) { return res.id === scrimID; });
        var teamNames = [scrim.team1.name, scrim.team2.name]
        return teamNames;
    },
    checkCommandDelay: function(commandLastRan){
        var timeNow = Date.now();
        var delay = 5 * (60 * 1000); //time is in miliseconds
        commandLastRanDelay = commandLastRan + delay;
        if ( timeNow <= commandLastRanDelay ){
            return true;
        } else {
            return false;
        }
    }
};