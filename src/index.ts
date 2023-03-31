import ReportFormer from "./utils/report";
import { v4 as uuid } from "uuid";
import Controller from "./controller";
import PerformanceMonitor from "./monitor/performance/performance";
import ErrorMonitor from "./monitor/error/error";

// 定义配置接口
interface MonitorConfig {
  /** 用户 ID */
  uid?: string;
  /**
   * 是否在未定义用户id时自动生成用户 ID，该项优先级低于自定义的用户id。
   * 默认值为true，即在未定义时会自动生成。
   * 该项自动生成的UID使用逻辑为：在当前用户的localStorage中保存一个生成的uuid，
   * 在此uuid存活期间UID将一直使用该值直到清除localStorage或开发者选择自定义
   */
  autoGenerateUid?: boolean;
  /** 页面ID，默认自动生成，可通过配置此项覆盖默认值，否则每个PID仅在当前页面进程中存活，刷新则重新生成 */
  pid?: string;
  /** 是否使用采样，默认使用 */
  useSampling?: boolean;
  /** 采样率，默认为0.1 */
  sampleRate?: number;
  /**
   * 采样是否使用时间间隔，默认使用。
   * 使用该项时，效果为：在一段时间内持续采样，若样本数大于采样率的倒数则触发采样，否则不采样
   */
  useIntervalOnSampling?: boolean;
  /** 采样时间间隔，默认为1s */
  samplingInterval?: number;
  /** 自定义监控上报目标（!!!注意：使用该项后默认的上报服务器将不会再收到监控数据，一般仅适用于自行部署的监控服务!!!） */
  customMonitorTarget?: string;
  /** 是否在上报时进行请求压缩，即一段时间内将会不断接收上报并压缩在同一个请求内发送，默认使用 */
  useIntervalOnReport?: boolean;
  /** 上报时间间隔，默认5s */
  reportInterval?: number;
  /** 是否在开发模式下不上报，仅在控制台打印（注意，该项置为false时将会在本地开发模式中上报且不会在控制台打印上报内容） */
  logInDev?: boolean;
}

// 导出全局变量
export let GlobalReportFormer: ReportFormer; // 报告生成器实例
export let ReporterController: Controller; // 控制器实例

// 定义默认监控目标
const defaultTarget = '...';

// 定义性能监控器和错误监控器实例
// @ts-ignore
let performanceMonitor: PerformanceMonitor; // 性能监控器实例
// @ts-ignore
let errorMonitor: ErrorMonitor; // 错误监控器实例

// 定义启动函数
function start(config: MonitorConfig = {}) {
  // 从配置中获取各项参数
  let {
    autoGenerateUid = true,
    uid, pid = uuid(),
    useSampling = true, sampleRate = 0.1,
    useIntervalOnSampling = true, samplingInterval = 1000,
    useIntervalOnReport = true, reportInterval = 5000,
    customMonitorTarget, logInDev = true
  } = config;
  const reportUrl = customMonitorTarget || defaultTarget; // 获取上报路径，优先为用户自定义

  if (!uid && autoGenerateUid) { // 当开发者未定义UID且开启了自动生成UID
    uid = localStorage.getItem('uuid'); // 从localStorage中获取UID
    if (!uid) { // 若不存在，则生成一个并将其置入localStorage
      uid = uuid();
      localStorage.setItem('uuid', uid);
    }
  }

  GlobalReportFormer = new ReportFormer(uid, pid); // 生成全局上报格式化工具工厂实例
  ReporterController = new Controller({ // 生成全局上报控制器
    url: reportUrl, // 上报路径
    useBuffer: useIntervalOnReport, // 是否启用请求压缩
    buf: reportInterval, // 请求压缩间隔
    logInDev, // 是否启用开发模式仅打印
  })

  if (!useSampling) { // 当未启用采样时设置采样率为1，采样间隔为0
    sampleRate = 1;
    samplingInterval = 0;
  } else if (sampleRate > 1 || sampleRate < 0) { // 否则，当采样率不合法时（即采样率不在0-1之间）将其置为默认值
    sampleRate = .1;
  }

  performanceMonitor = new PerformanceMonitor({ // 启动性能监控器
    sampleRate,
    interval: useIntervalOnSampling ? samplingInterval : 0, // 在不使用采样间隔时将无条件触发采样
  });
  errorMonitor = new ErrorMonitor(pid, ''); // 启动错误监控器
}

export default {
  start
};
