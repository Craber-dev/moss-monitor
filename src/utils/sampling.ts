/**
 * IntervalSampling类用于对输入的样本进行采样，以减少数据量并节省带宽。
 */
export default class IntervalSampling {
  // 构造函数参数
  private sampleRate: number; // 采样率
  private interval: number; // 采样间隔时间
  private queue: any[] = []; // 采样队列
  private timeout = null; // 定时器
  private resultHandler: (samples: any[]) => any; // 用于处理采样后的结果的函数
  private startCount: number; // 在开始采样前收集的样本数目

  /**
   * 构造函数用于初始化采样器。
   * @param samplingConfig 采样配置
   */
  constructor(samplingConfig: {
    resultHandler: (samples: any[]) => any; // 用于处理采样后的结果的函数
    sampleRate: number; // 采样率
    interval: number; // 采样间隔时间
    startCount?: number; // 在开始采样前收集的样本数目，可选，默认为采样率的相反数
  }) {
    const { resultHandler, sampleRate, interval, startCount } = samplingConfig;
    this.resultHandler = resultHandler;
    this.sampleRate = sampleRate;
    this.interval = interval;
    this.startCount = startCount ? startCount : Math.ceil(1 / sampleRate); // 如果未设置开始采样前收集的样本数目，则默认为采样率的相反数
  }

  /**
   * 用于将一个样本推送到采样队列中。
   * @param sample 要采样的样本
   */
  select(sample: any) {
    this.queue.push(sample); // 将样本推送到队列中
    if (!this.timeout) {
      // 如果当前没有正在等待的定时器
      this.timeout = setTimeout(this.sampling.bind(this), this.interval); // 设置新的定时器，并在采样间隔时间之后触发采样
    }
  }

  /**
   * 用于对采样队列中的样本进行采样处理。
   */
  sampling() {
    this.resultHandler(
      this.queue.length <= this.startCount && this.interval !== 0 // 如果采样队列中的数据量小于等于开始采样前设定的收集样本数目
        ? this.queue // 直接将队列中的所有数据发送到结果处理函数中
        : this.queue.filter(() => Math.random() < this.sampleRate) // 否则，使用过滤器函数按照概率采样
    );
    this.queue = []; // 采样完毕后清空队列
    this.timeout = null;
  }
}
