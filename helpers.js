//DATA
var channelsData = require('./data/channels');
var teamsData = require('./data/teams');
var scrimsData = require('./data/scrims');

module.exports = {
    getTeams: function(scrimID) {
        var scrim = scrimsData[scrimID];
        var teamNames = [];
        for ( property in scrim) {
            teamNames.push(property);
        }
        return teamNames;
    }
};