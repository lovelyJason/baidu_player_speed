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
  var btns = parseDom(`<div class="baidu_player_speed ">
    <div class="layui-form-item">
      <div class="layui-inline">
        <div class="layui-btn-group" id="bnts-group">
          <button id="speed_1.0" data-value="1.0" type="button" class="layui-btn layui-btn-warm">正常速度</button>
          <button id="speed_1.5" data-value="1.5" type="button" class="layui-btn">1.5倍速</button>
          <button id="speed_2.0" data-value="2.0" type="button" class="layui-btn">2.0倍速</button>
        </div>
      </div>
      <div class="layui-inline">
        <label class="layui-form-label">自定义倍速</label>
        <div class="layui-input-block">
          <div class="layui-unselect layui-form-select">
            <div class="layui-select-title">
              <input type="text" placeholder="请选择" value="" readonly="" class="layui-input layui-unselect">
              <i class="layui-edge"></i>
            </div>
            <dl class="layui-anim layui-anim-upbit" style="">
              <dd lay-value="" class="layui-select-tips layui-this">请选择</dd>
              <dd lay-value="1.5" class="">1.5</dd><dd lay-value="1.6" class="">1.6</dd>
              <dd lay-value="1.7" class="">1.7</dd><dd lay-value="1.8" class="">1.8</dd>
              <dd lay-value="1.9" class="">1.9</dd><dd lay-value="2.0" class="">2.0</dd>
              <dd lay-value="2.5" class="">2.5</dd><dd lay-value="2.6" class="">2.6</dd>
              <dd lay-value="2.7" class="">2.7</dd><dd lay-value="2.8" class="">2.8</dd>
              <dd lay-value="2.9" class="">2.9</dd><dd lay-value="3.0" class="">3.0</dd>
            </dl>
          </div>
        </div>
      </div>
      <div class="layui-inline">
        <label class="layui-form-label">开启悬浮窗</label>
        <div class="layui-input-block">
          <input type="checkbox" name="switch" lay-skin="switch" lay-text="ON|OFF" lay-filter="switchTest" value="1" style="display: none;">
          <div class="layui-unselect layui-form-switch" lay-skin="_switch">
            <em>OFF</em>
            <i></i>
          </div>
        </div>
      </div>
    </div>
  </div>`)[0]
  videoContent.insertBefore(btns, videoWrapOuter)
  // video里插入按钮---shadow dom mode为close无法控制
  // var fullscreenSpeed = $(`<div class="speed-json-button-group">倍速</div>`)
  // fullscreenSpeed.insertAfter('.video-functions-tips .tips-ul .video-functions-last')
  Object.defineProperty(this, 'navigator', { value: { platform: '' } })
  // video无法覆盖
  $('#video-wrap-outer').append(`<div class="suspended-ball movable" id="moveDiv">
    <div id="inner"></div>
  </div>`)
  $('#bnts-group button').on('click', function(e) {
    var current = e.currentTarget
    var speed = parseInt(current.dataset.value)
    $(this).addClass('layui-btn-warm').siblings().removeClass('layui-btn-warm')
    window.postMessage({ type: 'to_inject', speed: speed }, '*')
  })
  $('.layui-form-select').on('click', function(e) {
    var classNames = $(this).prop('className')
    if(classNames.includes('layui-form-selected')) {
      $(this).removeClass('layui-form-selected')
    } else {
      $(this).addClass('layui-form-selected')
    }
  })
  $('.layui-anim dd').on('click', function(e) {
    $(this).addClass('layui-this').siblings().removeClass('layui-this')
    var speed = $(this).text()
    $('.layui-input').val(speed)
    if($(`button[data-value="${speed}"]`).length > 0) {
      $(`button[data-value="${speed}"]`).addClass('layui-btn-warm').siblings().removeClass('layui-btn-warm')
    } else {
      $('.layui-btn').removeClass('layui-btn-warm')
    }
    if(!isNaN(parseFloat(speed))) {
      window.postMessage({ type: 'to_inject', speed: speed }, '*')
    }
  })
  $('.layui-form-switch').on('click', function(e) {
    var classNames = $(this).prop('className')
    if(classNames.includes('layui-form-onswitch')) {
      $(this).removeClass('layui-form-onswitch')
      $('.layui-form-switch em').text('OFF')
      $('.suspended-ball').css('display', 'none')
    } else {
      $(this).addClass('layui-form-onswitch')
      $('.layui-form-switch em').text('ON')
      $('.suspended-ball').css('display', 'inline-block')
    }
  })
})