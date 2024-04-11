setInterval(function() {
	try{
		document.getElementsByClassName('video-player')[0].focus();
		document.querySelector('#content > div > div.app-body-wrapper > div > div > div.video-player-wrapper > div').style.maxHeight = 'calc(120vh - 15.625rem)';
	}catch{}
}, 100);
