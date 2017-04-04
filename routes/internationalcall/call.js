var express = require('express');
var router = express.Router();
var twilio = require('twilio');
var twilioconf = require('../../config/twilio/twilioconf');
var twilioclient = require('twilio')(twilioconf.TWILIO_ACCOUNT_SID,
      twilioconf.TWILIO_AUTH_TOKEN);
var User = require('../../models/user');
// POST /calls/connect
var userid = null;
router.get('/', function(req, res, next) {

    if (req.session.user) {
        userid  = req.session.user.id;
        console.log('internationalcall______________________');
        res.render('internationalcall/index', { title: 'International Calls'});
    } else {
        res.redirect("/auth/login");
    }

});
router.post('/connect', twilio.webhook({validate: false}), function(req, res, next) {console.log('internationalcall_connect');

  var phoneNumber = req.body.phoneNumber;
  var callerId = twilioconf.TWILIO_NUMBER;
  var twiml = new twilio.TwimlResponse();
  var statusCallbackUrl = 'http://' + req.headers.host + '/internationalcall/statusCallback/';
  var numberDialer = function(dial) {
      dial.number(phoneNumber,{
          statusCallbackEvent: 'initiated ringing answered completed',
          statusCallback: statusCallbackUrl,
          statusCallbackMethod: 'POST'
      });
  };
  var clientDialer = function(dial) {
      dial.client("support_agent");
  };
  getFee(phoneNumber,function (fee) {

      User.findById(userid, function(err, doc) {
          // if (err || !doc) {
          //     var errors={'result':false,'msg':'User not found for this ID.'};
          //     return  res.json(errors);
          // }
          // console.log('user_exist_______________________');
          // If we find the user, let's validate the token they entered
          var user = doc;
          var amount = parseFloat(user.amount);
          var timeLimit =parseInt(parseFloat(amount) / parseFloat(fee.outboundCallPrice.basePrice));
          if (timeLimit>4*60){
              timeLimit = 4*60*3600;
          }else{
              timeLimit = timeLimit*60;
          }
          console.log(timeLimit);
          twiml.dial({callerId : callerId,timeLimit:timeLimit}, numberDialer);
          res.send(twiml.toString());
      });
  })

});
router.post('/getfee',function(req,res,next){

  var phoneNumber = req.body.phoneNumber;

})
function getFee(phoneNumber,cb){
    var PricingClient = require('twilio').PricingClient;
    var client = new PricingClient(twilioconf.TWILIO_ACCOUNT_SID,
        twilioconf.TWILIO_AUTH_TOKEN);
    var tophone = phoneNumber.replace(/\s/g,'');
    console.log(client+"____________________________");
    client.voice.numbers(tophone).get(function(err, phonenumberfee) {
        cb(phonenumberfee);
        // res.setHeader('Content-Type', 'application/json');
        // res.send(JSON.stringify({ number: number }));
    });
}
router.post('/statusCallback',function(req,res,next){
  var status = req.body.CallStatus;
  var callsid = req.body.CallSid;
  console.log(callsid+'-------------------call status-------------------');
  if (status=='completed'){  //completed
    getCallTrack(callsid,function(call){
        console.log(call.duration+"__________________call completed duration");
        console.log(call.price+"___________________call completed price");
        User.findById(userid, function(err, doc) {
            // if (err || !doc) {
            //     var errors={'result':false,'msg':'User not found for this ID.'};
            //     return  res.json(errors);
            // }
            // console.log('user_exist_______________________');
            // If we find the user, let's validate the token they entered
            var user = doc;
            console.log(user.amount+"_________________________user_current_amount_before_call");
            console.log(call.price+"_________________________fee price for user amount");
            console.log(parseFloat(call.price)+"_________________________fee price for user amount float");
            user.amount = parseFloat((parseFloat(user.amount)+parseFloat(call.price)).toFixed(12));
            console.log(user.amount+"_________________________user amount after call completed for database update");
            user.save(function(err,doc){
                // if (err){
                //     res.render('myaccount/checkouts/showerror', {transaction: transaction});
                // }else{
                //     console.log('ok--------------------');
                //     res.render('myaccount/checkouts/show', {transaction: transaction, result: result});
                // }
            });
        });
    })
  }
});
function getCallTrack(callid, cb){
  twilioclient.calls(callid).get(function(err, call) {
      cb(call);
  });
}

router.post('/getCallTrackbyParentCallid',function(req,res,next){
  var parentcallsid = req.body.parentcallsid;
  twilioclient.calls.list({ parentCallSid: parentcallsid }, function(err, data) {
    data.calls.forEach(function(call) {
        console.log(call.sid);
        console.log(call.price+"______________________parent call price");
        req.session.user.amount =parseFloat((parseFloat(req.session.user.amount)+parseFloat(call.price)).toFixed(12)); //attention call.price is negative value
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({call:call,amount:req.session.user.amount}));
      });
  });
})
module.exports = router;
