/**
 * 主题切换模块
 * 负责管理主题数据和切换逻辑
 */

// 主题配置数据
export const THEMES = [
  {
    id: 0,
    name: '失乐园',
    title: '',
    poem: [
      '像被捞起的鱼',
      '总会有这样的时刻',
      '拼命挣扎',
      '耗尽全部力和勇气',
      '',
      '最后的最后',
      '只剩那个"死孩子"和最里面的东西',
      '直面 等待',
      '恢复生机 悄悄过去'
    ],
    description: '들국화 - 걱정말아요 그대',
    background: '/images/bg1.png',
    music: '/audio/theme1.mp3',
    album: '/images/album1.jpg',
    lyrics: '/lyrics/theme1.lrc',
    colors: {
      primary: 'rgba(255, 182, 193, 0.8)',
      secondary: 'rgba(255, 105, 180, 0.6)',
      accent: 'rgba(255, 20, 147, 0.9)'
    }
  },
  {
    id: 1,
    name: '鸟人',
    title: '',
    poem: [
      '必须要跳下去 淌进河吗',
      '必须要融入一切吗',
      '收紧 包裹',
      '兼容 接受但不服气',
      '',
      '往上跳会发生什么',
      '像鸟一样',
      '他也没那么自由',
      '都是选择',
      '选择什么',
      '选择自己'
    ],
    description: 'Bon Iver - For Emma',
    background: '/images/bg2.png',
    music: '/audio/theme2.mp3',
    album: '/images/album2.jpg',
    lyrics: '/lyrics/theme2.lrc',
    colors: {
      primary: 'rgba(135, 206, 250, 0.8)',
      secondary: 'rgba(70, 130, 180, 0.6)',
      accent: 'rgba(30, 144, 255, 0.9)'
    }
  },
  {
    id: 2,
    name: 'Leo',
    title: '',
    poem: [
      '多运动 多学习',
      '好好吃饭 0.o'
    ],
    description: '楊千嬅 - 勇',
    background: '/images/bg3.png',
    music: '/audio/theme3.mp3',
    album: '/images/album3.jpg',
    lyrics: '/lyrics/theme3.lrc',
    colors: {
      primary: 'rgba(221, 160, 221, 0.8)',
      secondary: 'rgba(186, 85, 211, 0.6)',
      accent: 'rgba(138, 43, 226, 0.9)'
    }
  }
];

// 主题切换器类
export class ThemeSwitcher {
  constructor(audioPlayer = null) {
    this.currentThemeIndex = 0;
    this.isTransitioning = false;
    this.audioPlayer = audioPlayer;
    this.elements = {};
    this.callbacks = {
      onThemeChange: [],
      onTransitionStart: [],
      onTransitionEnd: []
    };

    this.init();
  }

  /**
   * 初始化主题切换器
   */
  init() {
    this.cacheElements();
    this.bindEvents();
    this.loadSavedTheme();
    this.applyTheme(this.currentThemeIndex, false);
  }

  /**
   * 缓存DOM元素
   */
  cacheElements() {
    this.elements = {
      body: document.body,
      themeButtons: document.querySelectorAll('.theme-btn'),
      backgroundImage: document.querySelector('.background-image'),
      blessingText: document.querySelector('.blessing-text'),
      poemContainer: document.querySelector('.poem-container'),
      poemText: document.querySelector('.poem-text'),
      main: document.querySelector('.main')
    };
  }

  /**
   * 绑定事件监听器
   */
  bindEvents() {
    this.elements.themeButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        if (!this.isTransitioning) {
          this.switchTheme(index);
        }
      });
    });

    // 键盘快捷键支持
    document.addEventListener('keydown', (e) => {
      if (e.key >= '1' && e.key <= '3') {
        const themeIndex = parseInt(e.key) - 1;
        if (!this.isTransitioning) {
          this.switchTheme(themeIndex);
        }
      }
    });
  }

  /**
   * 加载保存的主题
   */
  loadSavedTheme() {
    const savedTheme = localStorage.getItem('birthday-theme');
    if (savedTheme !== null) {
      const themeIndex = parseInt(savedTheme);
      if (themeIndex >= 0 && themeIndex < THEMES.length) {
        this.currentThemeIndex = themeIndex;
      }
    }
  }

  /**
   * 保存当前主题
   */
  saveCurrentTheme() {
    localStorage.setItem('birthday-theme', this.currentThemeIndex.toString());
  }

  /**
   * 切换主题
   * @param {number} themeIndex - 主题索引
   */
  async switchTheme(themeIndex) {
    if (themeIndex === this.currentThemeIndex || this.isTransitioning) {
      return;
    }

    this.isTransitioning = true;
    this.triggerCallbacks('onTransitionStart', {
      from: this.currentThemeIndex,
      to: themeIndex
    });

    // 添加切换动画类
    this.elements.main.classList.add('theme-switching');

    try {
      // 预加载新主题背景图片
      await this.preloadThemeBackground(themeIndex);

      // 执行主题切换动画
      await this.performThemeTransition(themeIndex);

      // 更新当前主题索引
      this.currentThemeIndex = themeIndex;

      // 保存主题选择
      this.saveCurrentTheme();

      this.triggerCallbacks('onThemeChange', {
        theme: THEMES[themeIndex],
        index: themeIndex
      });

    } catch (error) {
      console.error('主题切换失败:', error);
    } finally {
      this.isTransitioning = false;
      this.elements.main.classList.remove('theme-switching');
      this.triggerCallbacks('onTransitionEnd', {
        theme: THEMES[this.currentThemeIndex],
        index: this.currentThemeIndex
      });
    }
  }

  /**
   * 预加载主题背景图片
   * @param {number} themeIndex - 主题索引
   */
  preloadThemeBackground(themeIndex) {
    const theme = THEMES[themeIndex];

    // 只预加载背景图片，音频由AudioPlayer处理
    if (theme.background) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        img.src = theme.background;
      });
    }

    return Promise.resolve();
  }

  /**
   * 执行主题切换动画
   * @param {number} themeIndex - 主题索引
   */
  async performThemeTransition(themeIndex) {
    const theme = THEMES[themeIndex];

    // 第一阶段：淡出当前内容
    await this.fadeOutCurrentContent();

    // 第二阶段：更新内容
    this.updateThemeContent(theme);

    // 第三阶段：淡入新内容
    await this.fadeInNewContent();

    // 第四阶段：更新按钮状态
    this.updateButtonStates(themeIndex);
  }

  /**
   * 淡出当前内容
   */
  fadeOutCurrentContent() {
    return new Promise((resolve) => {
      this.elements.backgroundImage.classList.add('fade-out');
      this.elements.blessingText.classList.add('fade-out');
      if (this.elements.poemContainer) {
        this.elements.poemContainer.classList.add('fade-out');
      }

      setTimeout(resolve, 300); // 等待淡出动画完成
    });
  }

  /**
   * 更新主题内容
   * @param {Object} theme - 主题对象
   */
  updateThemeContent(theme) {
    // 更新背景图片
    if (this.elements.backgroundImage && theme.background) {
      this.elements.backgroundImage.src = theme.background;
      this.elements.backgroundImage.alt = `${theme.name}背景`;
    }

    // 更新祝福文字
    if (this.elements.blessingText) {
      const hasTitle = theme.title && theme.title.trim();
      this.elements.blessingText.style.display = hasTitle ? 'block' : 'none';
      if (hasTitle) {
        this.elements.blessingText.textContent = theme.title;
      }
    }

    // 更新诗歌内容
    if (this.elements.poemText && theme.poem) {
      this.updatePoemContent(theme.poem);
    }

    // 更新音频、专辑图片和歌词
    if (this.audioPlayer && theme.music) {
      this.audioPlayer.changeTrack(theme.music, theme.album, theme.lyrics);
    }

    // 更新CSS自定义属性
    this.updateCSSVariables(theme);

    // 更新body的data-theme属性
    this.elements.body.setAttribute('data-theme', theme.id);
  }

  /**
   * 更新诗歌内容
   * @param {Array} poemLines - 诗歌行数组
   */
  updatePoemContent(poemLines) {
    if (!this.elements.poemText) return;

    // 清空现有内容
    this.elements.poemText.innerHTML = '';

    // 添加新的诗歌行
    poemLines.forEach(line => {
      const lineElement = document.createElement('div');
      lineElement.className = line === '' ? 'poem-line poem-break' : 'poem-line';
      lineElement.textContent = line;
      this.elements.poemText.appendChild(lineElement);
    });
  }

  /**
   * 更新CSS自定义属性
   * @param {Object} theme - 主题对象
   */
  updateCSSVariables(theme) {
    const root = document.documentElement;
    const colors = theme.colors;

    root.style.setProperty('--current-primary', colors.primary);
    root.style.setProperty('--current-secondary', colors.secondary);
    root.style.setProperty('--current-accent', colors.accent);
  }

  /**
   * 淡入新内容
   */
  fadeInNewContent() {
    return new Promise((resolve) => {
      // 移除淡出类，触发淡入动画
      this.elements.backgroundImage.classList.remove('fade-out');
      this.elements.blessingText.classList.remove('fade-out');
      if (this.elements.poemContainer) {
        this.elements.poemContainer.classList.remove('fade-out');
      }

      setTimeout(resolve, 300); // 等待淡入动画完成
    });
  }

  /**
   * 更新按钮状态
   * @param {number} activeIndex - 激活的按钮索引
   */
  updateButtonStates(activeIndex) {
    this.elements.themeButtons.forEach((button, index) => {
      button.classList.toggle('active', index === activeIndex);
      button.setAttribute('aria-pressed', index === activeIndex);
    });
  }

  /**
   * 直接应用主题（无动画）
   * @param {number} themeIndex - 主题索引
   * @param {boolean} updateButtons - 是否更新按钮状态
   */
  applyTheme(themeIndex, updateButtons = true) {
    const theme = THEMES[themeIndex];

    this.updateThemeContent(theme);

    if (updateButtons) {
      this.updateButtonStates(themeIndex);
    }

    this.currentThemeIndex = themeIndex;
  }

  /**
   * 获取当前主题
   * @returns {Object} 当前主题对象
   */
  getCurrentTheme() {
    return THEMES[this.currentThemeIndex];
  }

  /**
   * 获取所有主题
   * @returns {Array} 主题数组
   */
  getAllThemes() {
    return THEMES;
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
          console.error(`主题切换回调错误 (${event}):`, error);
        }
      });
    }
  }

  /**
   * 销毁主题切换器
   */
  destroy() {
    // 移除事件监听器
    this.elements.themeButtons.forEach((button, index) => {
      button.replaceWith(button.cloneNode(true));
    });

    // 清空回调
    Object.keys(this.callbacks).forEach(key => {
      this.callbacks[key] = [];
    });
  }
}
