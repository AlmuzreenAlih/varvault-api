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

  if (docPageData.darkMode) {
    $("body").addClass("lightmode");
    docPageData.darkMode = false;
  } else {
    $("body").removeClass("lightmode");
    docPageData.darkMode = true;
  }

  SaveDocPageData();
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
var docPageData;
function InitializeDocPage() {
  if (!localStorage.getItem('docPageData')) {
    docPageData = {
      darkMode: true,
      withDashboard: false
    }
    localStorage.setItem('docPageData', JSON.stringify(docPageData));
  }

  docPageData = localStorage.getItem('docPageData');
  docPageData = JSON.parse(docPageData);
}

function SaveDocPageData() {
  localStorage.setItem('docPageData', JSON.stringify(docPageData));  
}

$(document).ready(function() {
    InitializeDocPage();

    if (docPageData.darkMode) {
      $("body").removeClass("lightmode");
    } else {
      $("body").addClass("lightmode");
    }
  }
)

$("#show-button").on( "click", function() {
  if ($('#sidebar').css('left') == '0px') {
    $('#show-button-char').html('navigate_next');
    $('#sidebar').css('left', '-55%');
    $('#show-button-char').css('width', '32px');
  } else {
    $('#sidebar').css('left', '0%');
    $('#show-button-char').html('navigate_before');
    $('#show-button-char').css('width', '32px');
  }
});