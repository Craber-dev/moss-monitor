import { Reporter } from "./types/report";
import { formatTime } from "./utils/time";

// 配置类，用于接收 Controller 的配置参数
export interface ControllerConfig {
  url: string; // 统计数据上报的 URL
  buf?: number; // 缓存时间，默认值为 1000
  useBuffer?: boolean; // 是否使用缓存，默认为 true
  logInDev?: boolean; // 在开发环境中是否进行上报，默认为 true
}

// Controller 类
export default class Controller {
  // 存储统计数据的队列
  private reportQueue: Reporter[];
  // 统计数据上报的 URL
  private url: string;
  // 缓存时间，即多少毫秒触发一次上报
  private bufferTime: number;
  // 定时器 ID
  private timeout: any = null;
  // 在开发环境中是否上报
  private logInDev: boolean;

  constructor(config: ControllerConfig) {
    const { url, buf = 1000, useBuffer, logInDev = true } = config;

    // 初始化属性
    this.reportQueue = [];
    this.url = url;
    this.bufferTime = useBuffer === false ? 0 : buf;
    this.logInDev = logInDev;
  }

  // 将数据加入到队列
  report(report: Reporter) {
    this.reportQueue.push(report);
    if (!this.timeout) {
      // 如果定时器不存在，则设置定时器
      const that = this;
      this.timeout = setTimeout(() => that.send(), this.bufferTime);
    }
  }

  // 将队列中的数据进行上报
  private send() {
    if (this.reportQueue?.length) {
      // 如果队列中有数据，则进行上报
      if (this.logInDev && process.env.NODE_ENV === 'development') {
        // 如果在开发环境中，且设置了不上报，则将数据输出到控制台
        this.reportQueue.forEach((item) => {
          console.log(`[${formatTime(item.time)}]${item.type} - ${item.name}: `, item);
        })
        // console.log('report send.')
      } else {
        const navigtor = new Navigator();
        // 否则，将数据发送到指定的 URL
        navigtor.sendBeacon(this.url, JSON.stringify({
          data: this.reportQueue,
        }));
      }
      // 清空队列
      this.reportQueue = [];
    }
    if (this.timeout) {
      // 重置定时器 ID
      this.timeout = null;
    }
  }
}
