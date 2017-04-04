(function () {


  var token = clientToken;
  braintree.setup(token, "dropin", {
    container: "bt-dropin",
    onPaymentMethodReceived: function(res){
      var payment_method_nonce=res.nonce;
      var amount = $('#amount').val();
    }
  });
})()
