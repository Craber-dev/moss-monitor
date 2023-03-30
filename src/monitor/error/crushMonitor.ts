import { resolve } from "path-browserify";

// 声明一个枚举类型，用于定义消息类型
enum SWMessageType {
  Init = 'init', // 初始化消息
  HeartBeat = 'heartbeat', // 心跳消息
  Leave = 'leave', // 离开页面消息
  Back = 'back', // 回到页面消息
  Unload = 'unload', // 卸载页面消息
}

// 定义一个接口，描述监测标签的属性
interface CrushMonitorTags {
  pid: string; // 进程 ID
  loadTime?: string; // 页面加载时间
  unloadTime?: string; // 页面卸载时间
}

// const SWFilePath = resolve(__dirname, 'sw.js');

// 用于监测页面奔溃
export default class CrushMonitor {
  // 定义私有属性
  private pid: string; // 进程 ID
  private reportTarget: string; // 报告目标
  private crushHandler: (data: any) => void; // 回调函数

  // 构造函数，初始化对象时自动调用
  constructor(crushHandler: (data: any) => void, pid: string, reportTarget: string) {
    // 初始化私有属性
    this.pid = pid; // 进程 ID
    this.reportTarget = reportTarget; // 报告目标
    this.crushHandler=crushHandler; // 回调函数

    // 激活 web worker 心跳监听
    this.activeSWHeartBeat();
    // 激活本地存储监听
    this.activeLocalStorageMonitor();
  }

  // 激活 web worker 心跳监听
  private async activeSWHeartBeat() {
    // 检查浏览器是否支持 web worker
    if(Worker) {
      // 创建一个新的 worker 实例
      const sw = new Worker(resolve(__dirname, 'sw.js'));

      // 发送初始化消息
      sw.postMessage({
        type: SWMessageType.Init, // 消息类型
        id: this.pid, // 进程 ID
        target: this.reportTarget, // 报告目标
      });

      // 设置心跳间隔
      const HEART_BEAT_INTERVAL = 5 * 1000;
      // 创建定时器，定时发送心跳消息
      let timer = setInterval(() => {
        sw.postMessage({
          type: SWMessageType.HeartBeat, // 消息类型
          id: this.pid, // 进程 ID
          data: {
            src: location.href, // 发送当前页面地址
          }
        })
      }, HEART_BEAT_INTERVAL)

      // 监听页面是否可见状态改变
      let visibility = true;
      document.addEventListener('visibilitychange', () => {
        // 发送相应的消息类型
        if (visibility) {
          sw.postMessage({ type: SWMessageType.Leave, id: this.pid }); // 离开页面
        } else {
          sw.postMessage({ type: SWMessageType.Back, id: this.pid }); // 回到页面
        }
        // 切换状态
        visibility = !visibility;
      })

      // 监听页面卸载事件
      window.addEventListener('unload', () => {
        // 发送相应的消息类型
        sw.postMessage({
          type: SWMessageType.Unload, // 消息类型
          id: this.pid, // 进程 ID
        })
        // 停止定时器
        clearInterval(timer);
        timer = null;
      })
    }
  }

  // 激活本地存储监听
  private async activeLocalStorageMonitor() {
    // 从本地存储中读取上次保存的标签
    const lastTags = JSON.parse(localStorage.getItem('crush-monitor')) as CrushMonitorTags | null;
    // 如果标签不为空且未正常卸载，则发送相应的信息
    if (lastTags && !lastTags.unloadTime) {
      this.crushHandler({
        crushPid: lastTags.pid, // 进程 ID
        loadTime: lastTags.loadTime // 页面加载时间
      });
    }
    // 创建一个新的标签并保存到本地存储中
    localStorage.setItem('crush-monitor', JSON.stringify({
      pid: this.pid, // 进程 ID
      loadTime: Date.now().toString(), // 页面加载时间
    }));
    // 监听页面卸载事件，更新标签中的卸载时间
    window.addEventListener('unload', () => {
      const tags = JSON.parse(localStorage.getItem('crush-monitor')) as CrushMonitorTags | null;
      localStorage.setItem('crush-monitor', JSON.stringify({
        ...tags,
        unloadTime: Date.now().toString(), // 页面卸载时间
      }));
    })
  }
}
