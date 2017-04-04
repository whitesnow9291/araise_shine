var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('policiesprocedures/index', { title: 'Policies and Procedures' });
});

module.exports = router;
