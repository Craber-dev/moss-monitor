/**
 * FPSCounter类用于实时获取浏览器的FPS，并将其存储到fps变量中。
 */
class FPSCounter {
  private fps: number = 0; // 当前帧率
  private lastFrameTime: number = 0; // 上一帧的时间戳
  private frameCount: number = 0; // 当前帧数
  private fpsCallback: (fps: number) => any; // 用于存储当前FPS的回调函数

  /**
   * 构造函数用于初始化FPSCounter对象，并启动帧数计数器。
   * @param fpsCallback 用于存储当前FPS的回调函数
   */
  constructor(fpsCallback: (fps: number) => any) {
    this.fpsCallback = fpsCallback;
    this.start();
  }

  /**
   * 用于启动帧数计数器。
   */
  private start() {
    requestAnimationFrame((timestamp) => {
      this.update(timestamp);
    });
  }

  /**
   * 用于更新当前FPS值。
   * @param currentTime 当前时间戳
   */
  private update(currentTime: number) {
    if (currentTime > this.lastFrameTime + 1000) { // 如果已经过了1秒
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFrameTime)); // 计算当前帧率
      this.fpsCallback(this.fps); // 通过回调函数存储当前帧率值
      this.frameCount = 0; // 重置帧数计数器
      this.lastFrameTime = currentTime; // 更新上一帧时间戳为当前时间戳
    } else {
      this.frameCount++; // 帧数加1
    }
    this.start(); // 启动下一帧
  }
}
