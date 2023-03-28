export enum ReportType {
  Performance = 'performance', // 性能指标
  Stability   = 'stability', // 稳定性指标
  Error       = 'error', // 异常
  Operation   = 'operation', // 业务指标
  Custom      = 'custom', // 自定义事件
}

export interface Reporter {
  uid: string; // 标识唯一用户，可由用户在初始化时自定义
  pid: string; // 标识某次的会话，由系统自动生成
  time: string;
  type: ReportType; // 上报类型
  name: string; // 指标名称
  data?: any; // 上报数据主体
  BData1?: any; // 业务自定义字段，下同·
  BData2?: any;
  BData3?: any;
}
