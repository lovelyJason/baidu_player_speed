# 如何从0到1实现一个chrome扩展

## 要实现的功能

向某网盘页面及视频上注入倍速播放的 dom 元素，支持自定义倍速，至于原理，实际上就是调用页面上的一个方法，这个视频看的很清楚了
[哔哩哔哩](https://www.bilibili.com/video/BV1sT4y1g7J4?p=1&share_medium=iphone&share_plat=ios&share_source=COPY&share_tag=s_i&timestamp=1593432582&unique_k=8K40Y4)

众所周知，非会员下的某盘不能倍速播放视频，然后就在想是不是写个chrome插件会比较方便一点

![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/369b416c2d3349eeabc02c69a6a79af2~tplv-k3u1fbpfcp-watermark.image)

本代码可以在<https://github.com/lovelyJason/baidu_player_speed.git>找到

## 基本知识/组件

### manifest.json

```json
{
  "name": "",
  "version": "1.0",
  "description": "",
  "permissions": ["activeTab", "declarativeContent", "storage"],
  "background": {
    "scripts": ["background.js"], // 注册background
    "persistent": false
  },
  "page_action": {
    "default_popup": "popup.html",
    "default_icon": {         // 插件栏上的icon图标
      "16": "images/get_started16.png",
      "32": "images/get_started32.png",
      "48": "images/get_started48.png",
      "128": "images/get_started128.png"
    }
  },
  "icons": {    // 扩展管理页的插件图标
    "16": "images/get_started16.png",
    "32": "images/get_started32.png",
    "48": "images/get_started48.png",
    "128": "images/get_started128.png"
  },
  "options_page": "options.html",
  "manifest_version": 2 // 必须配置且为2.0
}
```

manifest.json是必须的描述文件,用于配置chrome扩展,包括图标,行为等

>  chrome扩展的组件,或者说展示形式,主要有以下几种

### background & event page

后台脚本是扩展的事件处理程序;它包含对扩展很重要的浏览器事件的监听器。它处于休眠状态，直到触发一个事件，然后执行指示的逻辑。有效的后台脚本只在需要时加载，在空闲时卸载。
区别在于manifest.json中`persistent`属性值的不同

没有可见页面,只是一个执行后台脚本的一个页面


**更新 background 脚本函数**

如果使用 extension.getBackgroundPage 从后台页面调用函数，请更新为 runtime.getBackgroundPage。 较新的方法会在返回非持久脚本之前将其激活。

如果后台脚本处于不活动状态(非持久脚本的默认状态)，此方法将不起作用。较新的方法包括一个回调函数，以确保已加载后台脚本。
如 popup 中调用

```javascript
chrome.extension.getBackgroundPage().backgroundFunction(); // not work
```

```javascript
chrome.runtime.getBackgroundPage(function (backgroundPage) {
  backgroundPage.backgroundFunction();
});
```

### content

对 web 页面进行读写的扩展使用内容脚本。内容脚本包含在已加载到浏览器的页面上下文中执行的 JavaScript。内容脚本读取和修改浏览器访问的 web 页面的 DOM.可以把他理解为就是你写了一段dom,并且包含这段dom的脚本,注入到了原始页面中

内容脚本可以通过交换消息和使用存储 API 存储值与父扩展进行通信。

- content-scripts 和原始页面共享 dom 但是不共享 js，如果要访问 js 如变量等，只能通过后文的 `injected js` 实现
- 访问 chrome 有限 api，extension,i18n, runtime, storage。如果调用其他 api，可以与 background 通信，通过 background 调用
- 注入脚本有两种方式，编程式和声明式
  - 编程式：要在 manifest.json 中提供 permission 权限，设置为'activeTab'
```javascript
  // background.js
  chrome.runtime.onMessage.addListener(
  function(string message, callback) {
    if (message == "changeColor"){
      chrome.tabs.executeScript({
        code: 'document.body.style.backgroundColor="orange"'
      });
    }
  });
  // popup.js
  chrome.runtime.sendMessage("changeColor", function(response) {
    console.log(response.farewell);
  });
```
  - 声明式注入的脚本在清单的“content_scripts”字段下面注册。它们可以包含 JavaScript 文件、CSS 文件，或者两者都包含。所有自动运行的内容脚本都必须指定匹配模式。
    run_at 控制注入时机,默认 document_idle
    content-script 只能获取到原始页面 dom，不能获取到 js
```json
  "content_scripts": [
  {
    "matches": ["http://*.nytimes.com/*"],     // 匹配到页面时才生成插件脚本
    "css": ["myStyles.css"],
    "js": ["contentScript.js"],
    "run_at": "document_start"
  }
],
```

另外还有popup页(点击插件图标的弹窗页),options页(点击扩展的详情之后的页面)就不做过多介绍了,用法都差不多,可以参考github上的项目

比如popup,先在manifest.json中配置,然后popup.html中可以script标签引入自己项目中的脚本,就能生成一个弹窗页了

```json
"page_action": {
  "default_popup": "popup.html"
},
```

> 与嵌入的原始页面间的通信
  通过 window.postMessage

### chrome 插件访问原始页面变量/函数等

因为谷歌的api是不让插件访问原始页面的变量的,但是很多插件都会有调用原始页面的方法或者获取js变量的需求,那么就要用类似破解的一些方法.就是在content.js执行过程中,插入script标签对到原始页面中,因为content.js虽然无法获取原始页面的函数,变量等,但是可以访问到dom,也就可以进行dom操作

如插入script标签对到原始页面中，并在里面插入自己的逻辑代码，以下称为inject-script.js

```javascript
// content.js
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

// 在content.js初始化调用
document.addEventListener('DOMContentLoaded', function () {
    injectCustomJs(null, function () {})
}
```

先说一下我尝试的一些方法,

- 创建并插入 script 元素，执行其中 js 代码，可以传递消息或其他方式缓存书籍，然后删除元素.需注意，原始页面中的 js 变量可能不是立马生成，需要定时器延缓获取时机.这种方式只能传递某些类型如字符串，简单对象(会自动序列化)等，函数等无法传递，即使使用消息机制，函数也无法克隆

- 创建元素并设置 onclick 属性，然后在某一时机调用这个元素的onclick方法.实测在 chrome 插件中无效，元素无 onclick 方法,指向为null,即无法绑定内联事件

- 创建script元素，并通过addEventListener绑定原页面中的函数，在content-script中通过寻找该dom，并触发其事件(如果采用js原生，如注册click事件，是无法主动dispatch或trigger的，jquery提供了trigger主动触发事件).然而这样也有问题,这里存在着inject-script(本质上是向页面注入dom,也是原始页面)和content-script之间的通信问题，原始页面(包括inject-script)和content-script处在两个沙盒，彼此不共享变量，无法互相访问.虽然可以通过消息机制发送和接收,比如自定义的事件而不是onclick这些系统内置事件,结果仍然不行,无法传递js的变量,函数等，又回到最初的起点

- 终极大法：总而言之，无论是什么方式传递，只能传递字符串或者JSON字符串 在content-script中根据时机（如点击你注入的一个按钮）进行postMessage，inject-script中监听即可直接调用原始页面中函数或获取变量即可而无需传递

  注入的样式被称为injected stylesheet，在chrome开发工具中无法修改

## chrome api

扩展程序除了可以访问与网页相同的 API 外，还可以使用特定于扩展程序的 API，这些 API 可以与浏览器紧密集成。 扩展程序和网页都可以访问标准 window.open（）方法来打开 URL，但是扩展程序可以使用 Chrome API tabs.create 方法来指定显示 URL 的窗口。

大多数 Chrome API 方法都是异步的:它们会立即返回，而不需要等待操作完成。如果一个扩展需要知道异步操作的结果，它可以向该方法传递一个回调函数。回调在方法返回后执行，可能要晚得多。

```json
chrome: {
  tabs: {
    query: function({object queryInfo: {active: true, currentWindow: true}}, callback) {},
    update: function(tabs[0].id, {url: newUrl}) {},
    executeScript: function(tabs[0].id, {code}) {}
  },
  runtime: {
    // 返回extensionDir
    getURL: string function() {}，
    onInstalled: {
      addListener: function(calback) {}   // 侦听运行时，用于设置状态或进行初始化
    },
    getBackgroundPage: function() {},
    onMessage: {
      addListener: function(function(message, callback) {}) {}
    }
  },
  storage: {
    // 存储的数据将自动同步到用户登录的任何Chrome浏览器。
    sync: {
      get: function(key, callback || undefined) {},
      set: function(key, callback) {}
    }，
    local: {
      get: function(key, callback || undefined) {},
      set: function(key, callback) {}
    }
  }，
  // 设置上下文菜单
  contextMenus: {
    create: function({
      "id": "",
      "title": "",
      "contexts": ["selection"]
    }) {}
  }
}
```

## chrome扩展页面间通信

扩展中的不同组件常常需要彼此通信。不同的 HTML 页面可以通过 chrome 找到彼此。扩展方法，如 getViews()和 getBackgroundPage()。一旦一个页面引用了其他扩展页面，第一个页面就可以调用其他页面上的函数并操作它们的 dom。此外，扩展的所有组件都可以访问使用存储 API 存储的值，并通过 message passing.进行通信。

## 一些总结

background 和 event pages 没有可见页面，区别在于，前者长时间挂载可能影响性能，在配置文件的区别上，后者仅多了一个`persistent`参数，指定为 false;另外，event pages 特点是， 后台页面在需要时被加载，在空闲时被卸载。事件的一些例子包括

- 扩展首先被安装或更新到一个新版本。
- 后台页面正在监听事件，并且已调度该事件。
- content script 或其他扩展发送消息
- 扩展中的另一个视图，比如一个 popup，调用 runtime.getBackgroundPage。

基于事件的后台脚本可以支持大多数扩展功能。只有在很少的情况下，扩展才应该有一个持久的后台

> 注： 官方的称呼是`Event Driven Background Scripts`,即事件驱动脚本

**侦听器必须从页面的开始并且同步注册**

```javascript
// background.js
chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    id: "sampleContextMenu",
    title: "Sample Context Menu",
    contexts: ["selection"],
  });
});

// This will run when a bookmark is created.
chrome.bookmarks.onCreated.addListener(function () {
  // do something
});
```

错误的实例

```javascript
chrome.runtime.onInstalled.addListener(function () {
  // ERROR! Events must be registered synchronously from the start of
  // the page.
  chrome.bookmarks.onCreated.addListener(function () {
    // do something
  });
});
```

**扩展可以通过调用 removeListener 从后台脚本中删除侦听器。如果一个事件的所有监听器被移除，Chrome 将不再为该事件加载扩展的后台脚本。**

```javascript
chrome.runtime.onMessage.addListener(function (message, sender, reply) {
  chrome.runtime.onMessage.removeListener(event);
});
```

**background 和 popup 无法直接访问页面 dom，但是可以通过 chrome.tabs.executeScript 执行脚本，如一开始的示例`chrome.tabs.executeScript`，从而访问页面 dom，但也不能直接访问页面 js**

**不支持将js写在内联html中，或者通过setAttribute形式**

更多内容可访问官方文档<https://developer.chrome.com/extensions>

因此我的插件伪代码应该是这样的

```javascript
// content.js

// 1.注入dom，插入样式，注册事件等...

// 2.向inject.script.js发送消息，表示在某个时机要在原页面执行某个操作
$('div').on('click', function (e) {
  window.postMessage({ type: 'to_inject', speed: speed }, '*')
})

```

```javascript
// inject-script.js
setTimeout(() => {
  // 插入到原始页面的script标签对之后，代码执行到这里来，页面上的dom结构未必加载完全，因此页面上的dom节点或者js变量都未生成，需要定时器
  // 可以获取dom和任意原始页面中可以获取到的js变量，调用函数等操作
  window.addEventListener("message", function(e) {
    // inject-script（也就是原始页面）接收到消息
    if(e.data && e.data.type === 'to_inject') {
      // 执行原页面的某个函数调用
    }
  }, false);
}, 3000)
```

## chrome扩展打包/发布/使用

- 打包可以通过chrome扩展管理界面打包和加载，打包扩展程序会将项目文件夹打包为crx后缀文件
以前的chrome浏览器在打开开发者模式下，直接拖入crx即可安装扩展，现在没有上架chrome扩展商店的应用无法安装

- 至于发布，需要有visa等信用卡付款才能上架应用，还是比较难搞的

- 使用，插件源码<https://github.com/lovelyJason/baidu_player_speed.git> 在chrome扩展管理界面导入文件夹，然后勾选插件的启用，在播放网盘视频的界面就可以看到效果啦

![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/68f1f8929eec49dda3f5e4618eac979d~tplv-k3u1fbpfcp-watermark.image)