setTimeout(function() {
  // document.body.setAttribute('videojs', window.videojs)
  // console.log(Object.prototype.toString.call(videojs))
  // javascript:(function(){videojs.getPlayers("video-player").html5player.tech_.setPlaybackRate(1.0);})();
  // console.log(videojs.getPlayers("video-player"))
  var tmp = document.createElement('div')
  tmp.id = 'speed_ele'
  // var speedFunc = function(speed) {videojs.getPlayers("video-player").html5player.tech_.setPlaybackRate(speed);}
  // var _playspeed = new Event('playspeed',  {"bubbles":true, "cancelable":false})
  // tmp.addEventListener('playspeed', speed)
  var speedFunc = function(speed) {videojs.getPlayer('videoPlayer').tech_.el_.playbackRate = speed;}
  tmp.setAttribute('onclick', speedFunc)
  document.body.appendChild(tmp)
  
  window.addEventListener("message", function(e) {
    if(e.data && e.data.type === 'to_inject') {
      try {
        var speed = e.data.speed
        speedFunc(speed)
      } catch (error) {
        alert('数值过大,请弄小一点')
      }
    }
  }, false);
}, 3600)