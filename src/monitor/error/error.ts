import { GlobalReportFormer, ReporterController } from '@/index';
import { ReportType } from '@/types/report';
import CrushMonitor from './crushMonitor';

export default class ErrorMonitor {
  // 保存 XMLHttpRequest 原有的发送方法
  private xmlHttpRequestSend;
  // 保存原有的 fetch 方法
  private fetch;

  constructor(pid: string, reportTarget: string) {
    // 监控 JavaScript 异常和资源加载错误，并重写 API 请求方法
    this.activeJsErrorMonitor();
    this.activeResourceErrorMonitor();
    this.rewriteXMLHttpRequest();
    this.rewriteFetch();

    // 创建 crushMonitor 的实例，监控页面奔溃
    new CrushMonitor((data: any) => this.ErrorReporter('crush', data), pid, reportTarget);
  }

  // 获取 GlobalReportFormer 类的实例，并使用 ReportType.Error 参数来创建 ErrorReportFormer 方法
  private ErrorReportFormer = GlobalReportFormer.getReportFormer(ReportType.Error);
  // 创建 ErrorReporter 方法
  private ErrorReporter = (name: string, data?: any) => ReporterController.report(this.ErrorReportFormer(name, data));

  // 监控 JavaScript 异常
  private activeJsErrorMonitor() {
    window.addEventListener('error', error => {
      if (error) {
        // 使用 ErrorReporter 方法上报 JavaScript 异常
        this.ErrorReporter('js-error', error);
      }
    });
    window.addEventListener('unhandledrejection', error => {
      if (error) {
        // 使用 ErrorReporter 方法上报 JavaScript 异常
        this.ErrorReporter('js-error', error);
        // 向上层抛出错误，使其在控制台显示
        throw error;
      }
    });
  }

  // 监控资源加载错误
  private activeResourceErrorMonitor() {
    window.addEventListener(
      'error',
      e => {
        // 注意区分 js error
        const target = e.target || e.srcElement;
        if (!target) {
          return;
        }
        if (target instanceof HTMLElement) {
          let url;
          // 区分 link 标签，获取静态资源地址
          if (target.tagName.toLowerCase() === 'link') {
            url = target.getAttribute('href');
          } else {
            url = target.getAttribute('src');
          }
          // 使用 ErrorReporter 方法上报资源加载错误
          this.ErrorReporter('resource-error', { url });
        }
      },
      true
    );
  }

  // 重写 XMLHttpRequest 请求方法
  private rewriteXMLHttpRequest() {
    if (!window.XMLHttpRequest) return;
    // 没有 XMLHttpRequest 实例，结束
    const report = this.ErrorReporter;
    const xmlhttp = window.XMLHttpRequest;
    const _oldSend = xmlhttp.prototype.send;
    this.xmlHttpRequestSend = _oldSend;
    const _handleEvent = function (event) {
      // 只有 API 请求失败时才上报错误
      if (event && event.currentTarget && event.currentTarget.status !== 200) {
        report('api-error', event);
      }
    };
    xmlhttp.prototype.send = function () {
      if (this['addEventListener']) {
        this['addEventListener']('error', _handleEvent);
        this['addEventListener']('load', _handleEvent);
        this['addEventListener']('abort', _handleEvent);
      } else {
        var _oldStateChange = this['onreadystatechange'];
        this['onreadystatechange'] = function (event) {
          if (this.readyState === 4) {
            _handleEvent(event);
          }
          _oldStateChange && _oldStateChange.apply(this, arguments);
        };
      }
      // 调用 XMLHttpRequest 原有的 send 方法
      return _oldSend.apply(this, arguments);
    };
  }

  // 重写 Fetch API 请求方法
  private rewriteFetch() {
    if (!window.fetch) return;
    const report = this.ErrorReporter;
    const _oldFetch = window.fetch;
    this.fetch = _oldFetch;
    window.fetch = function () {
      return _oldFetch
        .apply(this, arguments)
        .then(res => {
          // 只有 API 请求失败时才上报错误
          if (!res.ok) {
            report('api-error', res);
          }
          return res;
        })
        .catch(error => {
          // 使用 ErrorReporter 方法上报 API 请求错误
          report('api-error', error);
          // 向上层抛出错误，使其在控制台显示
          throw error;
        });
    };
  }

  // 恢复对 XMLHttpRequest 和 Fetch API 的重写
  recoverApiRewrite() {
    window.XMLHttpRequest.prototype.send = this.xmlHttpRequestSend;
    window.fetch = this.fetch;
  }
}
