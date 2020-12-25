setTimeout(function() {
  // document.body.setAttribute('videojs', window.videojs)
  // console.log(Object.prototype.toString.call(videojs))
  // javascript:(function(){videojs.getPlayers("video-player").html5player.tech_.setPlaybackRate(1.0);})();
  // console.log(videojs.getPlayers("video-player"))
  var tmp = document.createElement('div')
  tmp.id = 'speed_ele'
  var speedFunc = function(speed) {videojs.getPlayers("player_daPlayer").player.tech_.setPlaybackRate(speed);}
  // var _playspeed = new Event('playspeed',  {"bubbles":true, "cancelable":false})
  // tmp.addEventListener('playspeed', speed)
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

  // change origin code
  if(listenView && listenView.handler && listenView.handler.closeWin) {
    listenView.handler.showBox = function () {
      // console.log("%c想打开弹窗?没门", "background: #1dc7e9;color: green");
      console.log("%c想打开弹窗?没门%c ", "font-size: 26px;background: #1dc7e9;color: green", "color:red;font-size:30px;font-weight:bolder;padding:50px 420px;line-height:10px;background:url('https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fimg.soogif.com%2FGM8Kgd3lPb26Xibj34CGDgzpM7ZQKRs5.jpeg&refer=http%3A%2F%2Fimg.soogif.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1611484777&t=0e73fcba0bf9b5f666ae644fd357424c') no-repeat;background-size:contain;");

    }
    listenView.handler.closeWin = function () {
      $('.vjs-big-play-button').click()
      $('.vjs-overlay').remove()
    }
  }
  
}, 3600)