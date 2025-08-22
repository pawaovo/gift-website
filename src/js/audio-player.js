/**
 * 音频播放器模块
 * 负责音频播放控制和唱片动画
 */

import { LyricsParser } from './lyrics-parser.js';

export class AudioPlayer {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
    this.currentTrack = null;
    this.volume = 0.7;
    this.elements = {};
    this.callbacks = {
      onPlay: [],
      onPause: [],
      onTrackChange: [],
      onError: []
    };

    // 新增：进度和歌词相关属性
    this.lyricsParser = new LyricsParser();

    this.init();
  }

  /**
   * 初始化音频播放器
   */
  init() {
    this.cacheElements();
    this.createAudioElement();
    this.bindEvents();
    this.setupAudioEvents();
  }

  /**
   * 缓存DOM元素
   */
  cacheElements() {
    this.elements = {
      playControlBtn: document.getElementById('playControlBtn'),
      playIcon: document.getElementById('playIcon'),
      pauseIcon: document.getElementById('pauseIcon'),
      vinylRecord: document.querySelector('.vinyl-record'),
      vinylImage: document.querySelector('.vinyl-image'),
      audioPlayer: document.getElementById('audioPlayer'),
      // 新增：进度和歌词相关元素
      progressFill: document.getElementById('progressFill'),
      progressBar: document.getElementById('progressBar'),
      timeDisplay: document.getElementById('timeDisplay'),
      currentLyric: document.getElementById('currentLyric')
    };

    // 设置唱片旋转动画速度
    if (this.elements.vinylRecord) {
      this.elements.vinylRecord.style.setProperty('animation-duration', '5s', 'important');
    }
  }

  /**
   * 创建音频元素
   */
  createAudioElement() {
    if (this.elements.audioPlayer) {
      this.audio = this.elements.audioPlayer;
    } else {
      this.audio = new Audio();
      this.audio.id = 'audioPlayer';
      this.audio.preload = 'metadata';
      document.body.appendChild(this.audio);
    }

    // 设置初始音量
    this.audio.volume = this.volume;
  }

  /**
   * 绑定控制按钮事件
   */
  bindEvents() {
    // 播放控制按钮事件
    if (this.elements.playControlBtn) {
      this.elements.playControlBtn.addEventListener('click', () => {
        if (this.isPlaying) {
          this.pause();
        } else {
          this.play();
        }
      });
    }

    // 进度条点击事件
    if (this.elements.progressBar) {
      this.elements.progressBar.addEventListener('click', (e) => {
        this.handleProgressBarClick(e);
      });
    }

    // 键盘快捷键支持
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.toggle();
      }
    });

    // 唱片点击播放/暂停
    if (this.elements.vinylRecord) {
      this.elements.vinylRecord.addEventListener('click', () => {
        this.toggle();
      });
    }
  }

  /**
   * 设置音频事件监听
   */
  setupAudioEvents() {
    if (!this.audio) return;

    // 播放开始
    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.updateUI();
      this.startVinylAnimation();
      this.triggerCallbacks('onPlay', { track: this.currentTrack });
    });

    // 播放暂停
    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updateUI();
      this.stopVinylAnimation();
      this.triggerCallbacks('onPause', { track: this.currentTrack });
    });

    // 播放结束
    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.updateUI();
      this.stopVinylAnimation();
    });

    // 时间更新（用于进度条和歌词同步）
    this.audio.addEventListener('timeupdate', () => {
      this.updateProgress();
      this.updateLyrics();
    });

    // 音频元数据加载完成
    this.audio.addEventListener('loadedmetadata', () => {
      this.updateTimeDisplay();
    });

    // 加载错误
    this.audio.addEventListener('error', (e) => {
      console.error('音频加载错误:', e);
      this.triggerCallbacks('onError', {
        error: e,
        track: this.currentTrack
      });
    });

    // 可以播放
    this.audio.addEventListener('canplaythrough', () => {
      console.log('音频已准备就绪:', this.currentTrack);
    });

    // 加载开始
    this.audio.addEventListener('loadstart', () => {
      console.log('开始加载音频:', this.currentTrack);
    });
  }

  /**
   * 播放音频
   */
  async play() {
    if (!this.audio || !this.currentTrack) {
      console.warn('没有可播放的音频');
      return;
    }

    try {
      // 移动端需要用户交互才能播放
      await this.audio.play();
    } catch (error) {
      console.error('播放失败:', error);

      // 处理自动播放策略限制
      if (error.name === 'NotAllowedError') {
        this.showPlayPrompt();
        // 自动播放限制不是真正的错误，不触发错误回调
        return;
      }

      // 只有真正的错误才触发错误回调
      this.triggerCallbacks('onError', {
        error,
        track: this.currentTrack
      });
    }
  }

  /**
   * 暂停音频
   */
  pause() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  /**
   * 切换播放/暂停
   */
  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * 停止播放
   */
  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }

  /**
   * 切换音轨
   * @param {string} trackUrl - 音轨URL
   * @param {string} albumImageUrl - 专辑图片URL
   * @param {string} lyricsUrl - 歌词文件URL
   */
  async changeTrack(trackUrl, albumImageUrl = null, lyricsUrl = null) {
    if (!trackUrl) {
      console.warn('无效的音轨URL');
      return;
    }

    const wasPlaying = this.isPlaying;

    // 停止当前播放并重置显示
    this.stop();
    this.resetProgress();

    // 更新音轨
    this.currentTrack = trackUrl;
    this.audio.src = trackUrl;

    // 更新专辑图片
    if (albumImageUrl) {
      this.updateAlbumImage(albumImageUrl);
    }

    // 加载歌词
    await this.loadLyrics(lyricsUrl);

    // 预加载新音轨
    try {
      await this.preloadTrack();

      // 如果之前在播放，自动播放新音轨
      if (wasPlaying) {
        await this.play();
      }

      this.triggerCallbacks('onTrackChange', {
        track: this.currentTrack,
        albumImage: albumImageUrl,
        lyrics: lyricsUrl,
        wasPlaying
      });

    } catch (error) {
      console.error('切换音轨失败:', error);
      this.triggerCallbacks('onError', {
        error,
        track: this.currentTrack
      });
    }
  }

  /**
   * 更新专辑图片
   * @param {string} imageUrl - 图片URL
   */
  updateAlbumImage(imageUrl) {
    if (this.elements.vinylImage && imageUrl) {
      this.elements.vinylImage.src = imageUrl;
      this.elements.vinylImage.alt = '专辑封面';
      console.log('专辑图片已更新:', imageUrl);
    }
  }

  /**
   * 预加载音轨
   */
  preloadTrack() {
    return new Promise((resolve, reject) => {
      if (!this.audio) {
        reject(new Error('音频元素不存在'));
        return;
      }

      const handleCanPlay = () => {
        this.audio.removeEventListener('canplaythrough', handleCanPlay);
        this.audio.removeEventListener('error', handleError);
        resolve();
      };

      const handleError = (e) => {
        this.audio.removeEventListener('canplaythrough', handleCanPlay);
        this.audio.removeEventListener('error', handleError);
        reject(e);
      };

      this.audio.addEventListener('canplaythrough', handleCanPlay);
      this.audio.addEventListener('error', handleError);

      // 开始加载
      this.audio.load();
    });
  }

  /**
   * 设置音量
   * @param {number} volume - 音量值 (0-1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  /**
   * 获取当前音量
   * @returns {number} 当前音量
   */
  getVolume() {
    return this.volume;
  }

  /**
   * 静音/取消静音
   */
  toggleMute() {
    if (this.audio) {
      this.audio.muted = !this.audio.muted;
    }
  }

  /**
   * 更新UI状态
   */
  updateUI() {
    // 更新播放控制按钮图标
    if (this.elements.playIcon && this.elements.pauseIcon) {
      if (this.isPlaying) {
        this.elements.playIcon.style.display = 'none';
        this.elements.pauseIcon.style.display = 'inline';
      } else {
        this.elements.playIcon.style.display = 'inline';
        this.elements.pauseIcon.style.display = 'none';
      }
    }

    // 更新按钮的aria-label
    if (this.elements.playControlBtn) {
      this.elements.playControlBtn.setAttribute('aria-label',
        this.isPlaying ? '暂停音乐' : '播放音乐');
    }
  }

  /**
   * 开始唱片旋转动画
   */
  startVinylAnimation() {
    if (this.elements.vinylRecord) {
      this.elements.vinylRecord.classList.add('playing');
    }
  }

  /**
   * 停止唱片旋转动画
   */
  stopVinylAnimation() {
    if (this.elements.vinylRecord) {
      this.elements.vinylRecord.classList.remove('playing');
    }
  }

  /**
   * 显示播放提示（用于处理自动播放限制）
   */
  showPlayPrompt() {
    // 可以在这里显示一个提示，告诉用户需要手动点击播放
    console.log('请点击播放按钮开始播放音乐');

    // 可以添加视觉提示
    if (this.elements.playControlBtn) {
      this.elements.playControlBtn.classList.add('pulse-animation');
      setTimeout(() => {
        this.elements.playControlBtn.classList.remove('pulse-animation');
      }, 2000);
    }
  }

  /**
   * 获取播放状态
   * @returns {boolean} 是否正在播放
   */
  isCurrentlyPlaying() {
    return this.isPlaying;
  }

  /**
   * 获取当前音轨
   * @returns {string} 当前音轨URL
   */
  getCurrentTrack() {
    return this.currentTrack;
  }

  /**
   * 获取当前播放时间
   * @returns {number} 当前播放时间（秒）
   */
  getCurrentTime() {
    return this.audio ? this.audio.currentTime : 0;
  }

  /**
   * 获取音频总时长
   * @returns {number} 音频总时长（秒）
   */
  getDuration() {
    return this.audio ? this.audio.duration : 0;
  }

  /**
   * 跳转到指定百分比位置
   * @param {number} percent - 百分比位置 (0-1)
   */
  seekToPercent(percent) {
    if (!this.audio || !this.audio.duration) return;

    const targetTime = Math.max(0, Math.min(1, percent)) * this.audio.duration;
    this.seekTo(targetTime);
  }

  /**
   * 重置进度条和时间显示
   */
  resetProgress() {
    // 重置进度条填充
    if (this.elements.progressFill) {
      this.elements.progressFill.style.width = '0%';
    }

    // 重置时间显示
    if (this.elements.timeDisplay) {
      this.elements.timeDisplay.textContent = '00:00 / 00:00';
    }
  }

  /**
   * 添加事件回调
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }

  /**
   * 移除事件回调
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (this.callbacks[event]) {
      const index = this.callbacks[event].indexOf(callback);
      if (index > -1) {
        this.callbacks[event].splice(index, 1);
      }
    }
  }

  /**
   * 触发事件回调
   * @param {string} event - 事件名称
   * @param {Object} data - 事件数据
   */
  triggerCallbacks(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`音频播放器回调错误 (${event}):`, error);
        }
      });
    }
  }



  /**
   * 处理进度条点击事件
   * @param {MouseEvent} e - 点击事件对象
   */
  handleProgressBarClick(e) {
    if (!this.audio || !this.elements.progressBar) return;

    // 获取进度条的边界信息
    const rect = this.elements.progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progressWidth = rect.width;

    // 边界检查：确保点击在进度条范围内
    if (clickX < 0 || clickX > progressWidth) {
      return;
    }

    // 计算点击位置的百分比
    const clickPercent = Math.max(0, Math.min(1, clickX / progressWidth));

    // 检查音频是否已加载且有有效的时长
    if (!this.audio.duration || isNaN(this.audio.duration)) {
      console.warn('音频尚未加载完成，无法跳转');
      return;
    }

    // 计算目标时间
    const newTime = clickPercent * this.audio.duration;

    // 执行跳转
    this.seekTo(newTime);
  }

  /**
   * 跳转到指定时间
   * @param {number} time - 目标时间（秒）
   */
  seekTo(time) {
    if (!this.audio || !this.audio.duration) return;

    // 确保时间在有效范围内
    const targetTime = Math.max(0, Math.min(time, this.audio.duration));

    try {
      // 设置音频播放位置
      this.audio.currentTime = targetTime;

      // 立即更新UI显示，不等待timeupdate事件
      this.updateProgress();
      this.updateLyrics();

      console.log(`跳转到时间: ${this.formatTime(targetTime)}`);
    } catch (error) {
      console.error('跳转失败:', error);
    }
  }

  /**
   * 更新播放进度
   */
  updateProgress() {
    if (!this.audio || !this.elements.progressFill) return;

    const currentTime = this.audio.currentTime;
    const duration = this.audio.duration;

    if (duration && !isNaN(duration)) {
      const progress = (currentTime / duration) * 100;
      this.elements.progressFill.style.width = `${progress}%`;
    }

    this.updateTimeDisplay();
  }

  /**
   * 更新时间显示
   */
  updateTimeDisplay() {
    if (!this.audio || !this.elements.timeDisplay) return;

    const currentTime = this.audio.currentTime || 0;
    const duration = this.audio.duration || 0;

    const currentFormatted = this.formatTime(currentTime);
    const durationFormatted = this.formatTime(duration);

    this.elements.timeDisplay.textContent = `${currentFormatted} / ${durationFormatted}`;
  }

  /**
   * 格式化时间显示
   * @param {number} seconds - 秒数
   * @returns {string} 格式化的时间字符串
   */
  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * 更新歌词显示
   */
  updateLyrics() {
    if (!this.audio || !this.elements.currentLyric) return;

    const currentTime = this.audio.currentTime;
    const lyricData = this.lyricsParser.getCurrentLyric(currentTime);

    if (lyricData && lyricData.isNew) {
      // 显示当前歌词
      const lyricText = lyricData.text || '♪ 音乐播放中...';
      this.elements.currentLyric.textContent = lyricText;
    } else if (!lyricData && this.lyricsParser.hasLyrics()) {
      // 没有对应时间的歌词时显示默认文本
      this.elements.currentLyric.textContent = '♪ 音乐播放中...';
    }
  }

  /**
   * 加载歌词文件
   * @param {string} lyricsUrl - 歌词文件URL
   */
  async loadLyrics(lyricsUrl) {
    if (!lyricsUrl) {
      this.lyricsParser.clear();
      if (this.elements.currentLyric) {
        this.elements.currentLyric.textContent = '♪ 音乐播放中...';
      }
      return;
    }

    try {
      console.log('开始加载歌词文件:', lyricsUrl);
      const success = await this.lyricsParser.loadFromURL(lyricsUrl);
      if (success) {
        console.log('歌词加载成功:', lyricsUrl, '共', this.lyricsParser.getAllLyrics().length, '行歌词');
        // 如果正在播放，立即更新歌词显示
        if (this.isPlaying) {
          this.updateLyrics();
        }
      } else {
        console.warn('歌词加载失败或无有效歌词:', lyricsUrl);
        if (this.elements.currentLyric) {
          this.elements.currentLyric.textContent = '♪ 音乐播放中...';
        }
      }
    } catch (error) {
      console.error('加载歌词时出错:', error);
      if (this.elements.currentLyric) {
        this.elements.currentLyric.textContent = '♪ 音乐播放中...';
      }
    }
  }

  /**
   * 销毁音频播放器
   */
  destroy() {
    // 停止播放
    this.stop();

    // 移除事件监听器
    if (this.audio) {
      this.audio.removeEventListener('play', () => {});
      this.audio.removeEventListener('pause', () => {});
      this.audio.removeEventListener('ended', () => {});
      this.audio.removeEventListener('error', () => {});
    }

    // 清空回调
    Object.keys(this.callbacks).forEach(key => {
      this.callbacks[key] = [];
    });

    // 移除音频元素
    if (this.audio && this.audio.parentNode) {
      this.audio.parentNode.removeChild(this.audio);
    }
  }
}
