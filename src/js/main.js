/**
 * 生日礼物网页主逻辑
 * 协调主题切换和音频播放功能
 */

import { ThemeSwitcher } from './theme-switcher.js';
import { AudioPlayer } from './audio-player.js';

class BirthdayApp {
  constructor() {
    this.themeSwitcher = null;
    this.audioPlayer = null;
    this.isInitialized = false;

    this.init();
  }

  /**
   * 初始化应用
   */
  async init() {
    try {
      // 等待DOM加载完成
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // 初始化组件
      await this.initializeComponents();

      // 绑定组件间的交互
      this.bindComponentInteractions();

      // 设置全局事件监听
      this.setupGlobalEvents();

      // 应用初始主题
      this.applyInitialTheme();

      this.isInitialized = true;
      console.log('生日礼物网页初始化完成！');

    } catch (error) {
      console.error('应用初始化失败:', error);
    }
  }

  /**
   * 初始化组件
   */
  async initializeComponents() {
    // 初始化音频播放器
    this.audioPlayer = new AudioPlayer();

    // 初始化主题切换器，并传入音频播放器
    this.themeSwitcher = new ThemeSwitcher(this.audioPlayer);

    // 等待组件初始化完成
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * 绑定组件间的交互
   */
  bindComponentInteractions() {
    // 主题切换时更新音频
    this.themeSwitcher.on('onThemeChange', (data) => {
      this.handleThemeChange(data);
    });

    // 主题切换开始时暂停音频
    this.themeSwitcher.on('onTransitionStart', (data) => {
      this.handleThemeTransitionStart(data);
    });

    // 音频播放错误处理
    this.audioPlayer.on('onError', (data) => {
      this.handleAudioError(data);
    });

    // 音频播放状态变化
    this.audioPlayer.on('onPlay', (data) => {
      console.log('开始播放:', data.track);
    });

    this.audioPlayer.on('onPause', (data) => {
      console.log('暂停播放:', data.track);
    });
  }

  /**
   * 处理主题切换
   * @param {Object} data - 主题切换数据
   */
  async handleThemeChange(data) {
    const { theme, index } = data;

    try {
      // 更新页面标题
      this.updatePageTitle(theme);

      // 切换音频到新主题并自动播放
      if (this.audioPlayer && theme.music) {
        await this.audioPlayer.changeTrack(theme.music, theme.album, theme.lyrics);
        await this.attemptAutoPlayAfterThemeChange();
      }

      // 触发主题切换完成事件
      this.onThemeChangeComplete(theme);

    } catch (error) {
      console.error('主题切换处理失败:', error);
    }
  }

  /**
   * 主题切换后尝试自动播放
   */
  async attemptAutoPlayAfterThemeChange() {
    try {
      // 等待音频加载完成后播放
      await new Promise(resolve => setTimeout(resolve, 300));
      await this.audioPlayer.play();
    } catch (error) {
      console.log('主题切换后播放失败:', error.message);
    }
  }

  /**
   * 处理主题切换开始
   * @param {Object} data - 切换数据
   */
  handleThemeTransitionStart(data) {
    // 在主题切换时暂停音频，避免音频切换时的突兀感
    if (this.audioPlayer.isCurrentlyPlaying()) {
      this.audioPlayer.pause();
    }
  }

  /**
   * 处理音频错误
   * @param {Object} data - 错误数据
   */
  handleAudioError(data) {
    console.error('音频播放错误:', data.error);

    // 可以在这里显示用户友好的错误提示
    this.showErrorMessage('音频加载失败，请检查网络连接');
  }

  /**
   * 设置全局事件监听
   */
  setupGlobalEvents() {
    // 页面可见性变化处理
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // 页面隐藏时暂停音频
        this.audioPlayer.pause();
      }
    });

    // 窗口失焦时暂停音频
    window.addEventListener('blur', () => {
      this.audioPlayer.pause();
    });

    // 页面卸载前清理
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // 错误处理
    window.addEventListener('error', (e) => {
      console.error('全局错误:', e.error);
    });

    // 未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (e) => {
      console.error('未处理的Promise拒绝:', e.reason);
    });

    // 移动端特定事件
    this.setupMobileEvents();
  }

  /**
   * 设置移动端特定事件
   */
  setupMobileEvents() {
    // 检测设备类型
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (isMobile || isTouchDevice) {
      // 移动端优化
      this.setupTouchOptimizations();
      this.setupMobileAudioHandling();
      this.setupOrientationHandling();
      this.setupIOSSpecificHandling();
    }

    // 网络状态监听
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        this.handleNetworkChange();
      });
    }

    // 电池状态监听（如果支持）
    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        this.setupBatteryOptimizations(battery);
      });
    }
  }

  /**
   * 设置触摸优化
   */
  setupTouchOptimizations() {
    // 防止双击缩放
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, false);

    // 优化触摸反馈
    const touchElements = document.querySelectorAll('.theme-btn, .play-btn, .pause-btn, .vinyl-record');
    touchElements.forEach(element => {
      element.addEventListener('touchstart', () => {
        element.style.transform = 'scale(0.95)';
      }, { passive: true });

      element.addEventListener('touchend', () => {
        setTimeout(() => {
          element.style.transform = '';
        }, 150);
      }, { passive: true });
    });
  }

  /**
   * 设置移动端音频处理
   */
  setupMobileAudioHandling() {
    // iOS需要用户交互才能播放音频
    const enableAudioContext = () => {
      if (this.audioPlayer && this.audioPlayer.audio) {
        // 创建一个静音的音频播放来解锁音频上下文
        const audio = this.audioPlayer.audio;
        audio.muted = true;
        audio.play().then(() => {
          audio.muted = false;
          audio.pause();
          console.log('音频上下文已解锁');
        }).catch(() => {
          console.log('音频上下文解锁失败');
        });
      }
    };

    // 在第一次用户交互时解锁音频（once: true 自动移除监听器）
    document.addEventListener('touchstart', enableAudioContext, { once: true });
    document.addEventListener('click', enableAudioContext, { once: true });

    // 处理音频中断（电话等）
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        this.audioPlayer.play();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        this.audioPlayer.pause();
      });
    }
  }

  /**
   * 设置屏幕方向处理
   */
  setupOrientationHandling() {
    this.handleOrientationChange = () => {
      // 延迟处理，等待浏览器完成方向切换
      setTimeout(() => {
        // 重新计算布局
        this.recalculateLayout();

        // 在横屏模式下优化显示
        const isLandscape = window.innerWidth > window.innerHeight;
        document.body.classList.toggle('landscape-mode', isLandscape);

        // iOS特定的viewport高度更新
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
          const vh = window.innerHeight * 0.01;
          document.documentElement.style.setProperty('--vh', `${vh}px`);
        }
      }, 100);
    };

    // 监听方向变化（统一处理resize事件）
    window.addEventListener('orientationchange', this.handleOrientationChange);
    window.addEventListener('resize', this.handleOrientationChange);
  }

  /**
   * 设置iOS特定处理
   */
  setupIOSSpecificHandling() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      // iOS Safari地址栏处理 - 初始设置（resize事件已在orientationHandling中统一处理）
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);

      // iOS音频播放优化
      if (this.audioPlayer) {
        this.audioPlayer.on('onError', (data) => {
          if (data.error.name === 'NotAllowedError') {
            this.showIOSAudioPrompt();
          }
        });
      }
    }
  }

  /**
   * 处理网络状态变化
   */
  handleNetworkChange() {
    const connection = navigator.connection;
    const isSlowConnection = connection.effectiveType === 'slow-2g' ||
                           connection.effectiveType === '2g';

    if (isSlowConnection) {
      // 在慢速网络下优化
      this.enableLowBandwidthMode();
    } else {
      this.disableLowBandwidthMode();
    }
  }

  /**
   * 启用低带宽模式
   */
  enableLowBandwidthMode() {
    console.log('启用低带宽模式');

    // 降低音频质量或预加载策略
    if (this.audioPlayer && this.audioPlayer.audio) {
      this.audioPlayer.audio.preload = 'none';
    }

    // 添加低带宽模式类
    document.body.classList.add('low-bandwidth');
  }

  /**
   * 禁用低带宽模式
   */
  disableLowBandwidthMode() {
    if (this.audioPlayer && this.audioPlayer.audio) {
      this.audioPlayer.audio.preload = 'metadata';
    }

    document.body.classList.remove('low-bandwidth');
  }

  /**
   * 设置电池优化
   */
  setupBatteryOptimizations(battery) {
    const handleBatteryChange = () => {
      if (battery.level < 0.2 && !battery.charging) {
        // 电量低时启用省电模式
        this.enablePowerSaveMode();
      } else {
        this.disablePowerSaveMode();
      }
    };

    battery.addEventListener('levelchange', handleBatteryChange);
    battery.addEventListener('chargingchange', handleBatteryChange);

    // 初始检查
    handleBatteryChange();
  }

  /**
   * 启用省电模式
   */
  enablePowerSaveMode() {
    console.log('启用省电模式');

    // 减少动画
    document.body.classList.add('power-save');

    // 降低音频音量
    if (this.audioPlayer) {
      this.audioPlayer.setVolume(0.5);
    }
  }

  /**
   * 禁用省电模式
   */
  disablePowerSaveMode() {
    document.body.classList.remove('power-save');

    // 恢复正常音量
    if (this.audioPlayer) {
      this.audioPlayer.setVolume(0.7);
    }
  }

  /**
   * 重新计算布局
   */
  recalculateLayout() {
    // 触发重排以适应新的屏幕尺寸
    const main = document.querySelector('.main');
    if (main) {
      main.style.height = 'auto';
      setTimeout(() => {
        main.style.height = '';
      }, 0);
    }
  }

  /**
   * 显示iOS音频提示
   */
  showIOSAudioPrompt() {
    const prompt = document.createElement('div');
    prompt.className = 'ios-audio-prompt';
    prompt.innerHTML = `
      <div class="prompt-content">
        <p>请点击播放按钮开始音乐</p>
        <button onclick="this.parentElement.parentElement.remove()">知道了</button>
      </div>
    `;
    prompt.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
    `;

    document.body.appendChild(prompt);
  }

  /**
   * 应用初始主题
   */
  applyInitialTheme() {
    const currentTheme = this.themeSwitcher.getCurrentTheme();

    // 更新页面标题
    this.updatePageTitle(currentTheme);
  }

  /**
   * 更新页面标题
   * @param {Object} theme - 主题对象
   */
  updatePageTitle(theme) {
    document.title = `${theme.title} - 生日快乐 🎂`;
  }

  /**
   * 主题切换完成回调
   * @param {Object} theme - 主题对象
   */
  onThemeChangeComplete(theme) {
    // 可以在这里添加主题切换完成后的特殊效果
    console.log(`主题切换完成: ${theme.name}`);

    // 触发自定义事件
    const event = new CustomEvent('themeChanged', {
      detail: { theme }
    });
    document.dispatchEvent(event);
  }

  /**
   * 显示错误消息
   * @param {string} message - 错误消息
   */
  showErrorMessage(message) {
    // 创建错误提示元素
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 0, 0, 0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 10000;
      font-size: 14px;
      backdrop-filter: blur(10px);
    `;

    document.body.appendChild(errorDiv);

    // 3秒后自动移除
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 3000);
  }

  /**
   * 获取应用状态
   * @returns {Object} 应用状态
   */
  getAppState() {
    return {
      isInitialized: this.isInitialized,
      currentTheme: this.themeSwitcher?.getCurrentTheme(),
      isPlaying: this.audioPlayer?.isCurrentlyPlaying(),
      currentTrack: this.audioPlayer?.getCurrentTrack(),
      volume: this.audioPlayer?.getVolume()
    };
  }

  /**
   * 切换到指定主题
   * @param {number} themeIndex - 主题索引
   */
  switchToTheme(themeIndex) {
    if (this.themeSwitcher) {
      this.themeSwitcher.switchTheme(themeIndex);
    }
  }

  /**
   * 播放/暂停音频
   */
  toggleAudio() {
    if (this.audioPlayer) {
      this.audioPlayer.toggle();
    }
  }

  /**
   * 设置音量
   * @param {number} volume - 音量值 (0-1)
   */
  setVolume(volume) {
    if (this.audioPlayer) {
      this.audioPlayer.setVolume(volume);
    }
  }

  /**
   * 清理资源
   */
  cleanup() {
    if (this.themeSwitcher) {
      this.themeSwitcher.destroy();
    }

    if (this.audioPlayer) {
      this.audioPlayer.destroy();
    }

    this.isInitialized = false;
  }

  /**
   * 重新初始化应用
   */
  async reinitialize() {
    this.cleanup();
    await this.init();
  }
}

// 创建全局应用实例
const app = new BirthdayApp();

// 将应用实例暴露到全局作用域（用于调试）
if (typeof window !== 'undefined') {
  window.birthdayApp = app;
}

// 导出应用类
export default BirthdayApp;

// 导出应用实例
export { app };

// 添加一些实用的全局函数
window.switchTheme = (index) => app.switchToTheme(index);
window.toggleMusic = () => app.toggleAudio();
window.setMusicVolume = (volume) => app.setVolume(volume);
window.getAppStatus = () => app.getAppState();

// 应用加载完成信息
console.log('🎂 生日礼物网页已加载');

// 调试命令提示
console.log('可用的调试命令:');
console.log('- switchTheme(0-2): 切换主题');
console.log('- toggleMusic(): 播放/暂停音乐');
console.log('- setMusicVolume(0-1): 设置音量');
console.log('- getAppStatus(): 获取应用状态');
