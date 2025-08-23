/**
 * 视频播放器模块
 * 负责自动视频播放和覆盖层管理
 */

export class VideoPlayer {
  constructor() {
    this.videoElement = null;
    this.overlayElement = null;
    this.closeButton = null;
    this.isVideoPlaying = false;
    this.callbacks = {
      onVideoEnd: [],
      onVideoClose: []
    };

    this.init();
  }

  /**
   * 初始化视频播放器
   */
  init() {
    this.createVideoOverlay();
    this.bindEvents();
  }

  /**
   * 创建视频覆盖层
   */
  createVideoOverlay() {
    // 创建覆盖层容器
    this.overlayElement = document.createElement('div');
    this.overlayElement.className = 'video-overlay';
    this.overlayElement.innerHTML = `
      <div class="video-container">
        <video
          class="intro-video"
          src="/videos/hirono.mp4"
          playsinline
          preload="auto"
        ></video>
        <button class="video-close-btn" aria-label="关闭视频">
          <span class="close-icon">✕</span>
        </button>
      </div>
    `;

    // 获取视频元素和关闭按钮
    this.videoElement = this.overlayElement.querySelector('.intro-video');
    this.closeButton = this.overlayElement.querySelector('.video-close-btn');

    // 添加到页面
    document.body.appendChild(this.overlayElement);
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 关闭按钮点击事件
    this.closeButton.addEventListener('click', () => {
      this.closeVideo();
    });

    // 视频播放结束事件
    this.videoElement.addEventListener('ended', () => {
      this.handleVideoEnd();
    });

    // 视频加载完成事件
    this.videoElement.addEventListener('loadeddata', () => {
      console.log('视频加载完成');
    });

    // 视频播放错误事件
    this.videoElement.addEventListener('error', (e) => {
      console.error('视频播放错误:', e);
      this.closeVideo(); // 如果视频播放失败，直接关闭
    });

    // ESC键关闭视频
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVideoPlaying) {
        this.closeVideo();
      }
    });
  }

  /**
   * 自动播放视频
   */
  async autoPlayVideo() {
    if (!this.videoElement) {
      console.error('视频元素不存在');
      return;
    }

    try {
      // 显示覆盖层
      this.showOverlay();
      
      // 尝试自动播放
      await this.videoElement.play();
      this.isVideoPlaying = true;
      console.log('视频开始自动播放');

    } catch (error) {
      console.error('自动播放失败:', error);
      
      // 如果自动播放失败，显示播放提示
      this.showPlayPrompt();
    }
  }

  /**
   * 显示覆盖层
   */
  showOverlay() {
    this.overlayElement.classList.add('visible');
    document.body.classList.add('video-playing');
  }

  /**
   * 隐藏覆盖层
   */
  hideOverlay() {
    this.overlayElement.classList.remove('visible');
    document.body.classList.remove('video-playing');
  }

  /**
   * 关闭视频
   */
  closeVideo() {
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.currentTime = 0;
    }

    this.isVideoPlaying = false;
    this.hideOverlay();

    // 触发关闭回调
    this.triggerCallbacks('onVideoClose');

    console.log('视频已关闭');
  }

  /**
   * 处理视频播放结束
   */
  handleVideoEnd() {
    this.isVideoPlaying = false;
    
    // 触发结束回调
    this.triggerCallbacks('onVideoEnd');
    
    // 自动关闭视频
    setTimeout(() => {
      this.closeVideo();
    }, 1000);
  }

  /**
   * 显示播放提示（当自动播放失败时）
   */
  showPlayPrompt() {
    const playButton = document.createElement('button');
    playButton.className = 'video-play-prompt';
    playButton.innerHTML = `
      <span class="play-icon">▶</span>
      <span class="play-text">点击播放视频</span>
    `;

    playButton.addEventListener('click', async () => {
      try {
        await this.videoElement.play();
        this.isVideoPlaying = true;
        playButton.remove();
      } catch (error) {
        console.error('手动播放失败:', error);
      }
    });

    this.overlayElement.querySelector('.video-container').appendChild(playButton);
  }

  /**
   * 注册回调函数
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }

  /**
   * 触发回调函数
   * @param {string} event - 事件名称
   * @param {*} data - 传递的数据
   */
  triggerCallbacks(event, data = null) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`回调执行错误 (${event}):`, error);
        }
      });
    }
  }

  /**
   * 销毁视频播放器
   */
  destroy() {
    if (this.overlayElement) {
      this.overlayElement.remove();
    }
    
    document.body.classList.remove('video-playing');
    this.callbacks = { onVideoEnd: [], onVideoClose: [] };
  }
}
