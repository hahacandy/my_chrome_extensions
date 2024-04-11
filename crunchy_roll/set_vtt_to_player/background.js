async function asyncExecuteScript(tabId, details) {
    var result = await getExecuteScriptPromise(tabId, details)
        .then((result) => {return result;})
        .catch((ex) => {console.log("asyncExecuteScript = " + ex.message);});
    return result;   
}
const getExecuteScriptPromise = (...args) => {
    return new Promise((resolve, reject) => {
        chrome.tabs.executeScript(...args, () => {
            let lastError = chrome.runtime.lastError;
            if (lastError) return reject(lastError);
            resolve(true);
        });
    });
}

chrome.runtime.onInstalled.addListener(function() {
  chrome.webRequest.onBeforeRequest.addListener(
    async function(details) {
		
		vttPos = details.url.indexOf(".vtt");
		if (vttPos > 0) {
			urlAttribPos = details.url.indexOf("?");
			if (vttPos < urlAttribPos || urlAttribPos < 0) {
				let tabId = details.tabId;
				if (tabId < 0) return;
				let requestVtt = details.url;
				
				console.log(requestVtt);
				console.log(tabId);
				
				chrome.storage.local.set({"vtt_url": requestVtt});
				
				chrome.storage.sync.set({'vtt_url': requestVtt}, function() {
				  console.log('Settings saved');
				});

				
			}
		}

    },
    { urls: ["<all_urls>"] }
  );
});
