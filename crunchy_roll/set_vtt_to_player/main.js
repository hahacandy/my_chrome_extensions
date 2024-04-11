function get_vtt_url(){
	var vtt_url_div = document.querySelector('#vtt_url_div');
	if(vtt_url_div != null){
		return vtt_url_div.textContent;
	}else{
		return null;
	}
}

setInterval(function() {
	var vtt_url = get_vtt_url()
	if(vtt_url != null){
		chrome.storage.local.set({"vtt_url": get_vtt_url()});
	}else{
		chrome.storage.local.set({"vtt_url": null});
	}

}, 1000);

setInterval(function() {
	try{
		document.getElementsByClassName('video-player')[0].focus();
		document.querySelector('#content > div > div.app-body-wrapper > div > div > div.video-player-wrapper > div').style.maxHeight = 'calc(120vh - 15.625rem)';
	}catch{}
}, 100);
