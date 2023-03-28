import { Reporter, ReportType } from "../types/report";

export default class ReportFormer {
  uid: string;
  pid: string;

  constructor(uid: string, pid: string) {
    this.uid = uid;
    this.pid = pid;
  }

  getReportFormer(type: ReportType) {
    return function(name: string, data?: any, BData1?: any, BData2?: any, BData3?: any): Reporter {
      return {
        uid: this.uid,
        pid: this.pid,
        time: Date.now().toString(),
        type, name,
        data,
        BData1, BData2, BData3
      }
    }
  }
}
