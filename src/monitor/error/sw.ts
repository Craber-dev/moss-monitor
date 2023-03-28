const CHECK_CRUSH_INTERVAL = 10 * 1000; // 每10s检测一次心跳
const CRUSH_THRESHOLD = 15 * 1000; // 可接受的最长的心跳间隔

let pages = {}, timer; // 存储页面列表和计时器

// 上报数据函数
function report(url, params) {
  if (url) {
    fetch(url, params);
  } else {
    console.log(params);
  }
}

// 检查页面崩溃函数
function checkCrash() {
  const now = Date.now()
  for (let id in pages) {
    const page = pages[id];
    // 如果页面可见并且心跳时间超过阈值，则上报崩溃
    if (page.visibility && (now - page.t) > CRUSH_THRESHOLD) {
      delete pages[id]; // 从数据里面删除该页面
      report(page.reportTarget, page.data); // 上报崩溃信息
    }
  }
  // 如果所有页面都已经被删除，则清空计时器
  if (Object.keys(pages).length == 0) {
    clearInterval(timer);
    timer = null;
  }
}

// 监听消息事件
self.addEventListener('message', (e) => {
  let data = e.data;
  if (data.type === 'heartbeat') { // 如果是心跳数据
    pages[data.id] = { // 存储页面数据
      t: Date.now(), // 最新时间戳
      data: data.data, // 心跳数据
      visibility: true, // 当前页面可见性状态
    }
    // 启动定时器，定期检测心跳
    if (!timer) {
      timer = setInterval(function () {
        checkCrash()
      }, CHECK_CRUSH_INTERVAL)
    }
  } else if(data.type === 'init') { // 如果是初始化消息
    pages[data.id].reportTarget = data.target; // 存储上报目标
  } else if(data.type === 'leave') { // 如果是离开页面
    pages[data.id].visibility = false; // 更新页面可见性状态
  } else if(data.type === 'back') { // 如果是返回页面
    pages[data.id].visibility = true; // 更新页面可见性状态
  } else if (data.type === 'unload') { // 如果是页面unload
    delete pages[data.id] // 从数据里面删除该页面
  }
})
