const express = require('express');

const controller = require('./controller/index');

const router = express.Router();

router.get('/matches', controller.getMatches);
router.get('/past-games', controller.getPastGames);

module.exports = router;
