import { Reporter, ReportType } from "../types/report";

export default class ReportFormer {
  uid?: string;
  pid: string;

  constructor(uid: string, pid: string) {
    this.uid = uid;
    this.pid = pid;
  }

  resetUid(newUid: string) {
    this.uid = newUid;
  }
  resetPid(newPid: string) {
    this.pid = newPid;
  }

  getReportFormer(type: ReportType) {
    const that = this;
    return function(name: string, data?: any, BData1?: any, BData2?: any, BData3?: any): Reporter {
      return {
        uid: that.uid,
        pid: that.pid,
        time: Date.now().toString(),
        type, name,
        data,
        BData1, BData2, BData3
      }
    }
  }
}
