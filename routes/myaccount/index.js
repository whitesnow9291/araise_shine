var express = require('express');
var router = express.Router();
var User = require('../../models/user');
/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('myaccount/index', { title: 'My account' });
});
router.get('/phoneverify', function(req, res, next) {
  var userid = req.session.user.id;
  User.findById(userid, function(err, doc) {
      if (err || !doc) {
          var errors={'result':false,'msg':'User not found for this ID.'};
          return  res.json(errors);
      }
      // If we find the user, let's validate the token they entered
      user = doc;
      res.render('auth/phoneverify', {title: 'phoneverify Page',usertoverify: user});
  });

});
router.get('/setting', function(req, res, next) {
  User.findById(req.session.user.id, function(err, doc) {
      if (err || !doc) {
          var errors={'result':false,'msg':'User not found for this ID.'};
          return  res.json(errors);
      }
      console.log('user_exist_______________________');
      // If we find the user, let's validate the token they entered
      user = doc;

      res.render('myaccount/setting', { title: 'My account setting',usertoverify: user });
  });

});
router.post('/setting', function (req, res, next) {
    var fullname = req.body.fullname;
    var email = req.body.email;
    var oldpassword = req.body.old_password;
    var password = req.body.password;
    var password2 = req.body.password2;
    var newUserlog = {
        id: req.session.user.id,
        fullname: fullname,
        email: email,
        oldpassword: oldpassword,
        password: password
    };
    // Form Validation

    req.checkBody('fullname', 'Name field is required').notEmpty();
    req.checkBody('email', 'Email field is required').notEmpty();
    req.checkBody('email', 'Email not valid').isEmail();
    req.checkBody('old_password', 'Old Password field is required').notEmpty();
    req.checkBody('password', 'Password field is required').notEmpty();
    req.checkBody('password2', 'Password do not match').equals(req.body.password);

    // Check for errors
    var errors = req.validationErrors();

    if (errors) {
        console.log(errors);
        res.render('myaccount/setting', {
            errors: JSON.stringify(errors),
            fullname: fullname,
            email: email,
            password: password,
            password2: password2
        });
    } else {

        var newUser = {
            id: req.session.user.id,
            fullname: fullname,
            email: email,
            oldpassword: oldpassword,
            password: password
        };
        console.log(newUser+"_________________________update");
        // Create User
        User.updateUser(newUser, function (err, user) {
            if (err) {
              var errors=[{'msg':err}];
              res.render('myaccount/setting', {
                  errors: JSON.stringify(errors),
                  fullname: fullname,
                  email: email,
                  password: password,
                  password2: password2
              });
            }else{
              res.render('myaccount/setting', {title: 'Signup Page',success: "Successfully updated!"});
            }
        });
    }
});
module.exports = router;
