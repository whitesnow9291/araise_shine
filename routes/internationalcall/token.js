var express = require('express');
var router = express.Router();
var twilio = require('twilio');
var twilioconf = require('../../config/twilio/twilioconf');
// GET /token/generate
router.post('/generate', function (req, res) {
  var page = req.body.page;

  var capability = new twilio.Capability(
      twilioconf.TWILIO_ACCOUNT_SID,
      twilioconf.TWILIO_AUTH_TOKEN
  );
  capability.allowClientOutgoing(twilioconf.TWILIO_APP_SID);
  capability.allowClientIncoming(page == "/dashboard"? "support_agent" : "customer");

  var token = capability.generate();
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ token: token }));
});

module.exports = router;
