## 基本功能

向百度云盘页面及视频上注入倍速播放的 dom 元素，支持自定义倍速

## 开发文档

### 组件内容

#### manifest.json

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
    "default_icon": {
      "16": "images/get_started16.png",
      "32": "images/get_started32.png",
      "48": "images/get_started48.png",
      "128": "images/get_started128.png"
    }
  },
  "icons": {
    "16": "images/get_started16.png",
    "32": "images/get_started32.png",
    "48": "images/get_started48.png",
    "128": "images/get_started128.png"
  },
  "options_page": "options.html",
  "manifest_version": 2 // 必须配置且为2.0
}
```

#### background & event page

后台脚本是扩展的事件处理程序;它包含对扩展很重要的浏览器事件的监听器。它处于休眠状态，直到触发一个事件，然后执行指示的逻辑。有效的后台脚本只在需要时加载，在空闲时卸载。

此页面看不到（？？？）

##### 更新 background 脚本函数

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

#### popup

插件弹窗页

#### options

插件详情页

#### content

对 web 页面进行读写的扩展使用内容脚本。内容脚本包含在已加载到浏览器的页面上下文中执行的 JavaScript。内容脚本读取和修改浏览器访问的 web 页面的 DOM

内容脚本可以通过交换消息和使用存储 API 存储值与父扩展进行通信。

- content-scripts 和原始页面共享 dom 但是不共享 js，如果要访问 js 如变量等，只能通过 injected js 实现
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
     "matches": ["http://*.nytimes.com/*"],
     "css": ["myStyles.css"],
     "js": ["contentScript.js"],
     "run_at": "document_start"
   }
  ],
  ```
- 与嵌入页面的通信
  通过 window.postMessage

##### chrome 插件访问原始页面变量

- 创建并插入 script 元素，执行其中 js 代码，可以传递消息或其他方式缓存书籍，然后删除元素.需注意，原始页面中的 js 变量可能不是立马生成，需要定时器延缓获取时机
这种方式只能传递某些类型如字符串，简单对象等，函数等无法传递，即使使用消息机制，函数也无法克隆

- 创建元素并设置 onclick 属性，实测在 chrome 插件中无效，元素无 onclick 方法

- 终极大法：无论是什么方式传递，只能传递字符串或者JSON字符串
  inject-script中创建元素，并通过addEventListener绑定原页面中的函数，在content-script中通过寻找该dom，并触发其事件，注意不能直接调用其onclick方法，其指向为null,后文会说到，chrome插件中在html中写的内联事件无效
  然后这样也有问题，如果采用js原生，如注册click事件，是无法主动dispatch或trigger的，jquery提供了trigger主动触发事件

  介绍一下inject-script和content-script之间的通信问题，因为页面(包括inject-script)和content-script处在两个沙盒，彼此不共享变量，无法互相访问，可以通过消息机制发送和接收；这里又遇到问题终止了，函数无法被克隆并传递，又回到最初的起点

  在content-script中根据时机postMessage，inject-script中监听即可调用页面中函数或获取变量而无需传递

#### chrome api

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

### 页面间通信

扩展中的不同组件常常需要彼此通信。不同的 HTML 页面可以通过 chrome 找到彼此。扩展方法，如 getViews()和 getBackgroundPage()。一旦一个页面引用了其他扩展页面，第一个页面就可以调用其他页面上的函数并操作它们的 dom。此外，扩展的所有组件都可以访问使用存储 API 存储的值，并通过 message passing.进行通信。

### 一些总结

background 和 event pages 没有可见页面，区别在于，前者长时间挂载可能影响性能，在配置文件的区别上，后者仅多了一个`persistent`参数，指定为 false;另外，event pages 特点是， 后台页面在需要时被加载，在空闲时被卸载。事件的一些例子包括

- 扩展首先被安装或更新到一个新版本。
- 后台页面正在监听事件，并且已调度该事件。
- content script 或其他扩展发送消息
- 扩展中的另一个视图，比如一个 popup，调用 runtime.getBackgroundPage。

基于事件的后台脚本可以支持大多数扩展功能。只有在很少的情况下，扩展才应该有一个持久的后台

> 注： 官方的称呼是`Event Driven Background Scripts`,即事件驱动脚本

**侦听器必须从页面的开始并且同步注册**

```javascript
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

**background 和 popup 无法直接访问页面 dom，但是可以通过 chrome.tabs.executeScript 执行脚本，从而访问页面 dom，但也不能直接访问页面 js**

**不支持将js写在内联html中，或者通过setAttribute形式**