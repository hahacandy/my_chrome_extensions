setInterval(function() {
	try{
		document.querySelector('#content > div > div > div.app-body-wrapper > div > div > div.video-player-wrapper > div').style.maxHeight = window.innerHeight-60+'px';
		document.getElementsByClassName('video-player')[0].focus();
	}catch{}
}, 100);
