var express = require('express');
var data = require('../data/channels');
var router = express.Router();

/* GET home page. */
router.get('/:channelName?', function(req, res, next) {
	var channelName = req.params.channelName;
  res.render('channel-score', data[channelName] );
});

router.use('/:channelName?/get/',function(req, res, next){
	var channelName = req.params.channelName;
	res.json(data[channelName]);
});

module.exports = router;
