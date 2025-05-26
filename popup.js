class TranscriptPro {
  constructor() {
    this.videos = [];
    this.selectedVideos = new Set();
    this.settings = {
      autoRefresh: true,
      defaultFormat: 'txt',
      clearOnClose: false
    };
    this.stats = {
      totalVideos: 0,
      totalTranscripts: 0,
      totalWords: 0,
      avgDuration: '0m'
    };
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.setupTabs();
    await this.loadVideos();
    this.updateDashboard();
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });

    // Search and filter
    document.getElementById('searchInput').addEventListener('input', (e) => {
      this.filterVideos(e.target.value);
    });

    document.getElementById('sortSelect').addEventListener('change', (e) => {
      this.sortVideos(e.target.value);
    });

    // Bulk operations
    document.getElementById('selectAll').addEventListener('change', (e) => {
      this.toggleSelectAll(e.target.checked);
    });

    document.getElementById('bulkCopy').addEventListener('click', () => {
      this.bulkCopyTranscripts();
    });

    document.getElementById('bulkExport').addEventListener('click', () => {
      this.bulkExportTranscripts();
    });

    // Export format selection
    document.querySelectorAll('.export-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const format = e.currentTarget.dataset.format;
        this.exportAllTranscripts(format);
      });
    });

    // Settings
    document.getElementById('autoRefresh').addEventListener('change', (e) => {
      this.updateSetting('autoRefresh', e.target.checked);
    });

    document.getElementById('defaultFormat').addEventListener('change', (e) => {
      this.updateSetting('defaultFormat', e.target.value);
    });

    document.getElementById('clearOnClose').addEventListener('change', (e) => {
      this.updateSetting('clearOnClose', e.target.checked);
    });
  }

  setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const panes = document.querySelectorAll('.tab-pane');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        // Update tab states
        tabs.forEach(t => t.classList.remove('active'));
        panes.forEach(p => p.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
        
        // Add smooth transition
        this.animateTabSwitch(targetTab);
      });
    });
  }

  animateTabSwitch(tabName) {
    const pane = document.getElementById(tabName);
    pane.style.opacity = '0';
    pane.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
      pane.style.transition = 'all 0.3s ease';
      pane.style.opacity = '1';
      pane.style.transform = 'translateY(0)';
    }, 50);
  }

  async loadVideos() {
    try {
      this.showLoading('videoList');
      
      const tabs = await chrome.tabs.query({});
      const youtubeTabs = tabs.filter(tab => 
        tab.url && tab.url.includes('youtube.com/watch')
      );

      this.videos = youtubeTabs.map(tab => ({
        id: tab.id,
        title: tab.title || this.extractVideoTitle(tab.url),
        url: tab.url,
        videoId: this.extractVideoId(tab.url),
        timestamp: Date.now(),
        transcript: null,
        wordCount: 0,
        duration: null,
        channel: null
      }));

      this.stats.totalVideos = this.videos.length;
      
      this.hideLoading('videoList');
      this.renderVideoList();
      this.updateDashboard();

    } catch (error) {
      this.hideLoading('videoList');
      this.showToast('Failed to load YouTube videos', 'error');
      console.error('Error loading videos:', error);
    }
  }

  renderVideoList() {
    const container = document.getElementById('videoList');
    
    if (this.videos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎥</div>
          <div class="empty-title">No YouTube videos found</div>
          <div class="empty-desc">Open some YouTube videos in new tabs to extract their transcripts</div>
        </div>
      `;
      return;
    }

    container.innerHTML = this.videos.map(video => `
      <div class="video-item ${this.selectedVideos.has(video.id) ? 'selected' : ''}" data-video-id="${video.id}">
        <input type="checkbox" class="video-checkbox" ${this.selectedVideos.has(video.id) ? 'checked' : ''}>
        <div class="video-thumbnail">🎬</div>
        <div class="video-details">
          <div class="video-title" title="${video.title}">${video.title}</div>
          <div class="video-metadata">
            <span>ID: ${video.videoId}</span>
            ${video.wordCount > 0 ? `<span>${video.wordCount} words</span>` : ''}
            ${video.duration ? `<span>${video.duration}</span>` : ''}
          </div>
        </div>
        <div class="video-actions">
          <button class="action-btn copy" data-action="copy">Copy</button>
          <button class="action-btn preview" data-action="preview">Preview</button>
          <button class="action-btn switch" data-action="switch">View</button>
        </div>
      </div>
    `).join('');

    // Add event listeners to video items
    container.querySelectorAll('.video-item').forEach(item => {
      const videoId = parseInt(item.dataset.videoId);
      const checkbox = item.querySelector('.video-checkbox');
      
      checkbox.addEventListener('change', (e) => {
        this.toggleVideoSelection(videoId, e.target.checked);
      });

      item.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          this.handleVideoAction(videoId, action, btn);
        });
      });
    });
  }

  async handleVideoAction(videoId, action, button) {
    const video = this.videos.find(v => v.id === videoId);
    if (!video) return;

    const originalText = button.textContent;

    try {
      switch (action) {
        case 'copy':
          await this.copyVideoTranscript(video, button);
          break;
        case 'preview':
          await this.previewVideoTranscript(video);
          break;
        case 'switch':
          this.switchToTab(videoId);
          break;
      }
    } catch (error) {
      button.textContent = originalText;
      this.showToast(`Failed to ${action} transcript`, 'error');
    }
  }

  async copyVideoTranscript(video, button) {
    button.disabled = true;
    button.textContent = '⏳';

    try {
      if (!video.transcript) {
        const response = await chrome.tabs.sendMessage(video.id, { 
          action: 'extractTranscript' 
        });

        if (!response.success) {
          throw new Error(response.error || 'Failed to extract transcript');
        }

        video.transcript = response.data.transcript;
        video.title = response.data.title;
        video.wordCount = this.countWords(video.transcript);
      }

      const formattedText = this.formatTranscript(video, 'txt');
      await navigator.clipboard.writeText(formattedText);
      
      button.textContent = '✅';
      this.showToast('Transcript copied to clipboard!', 'success');
      
      // Update stats
      this.updateStats();
      this.saveActivity('copy', video);

      setTimeout(() => {
        button.textContent = 'Copy';
        button.disabled = false;
      }, 2000);

    } catch (error) {
      button.textContent = 'Copy';
      button.disabled = false;
      throw error;
    }
  }

  async previewVideoTranscript(video) {
    if (!video.transcript) {
      const response = await chrome.tabs.sendMessage(video.id, { 
        action: 'extractTranscript' 
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to extract transcript');
      }

      video.transcript = response.data.transcript;
      video.title = response.data.title;
      video.wordCount = this.countWords(video.transcript);
    }

    // Show preview modal
    this.showTranscriptPreview(video);
  }

  showTranscriptPreview(video) {
    const preview = video.transcript.substring(0, 300) + (video.transcript.length > 300 ? '...' : '');
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    modal.innerHTML = `
      <div style="background: white; border-radius: 12px; padding: 24px; max-width: 400px; max-height: 500px; overflow-y: auto;">
        <h3 style="margin: 0 0 16px; color: #495057;">${video.title}</h3>
        <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; font-size: 14px; line-height: 1.5; color: #495057; margin-bottom: 16px;">
          ${preview}
        </div>
        <div style="text-align: right;">
          <button style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;" onclick="this.closest('[style*=fixed]').remove()">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  switchToTab(tabId) {
    chrome.tabs.update(tabId, { active: true });
    window.close();
  }

  toggleVideoSelection(videoId, selected) {
    if (selected) {
      this.selectedVideos.add(videoId);
    } else {
      this.selectedVideos.delete(videoId);
    }

    this.updateBulkActions();
    this.renderVideoList();
  }

  toggleSelectAll(selectAll) {
    if (selectAll) {
      this.videos.forEach(video => this.selectedVideos.add(video.id));
    } else {
      this.selectedVideos.clear();
    }

    this.updateBulkActions();
    this.renderVideoList();
  }

  updateBulkActions() {
    const selectedCount = this.selectedVideos.size;
    const bulkCopyBtn = document.getElementById('bulkCopy');
    const bulkExportBtn = document.getElementById('bulkExport');

    bulkCopyBtn.disabled = selectedCount === 0;
    bulkExportBtn.disabled = selectedCount === 0;

    if (selectedCount > 0) {
      bulkCopyBtn.textContent = `Copy Selected (${selectedCount})`;
      bulkExportBtn.textContent = `Export Selected (${selectedCount})`;
    } else {
      bulkCopyBtn.textContent = 'Copy Selected';
      bulkExportBtn.textContent = 'Export Selected';
    }
  }

  async bulkCopyTranscripts() {
    const selectedVideos = this.videos.filter(v => this.selectedVideos.has(v.id));
    let allTranscripts = [];

    const bulkBtn = document.getElementById('bulkCopy');
    bulkBtn.disabled = true;
    bulkBtn.textContent = '⏳ Processing...';

    try {
      for (const video of selectedVideos) {
        if (!video.transcript) {
          const response = await chrome.tabs.sendMessage(video.id, { 
            action: 'extractTranscript' 
          });

          if (response.success) {
            video.transcript = response.data.transcript;
            video.title = response.data.title;
            video.wordCount = this.countWords(video.transcript);
          }
        }

        if (video.transcript) {
          allTranscripts.push(this.formatTranscript(video, 'txt'));
        }
      }

      const combinedTranscripts = allTranscripts.join('\n\n' + '='.repeat(50) + '\n\n');
      await navigator.clipboard.writeText(combinedTranscripts);

      this.showToast(`${allTranscripts.length} transcripts copied to clipboard!`, 'success');
      this.updateStats();

    } catch (error) {
      this.showToast('Failed to copy transcripts', 'error');
    } finally {
      bulkBtn.disabled = false;
      bulkBtn.textContent = 'Copy Selected';
    }
  }

  async bulkExportTranscripts() {
    const format = this.settings.defaultFormat;
    await this.exportSelectedTranscripts(format);
  }

  async exportSelectedTranscripts(format) {
    const selectedVideos = this.videos.filter(v => this.selectedVideos.has(v.id));
    
    if (selectedVideos.length === 0) {
      this.showToast('No videos selected for export', 'error');
      return;
    }

    let exportData = '';
    const transcripts = [];

    for (const video of selectedVideos) {
      if (!video.transcript) {
        const response = await chrome.tabs.sendMessage(video.id, { 
          action: 'extractTranscript' 
        });

        if (response.success) {
          video.transcript = response.data.transcript;
          video.title = response.data.title;
          video.wordCount = this.countWords(video.transcript);
        }
      }

      if (video.transcript) {
        transcripts.push(video);
      }
    }

    switch (format) {
      case 'txt':
        exportData = transcripts.map(v => this.formatTranscript(v, 'txt')).join('\n\n' + '='.repeat(50) + '\n\n');
        break;
      case 'json':
        exportData = JSON.stringify(transcripts.map(v => ({
          title: v.title,
          url: v.url,
          videoId: v.videoId,
          transcript: v.transcript,
          wordCount: v.wordCount,
          extractedAt: new Date().toISOString()
        })), null, 2);
        break;
      case 'csv':
        const csvHeaders = 'Title,URL,Video ID,Word Count,Transcript\n';
        const csvRows = transcripts.map(v => 
          `"${v.title}","${v.url}","${v.videoId}","${v.wordCount}","${v.transcript.replace(/"/g, '""')}"`
        ).join('\n');
        exportData = csvHeaders + csvRows;
        break;
      case 'md':
        exportData = transcripts.map(v => this.formatTranscript(v, 'md')).join('\n\n---\n\n');
        break;
    }

    this.downloadFile(exportData, `transcripts-${Date.now()}.${format}`);
    this.showToast(`${transcripts.length} transcripts exported as ${format.toUpperCase()}`, 'success');
  }

  async exportAllTranscripts(format) {
    // Select all videos for export
    this.videos.forEach(video => this.selectedVideos.add(video.id));
    await this.exportSelectedTranscripts(format);
  }

  formatTranscript(video, format) {
    switch (format) {
      case 'txt':
        return `Title: ${video.title}\nURL: ${video.url}\n\n${video.transcript}`;
      case 'md':
        return `# ${video.title}\n\n**URL:** ${video.url}\n**Video ID:** ${video.videoId}\n**Word Count:** ${video.wordCount}\n\n## Transcript\n\n${video.transcript}`;
      default:
        return video.transcript;
    }
  }

  downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  filterVideos(searchTerm) {
    const items = document.querySelectorAll('.video-item');
    const term = searchTerm.toLowerCase();

    items.forEach(item => {
      const title = item.querySelector('.video-title').textContent.toLowerCase();
      const match = title.includes(term);
      item.style.display = match ? 'flex' : 'none';
    });
  }

  sortVideos(sortBy) {
    let sortedVideos = [...this.videos];

    switch (sortBy) {
      case 'title':
        sortedVideos.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'duration':
        sortedVideos.sort((a, b) => (b.wordCount || 0) - (a.wordCount || 0));
        break;
      case 'recent':
      default:
        sortedVideos.sort((a, b) => b.timestamp - a.timestamp);
        break;
    }

    this.videos = sortedVideos;
    this.renderVideoList();
  }

  updateDashboard() {
    document.getElementById('totalVideos').textContent = this.stats.totalVideos;
    document.getElementById('totalTranscripts').textContent = this.stats.totalTranscripts;
    document.getElementById('totalWords').textContent = this.formatNumber(this.stats.totalWords);
    document.getElementById('avgDuration').textContent = this.stats.avgDuration;
  }

  updateStats() {
    const extractedVideos = this.videos.filter(v => v.transcript);
    this.stats.totalTranscripts = extractedVideos.length;
    this.stats.totalWords = extractedVideos.reduce((sum, v) => sum + (v.wordCount || 0), 0);
    
    if (extractedVideos.length > 0) {
      const avgWords = Math.round(this.stats.totalWords / extractedVideos.length);
      this.stats.avgDuration = this.estimateDuration(avgWords);
    }

    this.updateDashboard();
    this.saveStats();
  }

  estimateDuration(wordCount) {
    // Assume 150 words per minute speaking rate
    const minutes = Math.round(wordCount / 150);
    return minutes > 0 ? `${minutes}m` : '0m';
  }

  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }

  countWords(text) {
    return text.trim().split(/\s+/).length;
  }

  extractVideoId(url) {
    const match = url.match(/v=([^&]+)/);
    return match ? match[1] : 'unknown';
  }

  extractVideoTitle(url) {
    const videoId = this.extractVideoId(url);
    return `Video ${videoId.substring(0, 8)}...`;
  }

  showLoading(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #6c757d;">
        <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid #f1f3f4; border-top: 3px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <div style="margin-top: 16px;">Loading...</div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
  }

  hideLoading(containerId) {
    // Loading will be replaced by actual content
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `status-toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['transcriptProSettings', 'transcriptProStats']);
      
      if (result.transcriptProSettings) {
        this.settings = { ...this.settings, ...result.transcriptProSettings };
      }
      
      if (result.transcriptProStats) {
        this.stats = { ...this.stats, ...result.transcriptProStats };
      }

      // Apply settings to UI
      document.getElementById('autoRefresh').checked = this.settings.autoRefresh;
      document.getElementById('defaultFormat').value = this.settings.defaultFormat;
      document.getElementById('clearOnClose').checked = this.settings.clearOnClose;

    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async updateSetting(key, value) {
    this.settings[key] = value;
    await this.saveSettings();
  }

  async saveSettings() {
    try {
      await chrome.storage.local.set({ transcriptProSettings: this.settings });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  async saveStats() {
    try {
      await chrome.storage.local.set({ transcriptProStats: this.stats });
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  }

  async saveActivity(action, video) {
    try {
      const activities = await chrome.storage.local.get(['transcriptProActivities']);
      const activityList = activities.transcriptProActivities || [];
      
      activityList.unshift({
        action,
        video: {
          title: video.title,
          videoId: video.videoId,
          wordCount: video.wordCount
        },
        timestamp: Date.now()
      });

      // Keep only last 50 activities
      const trimmedActivities = activityList.slice(0, 50);
      await chrome.storage.local.set({ transcriptProActivities: trimmedActivities });

    } catch (error) {
      console.error('Error saving activity:', error);
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TranscriptPro();
});