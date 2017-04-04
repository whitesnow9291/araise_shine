'use strict';

var express = require('express');
var braintree = require('braintree');
var router = express.Router(); // eslint-disable-line new-cap
var gateway = require('../../../config/braintree/gateway');
var User = require('../../../models/user');

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

router.get('/', function (req, res) {
  res.redirect('/myaccount/addfund/checkouts/new');
});

router.get('/checkouts/new', function (req, res) {
  gateway.clientToken.generate({}, function (err, response) {
    res.render('myaccount/checkouts/new', {clientToken: response.clientToken, messages: req.flash('error')});
  });
});

router.get('/checkouts/:id', function (req, res) {
  var result;
  var transactionId = req.params.id;

  gateway.transaction.find(transactionId, function (err, transaction) {
    result = createResultObject(transaction);
    User.findById(req.session.user.id, function(err, doc) {
        if (err || !doc) {
            var errors={'result':false,'msg':'User not found for this ID.'};
            return  res.json(errors);
        }
        console.log('user_exist_______________________');
        // If we find the user, let's validate the token they entered
        var user = doc;
        user.amount = parseFloat(user.amount)+parseFloat(transaction.amount);
        req.session.user.amount = user.amount;
        user.save(function(err,doc){
          if (err){
            res.render('myaccount/checkouts/showerror', {transaction: transaction});
          }else{
            console.log('ok--------------------');
            res.render('myaccount/checkouts/show', {transaction: transaction, result: result});
          }
        });
    });

  });
});

router.post('/checkouts', function (req, res) {//4111111111111111
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
      res.redirect('/myaccount/addfund/checkouts/' + result.transaction.id);
    } else {
      transactionErrors = result.errors.deepErrors();
      req.flash('error', {msg: formatErrors(transactionErrors)});
      res.redirect('/myaccount/addfund/checkouts/new');
    }
  });
});

module.exports = router;
