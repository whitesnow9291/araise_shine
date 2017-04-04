// Execute JavaScript on page load
$(function() {
  var callfee = 0;
  var callStatus = $("#call-status");
  var answerButton = $(".answer-button");
  var callSupportButton = $(".call-support-button");
  var hangUpButton = $(".hangup-button");
  var callCustomerButtons = $(".call-customer-button");
    // Initialize phone number text input plugin
    $('#phoneNumber').intlTelInput({
        responsiveDropdown: true,
        autoFormat: true,
        utilsScript: '/intl-phone/libphonenumber/build/utils.js'
    });

    $.post("/internationalcall/token/generate", {page: window.location.pathname}, function(data) {
      // Set up the Twilio Client Device with the token
      Twilio.Device.setup(data.token,{ debug: true, closeProtection: true });
    });

    /* Callback to let us know Twilio Client is ready */
    Twilio.Device.ready(function (device) {
      updateCallStatus("Ready");
    });
    /* Callback for when Twilio Client initiates a new connection */
    Twilio.Device.connect(function (connection) {
      // Enable the hang up button and disable the call buttons
      hangUpButton.prop("disabled", false);
      callCustomerButtons.prop("disabled", true);
      callSupportButton.prop("disabled", true);
      answerButton.prop("disabled", true);

      // If phoneNumber is part of the connection, this is a call from a
      // support agent to a customer's phone
      if ("phoneNumber" in connection.message) {
        updateCallStatus("In call with " + connection.message.phoneNumber);
      } else {
        // This is a call from a website user to a support agent
        updateCallStatus("In call with support");
      }
    });
    Twilio.Device.error(function (error) {
        updateCallStatus("Error: " + error.message);
      });

    Twilio.Device.disconnect(function (conn) {
      hangUpButton.prop("disabled", true);
      callCustomerButtons.prop("disabled", false);
      callSupportButton.prop("disabled", false);
      updateCallStatus("Ready");
      LogCallTrack(conn.parameters.CallSid);
    });
    function callCustomer(phoneNumber) {
      updateCallStatus("Calling " + phoneNumber + "...");

      var params = {"phoneNumber": phoneNumber};
      Twilio.Device.connect(params);
    }
    function updateCallStatus(status) {
      $('#log').text(status);
    }
    // Intercept form submission and submit the form with ajax
    $('button.call').click(function(){
      var phoneNumber = $('#phoneNumber').val();
      callCustomer(phoneNumber);
      // $.post("/internationalcall/getfee", {'phoneNumber': phoneNumber}, function(data) {
      //   // Set up the Twilio Client Device with the token
      //   console.log(data);
      //   if (data.number){
      //       callfee = data.number.outboundCallPrice.currentPrice;
      //       callCustomer(phoneNumber);
      //   }else{
      //     toast.error("Can't get fee of the phone number.Please input number correctly");
      //   }
      //
      // });

    })
    function LogCallTrack(callsid){

      $.post("/internationalcall/getCallTrackbyParentCallid", {'parentcallsid': callsid}, function(data) {
        // Set up the Twilio Client Device with the token
        console.log(data);
        if (data){
            var duration = data.call.duration;
            var price = data.call.price;
            var amount = data.amount;
            $("span.user_amount.value").html(amount);
            toastr.info('Call Price: '+price);
            if (duration==null)
            duration = 0;
            toastr.info('Call Duration: '+duration);
        }else{
          toastr.error("Twilio Connection error!");
        }

      });
    }
    $('button.hangup').click(function(){
      hangUp();
    })


    /* End a call */
    function hangUp() {
      Twilio.Device.disconnectAll();
    }
});
