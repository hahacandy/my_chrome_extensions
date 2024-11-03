console.log('background test')
chrome.webRequest.onBeforeRequest.addListener(
	async function(details) {
		vttPos = details.url.indexOf(".vtt");
		if (vttPos > 0 && details.url.includes('en_GB')) {
			urlAttribPos = details.url.indexOf("?");
			if (vttPos < urlAttribPos || urlAttribPos < 0) {
				//let tabId = details.tabId;
				//if (tabId < 0) return;
				let requestVtt = details.url;
				
				chrome.storage.local.set({'vtt_url2': requestVtt}, function() {
					console.log(requestVtt);
					console.log('Settings saved');
				});

			}
		}

	},
	{ urls: ["<all_urls>"] }
);

