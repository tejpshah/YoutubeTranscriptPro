let transcriptData = null;

function extractTranscript() {
  return new Promise((resolve, reject) => {
    // Check if transcript is already open
    let transcriptContainer = document.querySelector('ytd-transcript-segment-list-renderer');
    
    if (!transcriptContainer) {
      // Look for the transcript button - try multiple selectors
      const transcriptButtons = [
        ...document.querySelectorAll('button'),
        ...document.querySelectorAll('[role="button"]')
      ].filter(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
        return text.includes('transcript') || 
               text.includes('show transcript') ||
               ariaLabel.includes('transcript') ||
               ariaLabel.includes('show transcript');
      });
      
      if (transcriptButtons.length === 0) {
        // Try to find "Show more" button first
        const showMoreButton = document.querySelector('tp-yt-paper-button#expand');
        if (showMoreButton && showMoreButton.textContent.includes('Show more')) {
          showMoreButton.click();
          setTimeout(() => extractTranscript().then(resolve).catch(reject), 1000);
          return;
        }
        reject('Transcript button not found');
        return;
      }

      // Click the first transcript button found
      transcriptButtons[0].click();
      
      // Wait for transcript to load
      setTimeout(() => {
        transcriptContainer = document.querySelector('ytd-transcript-segment-list-renderer');
        if (!transcriptContainer) {
          reject('Transcript container not found after clicking');
          return;
        }
        processTranscript(transcriptContainer, resolve, reject);
      }, 2000);
    } else {
      processTranscript(transcriptContainer, resolve, reject);
    }
  });
}

function processTranscript(transcriptContainer, resolve, reject) {
  // Look for transcript segments with the actual structure from the screenshot
  const transcriptSegments = transcriptContainer.querySelectorAll('ytd-transcript-segment-renderer');
  
  if (transcriptSegments.length === 0) {
    reject('No transcript segments found');
    return;
  }

  let transcript = '';
  transcriptSegments.forEach(segment => {
    // Look for the yt-formatted-string with segment-text class
    const textElement = segment.querySelector('yt-formatted-string.segment-text') ||
                       segment.querySelector('yt-formatted-string') ||
                       segment.querySelector('.segment-text');
    
    if (textElement && textElement.textContent) {
      transcript += textElement.textContent.trim() + ' ';
    }
  });

  if (transcript.trim()) {
    const videoTitle = document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string') || 
                     document.querySelector('h1.title') ||
                     document.querySelector('#title h1') ||
                     document.querySelector('h1');
    
    const title = videoTitle ? videoTitle.textContent.trim() : 'YouTube Video';
    const videoUrl = window.location.href;
    
    transcriptData = {
      title: title,
      url: videoUrl,
      transcript: transcript.trim()
    };
    
    resolve(transcriptData);
  } else {
    reject('No transcript text found');
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractTranscript') {
    extractTranscript()
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        sendResponse({ success: false, error: error });
      });
    return true;
  }
  
  if (request.action === 'getTranscript') {
    sendResponse({ success: true, data: transcriptData });
  }
});