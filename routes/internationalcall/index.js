var express = require('express');
var router = express.Router();
var twilio = require('twilio');
var twilioconf = require('../../config/twilio/twilioconf');
var client = twilio(twilioconf.TWILIO_ACCOUNT_SID, twilioconf.TWILIO_AUTH_TOKEN);
/* GET home page. */
// router.get('/', function(req, res, next) {
//     if (req.session.user) {
//         console.log('internationalcall______________________');
//         res.render('internationalcall/index', { title: 'International Calls'});
//     } else {
//         res.redirect("/auth/login");
//     }
//
// });
// router.post('/call', function(request, response) {
//     console.log('calling...');
//     var twilioNumber = twilioconf.TWILIO_NUMBER;
//     // This should be the publicly accessible URL for your application
//     // Here, we just use the host for the application making the request,
//     // but you can hard code it or use something different if need be
//     var url = 'http://' + request.headers.host + '/internationalcall/outbound/';// + encodeURIComponent(request.body.phoneNumber);
//     console.log(url);
//     client.makeCall({
//         to: request.body.phoneNumber,
//         from: twilioNumber,
//         url: url
//     }, function(err, message) {
//       console.log(url);
//         if (err) {
//             response.status(500).send(err);
//         } else {
//             response.send({
//                 message: 'Thank you! We will be calling you shortly.'
//             });
//         }
//     });
// });
// router.post('/outbound/', function(request, response) {
//     console.log(request.params);
//     var phoneNumber = request.params.phoneNumber;
//     var twimlResponse = new twilio.TwimlResponse();
//
//     twimlResponse.say('Thanks for contacting our sales department. Our ' +
//                       'next available representative will take your call. ',
//                       { voice: 'alice' });
//
//     twimlResponse.dial(phoneNumber);
//
//     response.send(twimlResponse.toString());
// });
module.exports = router;
