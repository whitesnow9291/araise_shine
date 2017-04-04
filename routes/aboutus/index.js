var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('aboutus/index', { title: 'About US' });
});

module.exports = router;
