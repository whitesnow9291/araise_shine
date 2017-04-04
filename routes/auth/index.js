
var express = require('express');
var router = express.Router();
// var passport = require('passport');
// var LocalStrategy = require('passport-local').Strategy;
var User = require('../../models/user');

var auth = require('../../config/auth');
// Create authenticated Authy and Twilio API clients
var authy = require('authy')(auth.AUTHY_API_KEY);

var twilioconf = require('../../config/twilio/twilioconf');
var twilioClient = require('twilio')(twilioconf.TWILIO_ACCOUNT_SID, twilioconf.TWILIO_AUTH_TOKEN);

/* GET home page. */
router.get('/login', function (req, res, next) {
    res.render('auth/login', {title: 'Login Page'});
});

router.post('/login', function(req,res){
    var email = req.body.email;
    var password = req.body.password;
    req.checkBody('email', 'Email field is required').notEmpty();
    req.checkBody('email', 'Email not valid').isEmail();
    req.checkBody('password', 'Password field is required').notEmpty();

    // Check for errors
    var errors = req.validationErrors();

    if (errors) {
        console.log(errors);
        res.render('auth/login', {
            errors: JSON.stringify(errors),
            email: email,
            password: password
        });
    } else{
    User.getUserByUserEmail(email, function(err, user){
        if(err) throw err;
        if(!user){
            var errors = [{'msg':'Unregistered account.'}]
            res.render('auth/login', {
                errors: JSON.stringify(errors),
                email: email,
                password: password
            });
            return;
        }
        User.comparePassword(password, user.password, function(err, isMatch){
            if(err) throw err;
            if(isMatch){
              if (user.verified == 'true') {
                req.session.user = {'id':user._id,'amount':user.amount};
                res.redirect('/');
              }else{
                res.render('auth/phoneverify', {title: 'phoneverify Page',usertoverify: user});
              }
            } else {
              var errors = [{'msg':'Incorrect password.'}]
              res.render('auth/login', {
                  errors: JSON.stringify(errors),
                  email: email,
                  password: password
              });
              return;
            }
        });
    });
  }
});
router.get('/signup', function (req, res, next) {
    res.render('auth/signup', {title: 'Signup Page'});
});
// router.post('/signup', passport.authenticate('local-signup', {
//   successRedirect : '/profile', // redirect to the secure profile section
//   failureRedirect : '/auth/signup', // redirect back to the signup page if there is an error
//   failureFlash : true // allow flash messages
// }));
router.post('/signup', function (req, res, next) {
    var fullname = req.body.fullname;
    var email = req.body.email;
    var password = req.body.password;
    var password2 = req.body.password2;

    // Form Validation

    req.checkBody('fullname', 'Name field is required').notEmpty();
    req.checkBody('email', 'Email field is required').notEmpty();
    req.checkBody('email', 'Email not valid').isEmail();
    req.checkBody('password', 'Password field is required').notEmpty();
    req.checkBody('password2', 'Password do not match').equals(req.body.password);

    // Check for errors
    var errors = req.validationErrors();

    if (errors) {
        console.log(errors);
        res.render('auth/signup', {
            errors: JSON.stringify(errors),
            fullname: fullname,
            email: email,
            password: password,
            password2: password2
        });
    } else {

        var newUser = new User({
            fullname: fullname,
            email: email,
            password: password
        });
        // Create User
        User.createUser(newUser, function (err, user) {
            if (err) {
              var errors=[{'msg':err}];
              res.render('auth/signup', {
                  errors: JSON.stringify(errors),
                  fullname: fullname,
                  email: email,
                  password: password,
                  password2: password2
              });
            }else{
              console.log('----------------------createUser-------------------------');
              console.log(user);
              console.log('----------------------createUser end---------------------');
              res.render('auth/phoneverify', {title: 'Signup Page',usertoverify: user});
            }
        });
    }
});
router.get('/sendAuthyToken', function (req, res, next) {
  var id = req.query.userid;
  var phoneNumber = req.query.phoneNumber;
  var countryCode = req.query.countryCode;console.log(phoneNumber);
  User.sendAuthyToken(id,phoneNumber,countryCode,function(err) {
      if (err) {
          var errors={'result':false,'msg':'There was a problem sending your token - sorry :('};
          return  res.json(errors);
      }else{
        var errors={'result':true,'msg':'We have just sent auth code to your phone successfully'};
        return  res.json(errors);
      }

      // Send to token verification page

  })
});
router.get('/sendAuthyTokenCall', function (req, res, next) {
  var id = req.query.userid;
  var phoneNumber = req.query.phoneNumber;
  var countryCode = req.query.countryCode;console.log(phoneNumber);
  User.sendAuthyTokenCall(id,phoneNumber,countryCode,function(err) {
      if (err) {
          var errors={'result':false,'msg':'There was a problem sending your token - sorry :('};
          return  res.json(errors);
      }else{
        var errors={'result':true,'msg':'We have just sent auth code to your phone successfully'};
        return  res.json(errors);
      }

      // Send to token verification page

  })
});
router.get('/signout', function (req, res) {
    delete req.session.user;
    res.redirect('/');
});

router.post('/phoneverify', function (req, res, next) {
  var user;
  var userid = req.body.userid;
  var token = req.body.token;
  console.log(token+"_______token________________")
  // Load user model
  User.findById(userid, function(err, doc) {
      if (err || !doc) {
          var errors={'result':false,'msg':'User not found for this ID.'};
          return  res.json(errors);
      }
      console.log('user_exist_______________________');
      // If we find the user, let's validate the token they entered
      user = doc;
      authy.verify(user.authyId, token, function(err, response) {
          console.log('verify_complete by authy__________________________');
          console.log(err+"err");
          postVerify(err);
      });
  });

  // Handle verification response
  function postVerify(err) {
      console.log(err+"err of verification_________________");
      if (err) {
          var errors={'result':false,'msg':'The token you entered was invalid - please retry.'};
          return  res.json(errors);
      }
      console.log('verified_ok________________________');
      // If the token was valid, flip the bit to validate the user account
      user.verified = true;
      user.save(postSave);
  }

  // after we save the user, handle sending a confirmation
  function postSave(err) {
      if (err) {
          var errors={'result':false,'msg':'There was a problem validating your account '
              + '- please enter your token again.'};
          return  res.json(errors);
      }
      req.session.user = {'id':user._id,'amount':user.amount};
      console.log('save verification ok_________________________');
      var errors={'result':true,'msg':'You did it! Signup complete :)'};
      return  res.json(errors);
      // Send confirmation text message
      // var message = 'You did it! Signup complete :)';
      // var tophone = user.phone.replace(/\s/g,'');
      //
      // twilioClient.sendMessage({
      //     to: tophone,
      //     from: twilioconf.TWILIO_NUMBER,
      //     body: message
      // }, function(err, response) {
      //   var error = "You did it! Signup complete :)";
      //   var result = true;
      //   if (err) {
      //     error='You are signed up, but '
      //         + 'we could not send you a message. Our bad :(';
      //     result = false;
      //   }
      //   console.log('send message ok______________________________');
      //   return res.json({result:result,msg:error});
      // });
  }

  // respond with an error
  function die(message) {
      req.flash('errors', message);
      response.redirect('/users/'+req.body.id+'/verify');
  }

});

module.exports = router;
