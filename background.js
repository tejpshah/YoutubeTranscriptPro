/**
 * TranscriptPro - Professional YouTube Transcript Suite
 * Background service worker for handling extension lifecycle and analytics
 */

class TranscriptProBackground {
  constructor() {
    this.setupEventListeners();
    this.initializeExtension();
  }

  setupEventListeners() {
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstallation(details);
    });

    chrome.runtime.onStartup.addListener(() => {
      this.handleStartup();
    });

    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivation(activeInfo);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });
  }

  async handleInstallation(details) {
    console.log('TranscriptPro installed/updated:', details.reason);
    
    // Initialize default settings and analytics
    await this.initializeSettings();
    await this.trackInstallation(details.reason);

    // Show welcome message for new installations
    if (details.reason === 'install') {
      await this.showWelcomeMessage();
    }
  }

  async handleStartup() {
    console.log('TranscriptPro browser startup');
    await this.trackUsage('startup');
  }

  async handleTabActivation(activeInfo) {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (tab.url && tab.url.includes('youtube.com/watch')) {
        await this.trackUsage('youtube_tab_activated');
      }
    } catch (error) {
      // Tab might not be accessible
    }
  }

  async handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com/watch')) {
      await this.trackUsage('youtube_page_loaded');
    }
  }

  async initializeExtension() {
    // Set up any background tasks
    await this.cleanupOldData();
  }

  async initializeSettings() {
    const defaultSettings = {
      autoRefresh: true,
      defaultFormat: 'txt',
      clearOnClose: false,
      version: '3.0.0'
    };

    const defaultStats = {
      totalVideos: 0,
      totalTranscripts: 0,
      totalWords: 0,
      avgDuration: '0m',
      installDate: Date.now(),
      lastUsed: Date.now()
    };

    try {
      const result = await chrome.storage.local.get(['transcriptProSettings', 'transcriptProStats']);
      
      if (!result.transcriptProSettings) {
        await chrome.storage.local.set({ transcriptProSettings: defaultSettings });
      }
      
      if (!result.transcriptProStats) {
        await chrome.storage.local.set({ transcriptProStats: defaultStats });
      }
    } catch (error) {
      console.error('Error initializing settings:', error);
    }
  }

  async getSettings() {
    try {
      const result = await chrome.storage.local.get(['transcriptProSettings']);
      return result.transcriptProSettings || {};
    } catch (error) {
      console.error('Error getting settings:', error);
      return {};
    }
  }

  async trackInstallation(reason) {
    try {
      const analytics = await chrome.storage.local.get(['transcriptProAnalytics']);
      const analyticsData = analytics.transcriptProAnalytics || {
        installations: [],
        usage: []
      };

      analyticsData.installations.push({
        reason,
        timestamp: Date.now(),
        version: '3.0.0'
      });

      // Keep only last 100 installation events
      analyticsData.installations = analyticsData.installations.slice(-100);

      await chrome.storage.local.set({ transcriptProAnalytics: analyticsData });
    } catch (error) {
      console.error('Error tracking installation:', error);
    }
  }

  async trackUsage(action) {
    try {
      const analytics = await chrome.storage.local.get(['transcriptProAnalytics']);
      const analyticsData = analytics.transcriptProAnalytics || {
        installations: [],
        usage: []
      };

      analyticsData.usage.push({
        action,
        timestamp: Date.now()
      });

      // Keep only last 1000 usage events
      analyticsData.usage = analyticsData.usage.slice(-1000);

      await chrome.storage.local.set({ transcriptProAnalytics: analyticsData });

      // Update last used timestamp
      const stats = await chrome.storage.local.get(['transcriptProStats']);
      if (stats.transcriptProStats) {
        stats.transcriptProStats.lastUsed = Date.now();
        await chrome.storage.local.set({ transcriptProStats: stats.transcriptProStats });
      }
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  }

  async showWelcomeMessage() {
    // Create a welcome tab or notification
    try {
      const welcomeUrl = chrome.runtime.getURL('welcome.html');
      await chrome.tabs.create({ url: welcomeUrl });
    } catch (error) {
      // Fallback to console message
      console.log('Welcome to TranscriptPro! Professional YouTube transcript extraction at your fingertips.');
    }
  }

  async cleanupOldData() {
    try {
      const settings = await this.getSettings();
      
      if (settings.clearOnClose) {
        // Clear temporary data but keep settings and stats
        const keysToKeep = ['transcriptProSettings', 'transcriptProStats', 'transcriptProAnalytics'];
        const allKeys = await chrome.storage.local.get(null);
        
        for (const key of Object.keys(allKeys)) {
          if (!keysToKeep.includes(key)) {
            await chrome.storage.local.remove(key);
          }
        }
      }

      // Clean up old activities (keep only last 50)
      const activities = await chrome.storage.local.get(['transcriptProActivities']);
      if (activities.transcriptProActivities && activities.transcriptProActivities.length > 50) {
        const trimmed = activities.transcriptProActivities.slice(-50);
        await chrome.storage.local.set({ transcriptProActivities: trimmed });
      }

    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Initialize the background service
new TranscriptProBackground();