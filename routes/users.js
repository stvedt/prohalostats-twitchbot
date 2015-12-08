var express = require('express');
var helpers = require('../helpers');
var usersData = require('../data/users');
var scrimsData = require('../data/scrims');
var teamsData = require('../data/teams');
var router = express.Router();

function shapeScoreViewData(userName){

    var thisUser = usersData.find(function (res) { return res.name === userName; });
    var usersTeam = thisUser.team;
    var opponentsTeam;
    var scrimID = thisUser.currentScrim;
    var teams = helpers.getTeams(scrimID);
    var scrim = scrimsData.find(function (res) { return res.id === scrimID; })

    if( scrim.team1.name === usersTeam){
        usersTeam = 'team1';
        opponentsTeam = 'team2';
    } else {
        usersTeam = 'team2';
        opponentsTeam = 'team1';
    }
   
    var viewData = {
        "player": {
            "teamName" : scrim[usersTeam].name,
            "score": scrim[usersTeam].score
        },
        "opponent" : {
            "teamName" : scrim[opponentsTeam].name,
            "score": scrim[opponentsTeam].score
        }
    }
    return viewData;
}

/* GET home page. */
router.use('/:userName?/', function(req, res, next) {
	res.render('user', viewData );
});

router.get('/:userName?/score/', function(req, res, next) {
    var userName = req.params.userName;
    var viewData = shapeScoreViewData(userName);

  res.render('user-score', viewData );
});

router.use('/:userName?/score/get/',function(req, res, next){
    var userName = req.params.userName;
    var viewData = shapeScoreViewData(userName);
    res.json(viewData);
});

module.exports = router;
