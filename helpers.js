//DATA
var usersData = require('./data/users');
var teamsData = require('./data/teams');
var scrimsData = require('./data/scrims');

module.exports = {
    getTeams: function(scrimID) {
        var scrim = scrimsData.find(function (res) { return res.id === scrimID; });
        var teamNames = [scrim.team1.name, scrim.team2.name]
        return teamNames;
    }
};