// background.js
console.info("Hello m3u8 Sniffer Background!");

//chrome.tabs.executeScript(tabId?: number, details: extensionTypes.InjectDetails, 
// callback: function)  -&-  (result: any[]) => {...}
async function asyncExecuteScript(tabId, details) {
    var result = await getExecuteScriptPromise(tabId, details)
        .then((result) => {return result;})
        .catch((ex) => {logRuntimeException("asyncExecuteScript = " + ex.message);});
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

// My webRequest.OnBeforeRequest handler
const networkFilters = {
    urls: []
};

chrome.webRequest.onBeforeRequest.addListener(
async function (details) {
    m3u8Pos = details.url.indexOf(".vtt");
    if (m3u8Pos > 0) {
        urlAttribPos = details.url.indexOf("?");
        if (m3u8Pos < urlAttribPos || urlAttribPos < 0) {
            let tabId = details.tabId;
            if (tabId < 0) return;
            let requestM3u8 = details.url;
			console.log(requestM3u8);
			
			var temp_ = `
			var vtt_url_div = document.getElementById("vtt_url_div");
			if(vtt_url_div == null){
				m3u8LayerDiv2 = document.createElement("div");
				m3u8LayerDiv2.id = "vtt_url_div";
				m3u8LayerDiv2.textContent = \`${requestM3u8}\`;
				m3u8LayerDiv2.style.display = "none";
				document.body.appendChild(m3u8LayerDiv2);
			}else{
				var request_vtt = \`${requestM3u8}\`;
				if(vtt_url_div.textContent.split("?").length != request_vtt.split("?")[0])
					vtt_url_div.textContent = request_vtt;
			}

			`;
			
			const temp__ = { code: temp_ };
			await asyncExecuteScript(tabId, temp__);

        }
    }
}, networkFilters);
//#endregion

