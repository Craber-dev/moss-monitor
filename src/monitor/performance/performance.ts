import { GlobalReportFormer, ReporterController } from '@/index';
import { ReportType } from '@/types/report';
import IntervalSampling from '@/utils/sampling';
import {
  onCLS, // 监听 Cumulative Layout Shift 指标
  onFCP, // 监听 First Contentful Paint 指标
  onFID, // 监听 First Input Delay 指标
  onLCP, // 监听 Largest Contentful Paint 指标
  onTTFB, // 监听 Time to First Byte 指标
} from 'web-vitals';

import FMPCounter from './fmpCounter';
import FPSCounter from './fpsCounter';

export default class PerformanceMonitor {
  private sampleRate: number;
  private interval: number;

  constructor(config: {sampleRate: number, interval?: number}) {
    const { sampleRate, interval = 1000 } = config

    // 初始化参数
    this.sampleRate = sampleRate;
    this.interval = interval;

    // 开启 Web Vitals 和性能监控
    this.activeWebVitals();
    this.activePerformance();
  }

  // 获取 Performance 类型的 ReportFormer 实例
  private PerformanceReportFormer = GlobalReportFormer.getReportFormer(ReportType.Performance);

  // Performance 类型的 Reporter
  private PerformanceReporter = (name: string, data?: any) => ReporterController.report(this.PerformanceReportFormer(name, data));

  // 获取采样上报函数
  private getSamplingReporter = (name: string) => {
    const sampling = new IntervalSampling({
      sampleRate: this.sampleRate, // 采样率
      interval: this.interval, // 采样间隔
      resultHandler: (results: any[]) => {
        results.forEach((item) => this.PerformanceReporter(name, item)); // 调用上报函数上报数据
      }
    })
    return sampling.select.bind(sampling); // 返回采样上报函数
  }

  // 开启 Web Vitals 监控
  activeWebVitals() {
    onCLS(this.getSamplingReporter('CLS'), { reportAllChanges: true }); // 监听 Cumulative Layout Shift 指标
    onFCP(this.getSamplingReporter('FCP'), { reportAllChanges: true }); // 监听 First Contentful Paint 指标
    onFID(this.getSamplingReporter('FID'), { reportAllChanges: true }); // 监听 First Input Delay 指标
    onLCP(this.getSamplingReporter('LCP'), { reportAllChanges: true }); // 监听 Largest Contentful Paint 指标
    onTTFB(this.getSamplingReporter('TTFB'), { reportAllChanges: true }); // 监听 Time to First Byte 指标
  }

  // 开启性能监控
  activePerformance() {
    // 获取采样上报函数
    const handleEventTiming = this.getSamplingReporter('EventTiming');

    // 监听事件性能指标
    const EventTimingObserver = new PerformanceObserver((list) => {
      // 对 PerformanceObserver 的观察结果进行处理
      // @ts-ignore
      list.getEntries().forEach(({ name, duration, processingEnd, processingStart, startTime }) => handleEventTiming({
        name,
        duration,
        processingDuration: processingEnd - processingStart,
        inputDelay: processingStart - startTime,
        processingEnd,
        processingStart,
        startTime,
      }));
    });
    EventTimingObserver.observe({ type: 'event', buffered: true });
    const handleFPSReport = this.getSamplingReporter('FPS');
    // 实例化 FPSCounter 并使用采样上报函数传入数据
    new FPSCounter((fps: number) => handleFPSReport({ fps }));

    // 获取采样上报函数
    const handleScrollLatecy = this.getSamplingReporter('ScrollLatency');
    // 监听屏幕滚动延迟
    const ScrollLatencyObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach(({ name, duration, startTime }) => handleScrollLatecy({
        name,
        duration,
        startTime,
      }));
    });
    ScrollLatencyObserver.observe({ entryTypes: ['touchscrolllatency'] });

    // 获取采样上报函数
    const handleLongTask = this.getSamplingReporter('LongTask');
    // 监听长任务
    const LongTaskObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach(({ duration, startTime }) => handleLongTask({
        duration,
        startTime,
      }));
    });
    LongTaskObserver.observe({type: "longtask", buffered: true});

    // 实例化 FMPCounter 并使用采样上报函数传入数据
    const handleFMPReport = this.getSamplingReporter('FMP');
    new FMPCounter(({ fmpTiming }) => handleFMPReport({ fmpTiming }));
  }
}
