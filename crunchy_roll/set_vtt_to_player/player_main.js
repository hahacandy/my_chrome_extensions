var is_hide_header = false;
var mouse_event_time = new Date();

var el_player = null;

setInterval(function() {
	el_player = document.querySelector('#content > div > div > div.app-body-wrapper > div > div > div.video-player-wrapper > div');
	
	if(el_player != null){

		if(new Date().getTime() - mouse_event_time.getTime() >= 3000){ //3초이상 가만히있을시 헤더 사라짐
			is_hide_header = true;
			document.querySelector('#content > div > div > div.erc-large-header').style.display='none';
			document.body.style.overflowY='auto';
		}
		
		if(is_hide_header == false)
			el_player.style.maxHeight = window.innerHeight-60+'px';
		else
			el_player.style.maxHeight = window.innerHeight+'px';
		document.getElementsByClassName('video-player')[0].focus();
		
	}

}, 100);

function set_init() {
	if(el_player != null){

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

	}else{
		setTimeout(set_init, 1000);
	}
}

setTimeout(set_init, 1000);
