$(function(){
  $('#phoneNumber').intlTelInput({
      responsiveDropdown: true,
      autoFormat: true,
      utilsScript: '/intl-phone/libphonenumber/build/utils.js'
  });
  $('label.token_label').hide();
  $('input.token').hide();
  $('.btn_sendcode').click(function(){
    var id = $('#userid').val();
    var countryData = $("#phoneNumber").intlTelInput("getSelectedCountryData");
    var phoneNumber = $("#phoneNumber").val();
    // $('label.token_label').show();
    // $('input.token').show();
    $.ajax({
        url: '/auth/sendAuthyToken',
        type : 'GET',
        dataType: 'json',
        data: {
            userid:id,
            phoneNumber:phoneNumber,
            countryCode:countryData.dialCode
        },
        success:function(json){
          if (json.result){
            $('label.token_label').show();
            $('input.token').show();
            toastr.success(json.msg);
          }else{

            toastr.error(json.msg);
          }
        }
    });

  })
  $('.btn_sendcodecall').click(function(){
    var id = $('#userid').val();
    var countryData = $("#phoneNumber").intlTelInput("getSelectedCountryData");
    var phoneNumber = $("#phoneNumber").val();
    // $('label.token_label').show();
    // $('input.token').show();
    $.ajax({
        url: '/auth/sendAuthyTokenCall',
        type : 'GET',
        dataType: 'json',
        data: {
            userid:id,
            phoneNumber:phoneNumber,
            countryCode:countryData.dialCode
        },
        success:function(json){
          if (json.result){
            $('label.token_label').show();
            $('input.token').show();
            toastr.success(json.msg);
          }else{

            toastr.error(json.msg);
          }
        }
    });

  })
  // Intercept form submission and submit the form with ajax
  $('.btn_verifycode').click(function(){
    if ($("input.token").is(":hidden")){
      toastr.warning("Enter your phone number and send code");
      return;
    }
    var token = $("input.token").val();
    var id = $('#userid').val();
    $.ajax({
        url: '/auth/phoneverify',
        type : 'POST',
        dataType: 'json',
        data: {
            userid:id,
            token:token
        },
        success:function(json){
          if (json.result){
           window.location.href = '/';
          }else{
            toastr.warning(json.msg);
          }

        }
    });

  })
})
