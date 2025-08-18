/**
 * LRC歌词解析器
 * 负责解析LRC格式歌词文件并提供时间同步功能
 */

export class LyricsParser {
  constructor() {
    this.lyrics = [];
    this.metadata = {};
    this.currentIndex = -1;
  }

  /**
   * 解析LRC歌词内容
   * @param {string} lrcContent - LRC文件内容
   */
  parseLRC(lrcContent) {
    if (!lrcContent || typeof lrcContent !== 'string') {
      console.warn('无效的LRC内容');
      return;
    }

    this.lyrics = [];
    this.metadata = {};
    this.currentIndex = -1;

    const lines = lrcContent.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // 解析元数据标签 [ar:艺术家] [ti:标题] [al:专辑] 等
      const metadataMatch = trimmedLine.match(/^\[(\w+):(.+)\]$/);
      if (metadataMatch) {
        const [, key, value] = metadataMatch;
        this.metadata[key] = value.trim();
        continue;
      }

      // 解析时间戳和歌词 [mm:ss.xx]歌词内容
      const timeMatches = trimmedLine.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)$/);
      if (timeMatches) {
        const [, minutes, seconds, centiseconds, text] = timeMatches;
        const timeInSeconds = this.parseTimeToSeconds(minutes, seconds, centiseconds);
        
        this.lyrics.push({
          time: timeInSeconds,
          text: text.trim() || ''
        });
      }
    }

    // 按时间排序
    this.lyrics.sort((a, b) => a.time - b.time);
    
    console.log(`解析完成: ${this.lyrics.length} 行歌词`, this.metadata);
  }

  /**
   * 将时间转换为秒数
   * @param {string} minutes - 分钟
   * @param {string} seconds - 秒
   * @param {string} centiseconds - 厘秒
   * @returns {number} 总秒数
   */
  parseTimeToSeconds(minutes, seconds, centiseconds) {
    const min = parseInt(minutes, 10);
    const sec = parseInt(seconds, 10);
    const cs = parseInt(centiseconds, 10);
    
    return min * 60 + sec + cs / 100;
  }

  /**
   * 根据当前播放时间获取对应的歌词
   * @param {number} currentTime - 当前播放时间（秒）
   * @returns {Object|null} 当前歌词对象
   */
  getCurrentLyric(currentTime) {
    if (!this.lyrics.length) {
      return null;
    }

    // 找到当前时间对应的歌词索引
    let targetIndex = -1;
    
    for (let i = 0; i < this.lyrics.length; i++) {
      if (this.lyrics[i].time <= currentTime) {
        targetIndex = i;
      } else {
        break;
      }
    }

    // 如果找到了有效的歌词索引
    if (targetIndex >= 0) {
      const currentLyric = this.lyrics[targetIndex];
      
      // 检查是否切换到了新的歌词行
      const indexChanged = targetIndex !== this.currentIndex;
      this.currentIndex = targetIndex;
      
      return {
        text: currentLyric.text,
        time: currentLyric.time,
        index: targetIndex,
        isNew: indexChanged
      };
    }

    return null;
  }

  /**
   * 获取歌词元数据
   * @returns {Object} 元数据对象
   */
  getMetadata() {
    return { ...this.metadata };
  }

  /**
   * 获取所有歌词
   * @returns {Array} 歌词数组
   */
  getAllLyrics() {
    return [...this.lyrics];
  }

  /**
   * 清空歌词数据
   */
  clear() {
    this.lyrics = [];
    this.metadata = {};
    this.currentIndex = -1;
  }

  /**
   * 检查是否有歌词数据
   * @returns {boolean} 是否有歌词
   */
  hasLyrics() {
    return this.lyrics.length > 0;
  }

  /**
   * 从URL加载LRC文件
   * @param {string} url - LRC文件URL
   * @returns {Promise<boolean>} 是否加载成功
   */
  async loadFromURL(url) {
    try {
      console.log('正在请求歌词文件:', url);
      const response = await fetch(url);

      console.log('歌词文件响应状态:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const lrcContent = await response.text();
      console.log('歌词文件内容长度:', lrcContent.length, '字符');
      console.log('歌词文件前100字符:', lrcContent.substring(0, 100));

      this.parseLRC(lrcContent);

      const hasLyrics = this.hasLyrics();
      console.log('歌词解析结果:', hasLyrics ? '成功' : '失败', '共', this.lyrics.length, '行');

      return hasLyrics;
    } catch (error) {
      console.error('加载LRC文件失败:', url, error);
      this.clear();
      return false;
    }
  }
}
