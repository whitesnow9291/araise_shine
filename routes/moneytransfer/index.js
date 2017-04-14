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
var trans_data = {};
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
router.get('/step1', function(req, res, next) {
  req.session.trans = {};

  //console.log(req.session.trans.trans_amount);
  res.render('moneytransfer/step1');
      // gateway.clientToken.generate({}, function (err, response) {
      //   var Hyperwallet = require('hyperwallet-sdk');
      //   var client = new Hyperwallet({ username: hyperwalletconf.username, password: hyperwalletconf.password,
      //       programToken: hyperwalletconf.programToken });
      //
      //   client.createUser({
      //     "clientUserId": Math.random().toString(36).substring(7),
      //     "profileType": hyperwalletconf.profileType,
      //     "firstName": "John",
      //     "lastName": "Deer",
      //     "dateOfBirth": "1978-01-03",
      //     "email": Math.random().toString(36).substring(7)+"@hyperwallet.com",
      //     "addressLine1": "600 Main Street",
      //     "city": "Los Angeles",
      //     "stateProvince": "CA",
      //     "country": "US",
      //     "postalCode": "90012",
      //   }, function(error, body) {
      //     // handle response body here
      //     console.log(error+"__________error____________");
      //     console.log(body+"___________body___________");
      //     if (error){
      //       res.render('moneytransfer/moneytransfer', {result:false, messages: error});
      //     }else{
      //       res.render('moneytransfer/moneytransfer', {result:true,clientToken: response.clientToken, hyperusertoken:body.token,
      //                                                   hyperun:hyperwalletconf.username,hyperpw:hyperwalletconf.password});
      //     }
      //   });
      // });
});
router.post('/step1', function(req, res) {
  var trans_amount = req.body.trans_amount;

  req.checkBody('trans_amount', 'Amount is required').notEmpty();
  req.checkBody('trans_amount', 'Amount must be an integer great than Zero').gte(1);
  // Check for errors
  var errors = req.validationErrors();

  if (errors) {
      console.log(errors);
      res.render('moneytransfer/step1', {
          errors: JSON.stringify(errors),
          trans_amount: trans_amount
      });
  } else{
    console.log("------------------------trans_amount------------------------");
    console.log(req.body.trans_amount);
    trans_data.trans_amount = trans_amount;
    res.render('moneytransfer/step2');
  }
});
router.post('/step2', function(req, res) {
  var firstName = req.body.firstName;
  var lastName = req.body.lastName;
  var email = req.body.email;
  var dateOfBirth = req.body.dateOfBirth;
  var country = req.body.country;
  var stateProvince = req.body.stateProvince;
  var addressLine1 = req.body.addressLine1;
  var city = req.body.city;
  var postalCode = req.body.postalCode;
  trans_data.recipient = {
    'firstName':firstName,
    'lastName':lastName,
    'email':email,
    'dateOfBirth' : dateOfBirth,
    'country' :country,
    'stateProvince' : stateProvince,
    'addressLine1' : addressLine1,
    'city': city,
    'postalCode' : postalCode
  }
  console.log(req.session.trans.recipient);
  var Hyperwallet = require('hyperwallet-sdk');
  var client = new Hyperwallet({ username: hyperwalletconf.username, password: hyperwalletconf.password,
      programToken: hyperwalletconf.programToken });
  client.createUser({
    "clientUserId": Math.random().toString(36).substring(7),
    "profileType": hyperwalletconf.profileType,
    "firstName": trans_data.recipient.firstName,
    "lastName": trans_data.recipient.lastName,
    "dateOfBirth": trans_data.recipient.dateOfBirth,
    "email": Math.floor(Math.random() * (1000000000 - 1)) + 1+"testmail@hyperwallet.com",//trans_data.recipient.email,
    "addressLine1": trans_data.recipient.addressLine1,
    "city": trans_data.recipient.city,
    "stateProvince": trans_data.recipient.stateProvince,
    "country": trans_data.recipient.country,
    "postalCode": trans_data.recipient.postalCode,
  }, function(error, body) {
    // handle response body here
    console.log(error);

    if (error){
      return res.render('moneytransfer/step2',{'result':'false',errors:JSON.stringify(error)});
    }else{
      trans_data.moneytransfer_usertoken = body.token;
      return res.redirect('/moneytransfer/step4');
    }
  });
});
router.post('/step3',function(req,res){
  trans_data.moneytransfer_method=req.body.moneytransfer_method;
  trans_data.moneytransfer_token=req.body.moneytransfer_token;
  console.log('trans_data============================');
  console.log(trans_data.moneytransfer_method);
  console.log(trans_data.moneytransfer_token);
  return res.json({result:true});
});
router.get('/step5',function(req,res){
  return res.render('moneytransfer/step5', {
      'trans_data':trans_data
  });
});
router.get('/step4', function(req, res) {
  console.log('----------step4----------');
  User.findById(req.session.user.id, function(err, user) {
      if (err || !user) {console.log(err);
          return res.render('moneytransfer/step_error', {'errors':err});
      }

      if (!user.customerId) {
          gateway.clientToken.generate({}, function (err, response) {
            if (err) {
              return res.render('moneytransfer/step_error', {errors:err});
            }
            return res.render('moneytransfer/step4_create', {result:true,clientToken: response.clientToken});
          });
      } else {
          gateway.customer.find(user.customerId, function(err, customer) {
              if (err) {
                  return res.render('moneytransfer/step_error', {errors:err});
              }
              console.log('customer info----------------------------------------------------');

              return res.render('moneytransfer/step4_update', {
                  "result":"success",
                  "customerId":user.customerId,
                  "customer":customer
              });
          });
      }
  });
});
router.get('/step4_create', function(req, res) {
  gateway.clientToken.generate({}, function (err, response) {
    if (err) {
      return res.render('moneytransfer/step_error', {errors:err});
    }
    return res.render('moneytransfer/step4_create', {result:true,clientToken: response.clientToken});
  });
});
router.post('/step4', function(req, res) {
    console.log('----------step4 create post----------');
  trans_data.payment_note = {
    'addressLine1':req.body.addressLine1,
    'addressLine2':req.body.addressLine2,
    'city':req.body.city,
    'stateProvince':req.body.stateProvince,
    'postalCode':req.body.postalCode,
    'country':req.body.country,
  }
  User.findById(req.session.user.id, function (err, user) {
      if (err || !user) {
            return res.render('moneytransfer/step_error', {errors:err});
      }
console.log('create_______________________');
      if (!user.customerId) {console.log('user exist_______________________');
          gateway.customer.create({
              phone: user.phone,
              creditCard:{
                paymentMethodNonce: req.body.payment_method_nonce,
                options:{
                  verifyCard: true
                }
              }

          }, function (err, result1) {
console.log('create customer id_______________________');
              if (err) {
                return res.render('moneytransfer/step_error', {errors:err});
              }

              if (result1.success == true) {console.log('db save_______________________');
                  user.customerId = result1.customer.id;
                  user.braintreePaymentToken = result1.customer.paymentMethods[0].token;
                  user.save(function(err, doc) {
                      if (err) {
                        return res.render('moneytransfer/step_error', {errors:err});
                      }
                      goStep2();
                  });
                }
              });
      } else {
console.log('customer id update_______________________');
          gateway.customer.update(user.customerId, {
              phone: user.phone,
              phone: user.phone,
              creditCard:{
                paymentMethodNonce: req.body.payment_method_nonce,
                options:{
                  verifyCard: true
                }
              }
          }, function (err, result1) {console.log('update result before_______________________');
            if (err) {
              return res.render('moneytransfer/step_error', {errors:err});
            }
console.log('update result_______________________');
            if (result1.success == true) {
                user.customerId = result1.customer.id;
                user.braintreePaymentToken = result1.customer.paymentMethods[0].token;console.log('db save_______________________');
                user.save(function(err, doc) {
                    if (err) {
                        return res.render('moneytransfer/step_error', {errors:err});
                    }
                    goStep2();
                });
              }
          });
      }
  });
  function goStep2(){
    User.findById(req.session.user.id, function(err, user) {
        if (err || !user) {console.log(err);
            return res.render('moneytransfer/step_error', {'errors':err});
        }
        if (!user.customerId) {
            return res.render('moneytransfer/step_error', {'errors':"customer didn't registered"});
        } else {
            gateway.customer.find(user.customerId, function(err, customer) {
                if (err) {
                    return res.render('moneytransfer/step_error', {errors:err});
                }
                console.log('customer info----------------------------------------------------');
                trans_data.payment_data = customer;
                console.log(trans_data);
                return res.render('moneytransfer/step3', {result:true, hyperusertoken:trans_data.moneytransfer_usertoken,hyperun:hyperwalletconf.username,hyperpw:hyperwalletconf.password});
            });
        }
    });
  }
});
router.post('/step4_update', function(req, res) {
    console.log('----------step4 post----------');
    trans_data.payment_note = {
      'addressLine1':req.body.addressLine1,
      'addressLine2':req.body.addressLine2,
      'city':req.body.city,
      'stateProvince':req.body.stateProvince,
      'postalCode':req.body.postalCode,
      'country':req.body.country,
    }
    User.findById(req.session.user.id, function(err, user) {
        if (err || !user) {console.log(err);
            return res.render('moneytransfer/step_error', {'errors':err});
        }
        if (!user.customerId) {
            return res.render('moneytransfer/step_error', {'errors':"customer didn't registered"});
        } else {
            gateway.customer.find(user.customerId, function(err, customer) {
                if (err) {
                    return res.render('moneytransfer/step_error', {errors:err});
                }
                console.log('customer info----------------------------------------------------');
                trans_data.payment_data = customer;
                console.log(trans_data);
                return res.render('moneytransfer/step3', {result:true, hyperusertoken:trans_data.moneytransfer_usertoken,hyperun:hyperwalletconf.username,hyperpw:hyperwalletconf.password});
            });
        }
    });
});
router.post('/step5', function(req, res) {
  console.log('step5'+"----------------------------------");
  trans_data.payment_data.cvv =  req.body.cvv;
  console.log("----------------------------------");
  gateway.transaction.sale({
      amount: trans_data.trans_amount,
      paymentMethodToken: trans_data.payment_data.creditCards[0].token,
      creditCard: {
        cvv: req.body.cvv
      },
      options: {
          submitForSettlement: true,
      }
  }, function (err, result2) {
    console.log(err);
      if (err) {
        return res.render('moneytransfer/step5', {
            'trans_data':trans_data,
            'errors':JSON.stringify(err)
        });
      }
      console.log(result2);
      if (result2.success == true) {
          console.log('brintree success'+"----------------------------------");
          var hyperwallet_moneytransfer_response = trans_data.moneytransfer_token;
          var hyperusertoken = trans_data.moneytransfer_usertoken;
          var amount = trans_data.trans_amount;
          console.log(hyperwallet_moneytransfer_response);
          var Hyperwallet = require('hyperwallet-sdk');
          var client = new Hyperwallet({ username: hyperwalletconf.username, password: hyperwalletconf.password,
          programToken: hyperwalletconf.programToken });
          console.log("-------------------------------------------hyperwallet_moneytransfer_response");
          var notes = trans_data.payment_note.addressLine1 + trans_data.payment_note.addressLine2 + trans_data.payment_note.city + trans_data.payment_note.stateProvince +
          trans_data.payment_note.postalCode + trans_data.payment_note.country;
          client.createPayment({
            "clientPaymentId": Math.random().toString(36).substring(7),
            "amount": amount,
            "currency": "USD",//hyperwallet_moneytransfer_response.transferMethodCurrency,
            "purpose": "GP0003",
            "notes" : notes,
            "destinationToken": hyperusertoken
          }, function(error, body) {
            // handle response body here
            if (error){
              console.log(error);
              console.log('error _________________________________________');
              return res.render('moneytransfer/step_error');
              // return res.render('moneytransfer/step5', {
              //     'trans_data':trans_data,
              //     'error_hyper':JSON.stringify(error)
              // });
            }else{
              console.log('body _________________________________________');
              console.log(body);
              return res.render('moneytransfer/step_complete');
            }
          });
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
