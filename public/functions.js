function copyToClipboard(text) {
  // Create a temporary textarea element
  var $textarea = $("<textarea>");
  $textarea.val(text);
  $("body").append($textarea);
  $textarea.select();
  document.execCommand("copy");
  $textarea.remove();
}
$("#message").hide();
$("#message").removeClass("hidden");
function showMessage() {
  var $message = $("#message");
  $("#message").removeClass("hidden");

  $message.fadeIn(); // Fade in the message

// After 3 seconds, fade out the message
  setTimeout(function() {
    $message.fadeOut();
    // $message.addClass("hidden");

  }, 3000);
}

$("#dark-mode-box").on( "click", function() {
  $("body").toggleClass("lightmode")
});

$(".copybutton").on( "click", function() {
  var codeContent = $(this).parent().parent().children('.code').children('pre').children('code').html();
  var plainTextContent = codeContent.replace(/<[^>]*>/g, '');

  copyToClipboard(plainTextContent);
  showMessage();
});

$(".httplink").on( "click", function() {
  var linkContent = $(this).children('span').children('div:nth-child(2)').html();
  var plainTextContent = linkContent.replace(/<[^>]*>/g, '');

  copyToClipboard("https://"+plainTextContent);
  showMessage();
});