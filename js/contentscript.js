function parseDom(arg) {
  var objE = document.createElement("div");
  objE.innerHTML = arg;
  return objE.childNodes;
};

function injectCustomJs(jsPath, callback) {
  jsPath = jsPath || 'js/injectscript.js';
  var script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  // 获得的地址类似：chrome-extension://ihcokhadfjfchaeagdoclpnjdiokfakg/js/inject.js
  script.src = chrome.extension.getURL(jsPath);
  script.onload = function () {
    // 放在页面不好看，执行完后移除掉
    this.parentNode.removeChild(this);
    setTimeout(function () {
      callback()
    }, 3600)
  };
  document.head.appendChild(script);
}

function injectLayui() {
  var link = document.createElement('link')
  link.rel = 'stylesheet'
  link.type = 'text/css'
  link.href = 'https://www.layuicdn.com/layui/css/layui.css'
  document.head.appendChild(link);

  // var script = document.createElement('script')
  // script.setAttribute('type', 'text/javascript');
  // script.src = 'https://cdn.bootcdn.net/ajax/libs/layui/2.5.6/layui.all.js'
  // document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', function () {
  injectLayui()
  injectCustomJs(null, function () {

  }, false)

  // console.log(window.videojs) undefined
  var videoContent = document.getElementsByClassName('video-content')[0]
  var videoTitle = document.getElementsByClassName('video-title')[0]
  var videoWrapOuter = videoTitle.nextElementSibling
  var btns = parseDom(`<div class="baidu_player_speed">
  <div class="layui-form-item">
    <div class="layui-inline">
      <div class="layui-btn-group" id="bnts-group">
        <button id="speed_1" data-value="1.0" type="button" class="layui-btn layui-btn-warm">正常速度</button>
        <button id="speed_1.5" data-value="1.5" type="button" class="layui-btn">1.5倍速</button>
        <button id="speed_2" data-value="2.0" type="button" class="layui-btn">2.0倍速</button>
      </div>
    </div>
      <div class="layui-inline">
        <label class="layui-form-label">自定义倍速</label>
        <div class="layui-input-block">
        <div class="layui-unselect layui-form-select layui-form-selected"><div class="layui-select-title"><input type="text" placeholder="请选择" value="" readonly="" class="layui-input layui-unselect"><i class="layui-edge"></i></div><dl class="layui-anim layui-anim-upbit" style=""><dd lay-value="" class="layui-select-tips layui-this">请选择</dd><dd lay-value="1.5" class="">1.5</dd><dd lay-value="1.6" class="">1.6</dd><dd lay-value="1.7" class="">1.7</dd><dd lay-value="1.8" class="">1.8</dd><dd lay-value="1.9" class="">1.9</dd><dd lay-value="2.0" class="">2.0</dd><dd lay-value="2.5" class="">2.5</dd><dd lay-value="2.6" class="">2.6</dd><dd lay-value="2.7" class="">2.7</dd><dd lay-value="2.8" class="">2.8</dd><dd lay-value="2.9" class="">2.9</dd><dd lay-value="3.0" class="">3.0</dd></dl></div>
        </div>
      </div>
    </div>
  </div>`)[0]
  videoContent.insertBefore(btns, videoWrapOuter)
  $('#bnts-group button').on('click', function(e) {
    var speed = parseInt(e.currentTarget.dataset.value)
    window.postMessage({ type: 'from_inject', speed: speed }, '*')
  })
})