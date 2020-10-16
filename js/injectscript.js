setTimeout(function() {
  // document.body.setAttribute('videojs', window.videojs)
  // console.log(Object.prototype.toString.call(videojs))
  // javascript:(function(){videojs.getPlayers("video-player").html5player.tech_.setPlaybackRate(1.0);})();
  // console.log(videojs.getPlayers("video-player"))
  var tmp = document.createElement('div')
  tmp.id = 'speed_ele'
  var speedFunc = function(speed) {videojs.getPlayers("video-player").html5player.tech_.setPlaybackRate(speed);}
  // var _playspeed = new Event('playspeed',  {"bubbles":true, "cancelable":false})
  // tmp.addEventListener('playspeed', speed)
  tmp.setAttribute('onclick', speedFunc)
  document.body.appendChild(tmp)
  
  window.addEventListener("message", function(e) {
    if(e.data && e.data.type === 'to_inject') {
      var speed = e.data.speed
      speedFunc(speed)
    }
  }, false);
}, 3600)