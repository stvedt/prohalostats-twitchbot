var express = require('express');
var channelsData = require('../data/channels');
var teamsData = require('../data/teams');
var router = express.Router();

/* GET home page. */
router.get('/:channelName?', function(req, res, next) {
	var channelName = req.params.channelName;
	var team = channelsData[channelName].team;
  res.render('channel-score', teamsData[team] );
});

router.use('/:channelName?/get/',function(req, res, next){
	var channelName = req.params.channelName;
	var team = channelsData[channelName].team;
	res.json(teamsData[team]);
});

module.exports = router;
