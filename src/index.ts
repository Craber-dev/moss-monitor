import ReportFormer from "./utils/report";
import { v4 as uuid } from "uuid";
import Controller from "./controller";
import PerformanceMonitor from "./monitor/performance/performance";
import ErrorMonitor from "./monitor/error/error";

const uid = uuid();
const pid = uuid();
export const GlobalReportFormer = new ReportFormer(uid, pid);
export const ReporterController = new Controller({
  url: '...',
})

function start() {
  new PerformanceMonitor({
    sampleRate: 0.1,
    interval: 5000,
  });
  new ErrorMonitor(pid, '');
}

export default {
  start
};
