setInterval(function() {
	try{
		document.querySelector('#content > div > div > div.app-body-wrapper > div > div > div.video-player-wrapper > div').style.maxHeight = 'calc(120vh - 15.625rem)';
		document.getElementsByClassName('video-player')[0].focus();
	}catch{}
}, 100);
