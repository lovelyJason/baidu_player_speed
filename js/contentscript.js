function parseDom(arg) {
  var objE = document.createElement("div");
  objE.innerHTML = arg;
  return objE.childNodes;
};

document.addEventListener('DOMContentLoaded', function () {
  var videoContent = document.getElementsByClassName('video-content')[0]
  var videoTitle = document.getElementsByClassName('video-title')[0]
  var videoWrapOuter = videoTitle.nextElementSibling
  var btns = parseDom(`<div class="baidu_player_speed">
      <button id="speed_1.5">1.5倍速</button>
  </div>`)[0]
  videoContent.insertBefore(btns, videoWrapOuter)
  document.getElementById('speed_1.5').onclick = function () {
    var div = document.createElement('div')
    div.innerText = '测试'
    div.id = 'test'
    div.setAttribute('onclick', 'javascript:alert(1)')
    document.body.appendChild(div)
    console.dir(div)
  }
})