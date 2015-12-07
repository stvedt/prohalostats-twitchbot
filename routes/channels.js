var express = require('express');
var helpers = require('../helpers');
var channelsData = require('../data/channels');
var scrimsData = require('../data/scrims');
var teamsData = require('../data/teams');
var router = express.Router();

function shapeViewData(channelName){
    var playerTeam = channelsData[channelName].team;
    var scrim = channelsData[channelName].currentScrim;
    var teams = helpers.getTeams(scrim);

    var opponentsTeam = teams[0];
    if( opponentsTeam == playerTeam) { opponentsTeam = teams[1];}
    var viewData = {
        "player": {
            "teamName" : playerTeam,
            "score": scrimsData[scrim][playerTeam].score
        },
        "opponent" : {
            "teamName" : opponentsTeam,
            "score": scrimsData[scrim][opponentsTeam].score
        }
    }
    return viewData;
}

/* GET home page. */
router.get('/:channelName?/', function(req, res, next) {
    var channelName = req.params.channelName;
    var viewData = shapeViewData(channelName);

  res.render('channel-score', viewData );
});

router.use('/:channelName?/get/',function(req, res, next){
    var channelName = req.params.channelName;
    var viewData = shapeViewData(channelName);
    res.json(viewData);
});

module.exports = router;
