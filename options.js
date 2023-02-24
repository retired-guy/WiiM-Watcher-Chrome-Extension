$(function() {
  // Navigation
  $('.menu a').click(function(ev) {
    ev.preventDefault();
    var selected = 'selected';

    $('main > *').removeClass(selected);
    $('.menu li').removeClass(selected);
    setTimeout(function() {
      $('main > *:not(.selected)').css('display', 'none');
    }, 100);

    $(ev.currentTarget).parent().addClass(selected);
    var currentView = $($(ev.currentTarget).attr('href'));
    currentView.css('display', 'block');
    setTimeout(function() {
      currentView.addClass(selected);
    }, 0);

    setTimeout(function() {
      $('body')[0].scrollTop = 0;
    }, 200);
  });

  $('main > *:not(.selected)').css('display', 'none');

  // Settings
  var status = $('#player_ip_status'),
      details = $('#player_details');
  $('#player_ip').change(function() {
    var ip = $(this).val().trim();
    status.text('');
    details.text('');
    if (!this.checkValidity()) {
      status.text('needs IP address');
      return;
    }

    chrome.storage.sync.set({
      player_ip: ip
    }, function() {
      status.html('<span class="loading">&hellip;</span>');
      getWiiMName(ip);
    });
  });

  var getWiiMName = function (ip) {
    $.ajax({
      url: 'http://' + ip + ':49152/description.xml',
      dataType: 'xml',
      timeout: 2.5 * 1000,
      success: function (data) {
          console.log(data);
        var model = $(data).find('root > device > modelName').text();
        //var room = $(data).find('root > device > roomName').text();
        details.text(model);
        status.html('<span class="saved-checker">&#10004;</span>');
      },
      error: function (xhr, type) {
          console.log(type,xhr);
        if (type == 'abort' || type == 'timeout') {
          status.html('<span class="connection-error">&times;</span>');
          details.text('Cannot connect to Player.');
          details.text(type);
        }
      }
    });
  };

  chrome.storage.sync.get({
    player_ip: ''
  }, function(items) {
    document.getElementById('player_ip').value = items.player_ip;
    if (items.player_ip != "") {
      getWiiMName(items.player_ip);
    }
  });
});
