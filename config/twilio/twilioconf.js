'use strict';

require('dotenv').load();

	// See your account sid & auth token: https://www.twilio.com/user/account/settings
	// See your phone number: https://www.twilio.com/user/account/phone-numbers/incoming
var twilioconf={
		'TWILIO_ACCOUNT_SID':'AC0bde6cbcccc699f78762638d2bec4319',
		'TWILIO_AUTH_TOKEN':'ffa96d6d42cff73ba7fb771fb9317744',
		'TWILIO_APP_SID':'AP12e72df8aa1434b5a1e54dac34050ccd',
		'TWILIO_NUMBER':'+13523645728'
	}
// var twilioconf={
// 		'TWILIO_ACCOUNT_SID':'ACa58aa6cb2ab4382a42edf7339530654d',
// 		'TWILIO_AUTH_TOKEN':'8606234233c36adec84c537100d57c28',
// 		'TWILIO_APP_SID':'APd7fd882fd6b0415d8040ed8df6b54f45',
// 		'TWILIO_NUMBER':'+14253203470'
// 	}
module.exports = twilioconf;
