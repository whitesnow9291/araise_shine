'use strict';
var express = require('express');
var router = express.Router();
var braintree = require('braintree');
var gateway = require('../../config/braintree/gateway');
var User = require('../../models/user');
var hyperwalletconf = require('../../config/hyperwalletconf');
var TRANSACTION_SUCCESS_STATUSES = [
  braintree.Transaction.Status.Authorizing,
  braintree.Transaction.Status.Authorized,
  braintree.Transaction.Status.Settled,
  braintree.Transaction.Status.Settling,
  braintree.Transaction.Status.SettlementConfirmed,
  braintree.Transaction.Status.SettlementPending,
  braintree.Transaction.Status.SubmittedForSettlement
];

function formatErrors(errors) {
  var formattedErrors = '';

  for (var i in errors) { // eslint-disable-line no-inner-declarations, vars-on-top
    if (errors.hasOwnProperty(i)) {
      formattedErrors += 'Error: ' + errors[i].code + ': ' + errors[i].message + '\n';
    }
  }
  return formattedErrors;
}

function createResultObject(transaction) {
  var result;
  var status = transaction.status;

  if (TRANSACTION_SUCCESS_STATUSES.indexOf(status) !== -1) {
    result = {
      header: 'Sweet Success!',
      icon: 'success',
      message: 'Your test transaction has been successfully processed. See the Braintree API response and try again.'
    };
  } else {
    result = {
      header: 'Transaction Failed',
      icon: 'fail',
      message: 'Your test transaction has a status of ' + status + '. See the Braintree API response and try again.'
    };
  }

  return result;
}


/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('moneytransfer/index', { title: 'Money Transfer' });
});
router.get('/moneytransfer', function(req, res, next) {

      gateway.clientToken.generate({}, function (err, response) {
        var Hyperwallet = require('hyperwallet-sdk');
        var client = new Hyperwallet({ username: hyperwalletconf.username, password: hyperwalletconf.password,
            programToken: hyperwalletconf.programToken });

        client.createUser({
          "clientUserId": Math.random().toString(36).substring(7),
          "profileType": hyperwalletconf.profileType,
          "firstName": "John",
          "lastName": "Deer",
          "dateOfBirth": "1978-01-03",
          "email": Math.random().toString(36).substring(7)+"@hyperwallet.com",
          "addressLine1": "600 Main Street",
          "city": "Los Angeles",
          "stateProvince": "CA",
          "country": "US",
          "postalCode": "90012",
        }, function(error, body) {
          // handle response body here
          console.log(error+"__________error____________");
          console.log(body+"___________body___________");
          if (error){
            res.render('moneytransfer/moneytransfer', {result:false, messages: error});
          }else{
            res.render('moneytransfer/moneytransfer', {result:true,clientToken: response.clientToken, hyperusertoken:body.token,
                                                        hyperun:hyperwalletconf.username,hyperpw:hyperwalletconf.password});
          }
        });
      });
});
router.post('/post_moneytransfer', function (req, res) {//4111111111111111
  var transactionErrors;
  var amount = req.body.amount; // In production you should not take amounts directly from clients
  var nonce = req.body.payment_method_nonce;

  gateway.transaction.sale({
    amount: amount,
    paymentMethodNonce: nonce,
    options: {
      submitForSettlement: true
    }
  }, function (err, result) {
    if (result.success || result.transaction) {
      res.json({"result": "1"});
    } else {
      transactionErrors = result.errors.deepErrors();
      res.json({"result": "-1",msg: formatErrors(transactionErrors)});
    }
  });
});
router.post('/post_hyper_pay', function (req, res) {//4111111111111111
  var hyperwallet_moneytransfer_response = req.body.hyperwallet_moneytransfer_response;
  var hyperusertoken = req.body.hyperusertoken;
  var amount = req.body.amount;
  console.log(hyperwallet_moneytransfer_response);
  var Hyperwallet = require('hyperwallet-sdk');
  var client = new Hyperwallet({ username: hyperwalletconf.username, password: hyperwalletconf.password,
  programToken: hyperwalletconf.programToken });
  console.log(hyperwallet_moneytransfer_response+"-------------------------------------------hyperwallet client");
  client.createPayment({
    "clientPaymentId": Math.random().toString(36).substring(7),
    "amount": amount,
    "currency": hyperwallet_moneytransfer_response.transferMethodCurrency,
    "purpose": "OTHER",
    "destinationToken": hyperusertoken
  }, function(error, body) {
    // handle response body here
    console.log(error+"__________________createpayment error __________________");
    console.log(body+"__________________createpayment body__________________");
    if (error){
      return res.json({'result':'error',msg:error});
    }else{
      return res.json({'result':'success',msg:'successfully transfered'});
    }
  });
});
module.exports = router;
