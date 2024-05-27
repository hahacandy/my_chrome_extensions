var is_hide_header = false;
var mouse_event_time = new Date();
setInterval(function() {
	try{
		if(new Date().getTime() - mouse_event_time.getTime() >= 5000){ //5초이상 가만히있을시 헤더 사라짐
			is_hide_header = true;
			document.querySelector('#content > div > div > div.erc-large-header').style.display='none';
		}
		
		if(is_hide_header == false)
			document.querySelector('#content > div > div > div.app-body-wrapper > div > div > div.video-player-wrapper > div').style.maxHeight = window.innerHeight-60+'px';
		else
			document.querySelector('#content > div > div > div.app-body-wrapper > div > div > div.video-player-wrapper > div').style.maxHeight = window.innerHeight+'px';
		document.getElementsByClassName('video-player')[0].focus();
	}catch{}
}, 100);

window.addEventListener('mousemove', (event) => {
	if(event.clientY > 100){
		document.querySelector('#content > div > div > div.erc-large-header').style.display='none';
		is_hide_header = true;
	}else{
		document.querySelector('#content > div > div > div.erc-large-header').style.display=''
		is_hide_header = false;
	}
	
	mouse_event_time = new Date(); 
});
