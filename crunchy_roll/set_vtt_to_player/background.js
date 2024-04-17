chrome.runtime.onInstalled.addListener(function() {
  chrome.webRequest.onBeforeRequest.addListener(
    async function(details) {
		
		vttPos = details.url.indexOf("sub-f1.vtt");
		if (vttPos > 0) {
			let tabId = details.tabId;
			if (tabId < 0) return;
			let requestVtt = details.url;
			
			chrome.storage.sync.set({'vtt_url': requestVtt}, function() {
				console.log(requestVtt);
				console.log('Settings saved');
			});
			}
		}

    },
    { urls: ["<all_urls>"] }
  );
});
