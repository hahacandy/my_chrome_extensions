/////////////////////////////// 드래그 가능하게
(function () {
    if (window.subvaAllowRightClick === undefined) {
        // https://greasyfork.org/en/scripts/23772-absolute-enable-right-click-copy/code
        window.subvaAllowRightClick = function (dom) {
            (function GetSelection() {
                var Style = dom.createElement('style');
                Style.type = 'text/css';
                var TextNode = '*{user-select:text!important;-webkit-user-select:text!important;}';
                if (Style.styleSheet) {
                    Style.styleSheet.cssText = TextNode;
                }
                else {
                    Style.appendChild(dom.createTextNode(TextNode));
                }
                dom.getElementsByTagName('head')[0].appendChild(Style);
            })();

        };
        function runAll(w) {
            try {
                window.subvaAllowRightClick(w.document);
            } catch (e) {
            }
            for (var i = 0; i < w.frames.length; i++) {
                runAll(w.frames[i]);
            }
        }
    }	
    runAll(window);
})();

var setCookie = function(name, value, exp) {
	var date = new Date();
	date.setTime(date.getTime() + exp*24*60*60);
	document.cookie = name + '=' + value + ';expires=' + date.toUTCString() + ';path=/';
};
var getCookie = function(name) {
	var value = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
	return value? value[2] : null;
};
function getElementByXpath(path) {
  return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

///////////////////////////
var vtt_url = '';
var latest_vtt_url = '';

////////vtt_url 에서 실제 자막 가져오기
function get_subtitle(){

	x = new XMLHttpRequest();

	x.onload = function () {
		if(x.readyState == '4'){
			if(x.status == '200'){
				all_vtt = x.responseText;
				convert_vtt_to_cue(all_vtt);
			}
		}
	};
	
	x.open("GET", vtt_url);
	x.send();

}


//////////////////가져온 vtt 가공하기
var vtt_cues = [];
function convert_vtt_to_cue(all_vtt){
	vtt_cues = [];
	var temp_split_vtt = all_vtt.split('\r\n\r\n');
	
	for(var i=0; i<temp_split_vtt.length; i++){
		if(temp_split_vtt[i].includes(' --> ') == true){
			
			var split_vt = temp_split_vtt[i].split('\r\n');
			
			var vtt_cue = new Object();
			var text_cue = '';
			
			for(j=0; j<split_vt.length; j++){
				
				if(j==0){
					continue;
				}
				
				if(j==1){
					split_v = split_vt[j].split(' ');
					
					vtt_cue.start = split_v[0];
					var start_split = vtt_cue.start.split(':');
					vtt_cue.start = parseFloat((start_split[0]*60*60))+parseFloat((start_split[1]*60))+parseFloat(start_split[2]);
					
					vtt_cue.end = split_v[2];
					var end_split = vtt_cue.end.split(':');
					vtt_cue.end = parseFloat((end_split[0]*60*60))+parseFloat((end_split[1]*60))+parseFloat(end_split[2]);
				}else{
					
					text_cue = text_cue + split_vt[j];
					
					if(j != split_vt.length-1){
						text_cue = text_cue + '\n';
					}
					
				}
				
			}
			
			//vtt_cue.text = text_cue.replaceAll('\n', ' ');
			vtt_cue.text = text_cue.replaceAll(/(<([^>]+)>)/ig, "");;
			vtt_cues.push(vtt_cue);
			
		}
	}
	//alert("자막 불러오기 완료 \n" + vtt_cues.length + "줄");
}




//////////////////

setInterval(function() {
	
	chrome.storage.sync.get(['vtt_url'], function(items) {
		vtt_url = items['vtt_url']
	});
	
	if(vtt_url != '' && vtt_url != latest_vtt_url && document.querySelector("#vilosVttJs > div") != null){
		latest_vtt_url = vtt_url;
		get_subtitle();
	}
}, 1000);

setInterval(function() {
	var black_screen_div = getElementByXpath('//*[@id="velocity-controls-package"]/div[1]');
	if(black_screen_div != null)
		black_screen_div.style.backgroundColor = 'rgba(0, 0, 0, 0.0)';
}, 100);

//////////// 키보드 누르면 자막 이동 되게

var current_cue_cursor = null;



function get_video_time(mode, vid_current_time){
	
	var subtitle_1_el = document.querySelector('#vilosVttJs > div > div > div > b');
	var current_sub_html = null;
	
	if(subtitle_1_el != null){
		current_sub_html = subtitle_1_el.innerHTML;
	}
	
	var move_time = null;
	
	var move_cursor = null;
	
	if(current_cue_cursor == null){
		for(i=0; i<vtt_cues.length; i++){
			if(vid_current_time < vtt_cues[i].start){
				current_cue_cursor = i;
				break;
			}
		}
	}
	
	if(mode == 'right'){
		move_cursor = current_cue_cursor+1;
	}
	else if(mode == 'left'){
		move_cursor = current_cue_cursor-1;
	}
	else if(mode == 'up'){
		move_cursor = current_cue_cursor;
	}
	
	move_time = vtt_cues[move_cursor].start;

	//console.log(move_time);
	return move_time;
}

var cue_will_stop = false;

function video_event_listener(e, vtt_cues){
	
	cue_will_stop = false
	
	var vid = document.getElementsByTagName('video')[0];
	
	var vid_current_time = vid.currentTime;
	
	var move_time = null;
	
	if (e.code == "KeyA") {
		if(vtt_cues == null || vtt_cues.length == 0){
			var preTime = vid.currentTime - 3;
			if (preTime > 0) {
				vid.currentTime = preTime;
			}
		}else{
			move_time = get_video_time('left', vid_current_time);
		}
	}else if (e.code == "KeyD") {
		if(vtt_cues == null || vtt_cues.length == 0){
			var nextTime = vid.currentTime + 3;
			if (nextTime+3 < vid.duration) {
				vid.currentTime = nextTime;
			}
		}else{
			move_time = get_video_time('right', vid_current_time);
		}
	}else if (e.code == "KeyW") {
		move_time = get_video_time('up', vid_current_time);
	}else if (e.code == "KeyS") {
		if(vid.paused){
			vid.play();
		}else{
			vid.pause();
		}
	}
	
	if(move_time != null){
		vid.currentTime = move_time;
		if(vid.paused)
			vid.play();
	}
}


document.addEventListener("keydown", (event) => video_event_listener(event, vtt_cues));

//////// 원래 자막 숨기기

function remove_ori_subtitle(){
	var ori_subtitle = document.querySelector("#vilosVttJs");
	if(ori_subtitle != null){
		if(ori_subtitle.style.display == ''){
			ori_subtitle.style.display = 'none';
		}			
	}
}

setInterval(remove_ori_subtitle, 1000);

//////////////////////////////////// 커스텀 자막을 생성

function create_subtitle(){
	
	var my_subtitles = document.querySelector('#subtitles');
	
	if(my_subtitles == null){
		
		var temp_ele = document.createElement('div');
		temp_ele.id = 'subtitles';
		
		var temp_ele_1 = document.createElement('div');
		temp_ele_1.id = 'sub_left';
		
		var temp_ele_2 = document.createElement('div');
		temp_ele_2.id = 'sub_center';
		
		var temp_ele_3 = document.createElement('div');
		temp_ele_3.id = 'sub_right';
		var temp_ele_3_1 = document.createElement('div');
		temp_ele_3_1.id = 'sub_right_1';
		var temp_ele_3_2 = document.createElement('div');
		temp_ele_3_2.id = 'sub_right_2';
		temp_ele_3.appendChild(temp_ele_3_1);
		temp_ele_3.appendChild(temp_ele_3_2);
		
		temp_ele.appendChild(temp_ele_1);
		temp_ele.appendChild(temp_ele_2);
		temp_ele.appendChild(temp_ele_3);
		
		var temp_ele2 = document.createElement('div');
		temp_ele2.id = 'subtitle-1';
		var temp_ele3 = document.createElement('div');
		temp_ele3.id = 'subtitle-2';
		
		temp_ele_2.appendChild(temp_ele2);
		temp_ele_2.appendChild(temp_ele3);
		

		document.querySelector('body').appendChild(temp_ele);
		

		// 번역된 자막에 마우스 누르고 위아래 움직 일 수 잇게 하기
		my_subtitles = document.querySelector('#subtitles');
		my_subtitles.style.display = 'none';
		
		target_el = document.querySelector('#sub_right_2');
		

		my_subtitles.style.top = getCookie('subtitle_top'); // 이전 자막 위치 값 불러오기
		
		
		
		let lastX = 0;
		let lastY = 0; 
		let startX = 0; 
		let startY = 0; 
		
		target_el.addEventListener('mousedown', function(e){
		  //e.preventDefault(); 
		  startX = e.clientX; 
		  startY = e.clientY; 
			
		  target_el.classList.add('active');
		  
		  document.addEventListener('mouseup', onRemoveEvent); 
		  
		  document.addEventListener('mousemove', onMove); 
		});
		
		function onRemoveEvent() { 
		  target_el.classList.remove('active');
		  document.removeEventListener('mouseup', onRemoveEvent); 
		  document.removeEventListener('mousemove', onMove); 
		} 
		
		function onMove(e) { 
		  //e.preventDefault(); 

		  lastY = startY - e.clientY; 
		
		  startY = e.clientY; 
		  
		  var subtitle_top = (my_subtitles.offsetTop - lastY);
		  
		  if(subtitle_top >= 0 && subtitle_top < document.body.offsetHeight-120){
			  	
			  my_subtitles.style.top = (my_subtitles.offsetTop - lastY) + 'px';
			  
			  setCookie('subtitle_top', my_subtitles.style.top, 999);
		  	
		  }
		  
		}
		
		console.log('자막 부분 생성 완료');
		
	}
}

setInterval(create_subtitle, 1000);

/////////// 생성된 자막 부분에 영어 자막 시간에 맞게 

var is_while = false;

function change_subtitle_cue(){
	
	if(is_while == false){
		is_while = true;
		
		var video = document.querySelector("video");
		var video_current_time = video.currentTime;
		var is_not_null = false;
		
		var subtitle_1 = null;
		var subtitle_2 = '';
		var is_change = false;
		
		var current_cue_cursor2 = null;
		
		for(var idx=0 ; idx < vtt_cues.length ; idx++){
			
			var vtt_cue = vtt_cues[idx];

			if(vtt_cue.start <= video_current_time && video_current_time < vtt_cue.end){
				current_cue_cursor2 = idx;
				is_not_null = true;
				if(document.querySelector('#subtitle-1').innerHTML != vtt_cue.text){
					subtitle_1 = vtt_cue.text;
					is_change = true;
				}
				break;
			}
			
		}
		
		
		if(is_not_null == false){
			subtitle_1 = '';
			is_change = true;
		}
		
		if(is_change == true){
			
			if(cue_will_stop == true){
				cue_will_stop = false;
				if(video.paused == false && (document.querySelector('#subtitle-1').innerHTML == '' && is_not_null == false) == false && 
					document.querySelector('#subtitle-1').innerHTML != ''){
					video.pause();
				}
			}else{
				if(video.paused == false){
					document.querySelector('#subtitle-1').innerHTML = subtitle_1 ;
					document.querySelector('#subtitle-2').innerHTML = subtitle_2 ;
					
					// 자막 객체 숨기거나 보이게, 백그라운드 색상이 안남기 위해서 1
					if(subtitle_1 == ''){
						document.querySelector('#subtitle-1').style.display = 'none';
					}
					else{
						document.querySelector('#subtitle-1').style.display = '';
					}
					
					if(subtitle_2 == ''){
						document.querySelector('#subtitle-2').style.display = 'none';
					}
					
					current_cue_cursor = current_cue_cursor2;
					cue_will_stop = true;
				}
			}

		}
		// 자막 객체 숨기거나 보이게, 백그라운드 색상이 안남기 위해서 2
		if(document.querySelector('#subtitle-1').innerHTML == '' && document.querySelector('#subtitle-2').innerHTML == ''){
			document.querySelector('#subtitles').style.display = 'none';
		}else{
			document.querySelector('#subtitles').style.display = '';
		}
		
		is_while = false;
	}
	
}

//////////////////// 비디오시간이 바뀌면 자막 달아주기위함, 영상이 없는곳에서는 커스텀 자막을 숨김
function hide_sub_when_no_video(){
	
	var video = document.querySelector("video");
	var subtitles_el = document.querySelector('#subtitles');
	
	
	if(video != null){
		if(video.className.includes('my_subtitles') == false){
			
			
			
			video.addEventListener("timeupdate", (event) => {
				change_subtitle_cue();
			});
			
			video.className = video.className + ' my_subtitles';
			console.log('비디오 객체 timeupdate 리스너 달기 완료');
			
			//영상 보는 곳이 아닌 곳에서 돌아왓을 경우 다시 나타나게 함
			if(subtitles_el != null && subtitles_el.innerText.length > 0 && subtitles_el.style.display == 'none'){
				document.querySelector('#subtitles').style.display = '';
			}
			
		}
	}else{
		//영상 보는 곳이 아닐경우 자막이 띄어져잇으면 숨김, 자막 vtt를 지움
		if(subtitles_el != null){
			document.querySelector('#subtitles').style.display = 'none';
		}
	}
}

setInterval(hide_sub_when_no_video, 1000);


////////////////////////////////영어 자막 번역하기 위함 (소켓)

var translated_subtitles = {};

var webSocket = new WebSocket('ws://192.168.0.49:9990');

webSocket.onerror = function(event) {
	onError(event)
};

webSocket.onopen = function(event) {
	onOpen(event)
};

webSocket.onmessage = function(event) {
	onMessage(event)
};

function onMessage(event) {
	if(!event.data.toString().includes('Could not read from Socket') && event.data.toString() != 'None'){
		try{
			var receive_json = JSON.parse(event.data);
			
			translated_subtitles[receive_json.msg] = receive_json.trans_msg;
			
			console.log(translated_subtitles[receive_json.msg]);
		}catch(err){
			console.log(err);
		}

		
		//console.log(event.data);
	}
}

function onOpen(event) {
	console.log('Connection established');
}

function onError(event) {
	console.log(event.data);
}

function send(data) {
	
	webSocket.send(JSON.stringify(data));

}

////////////////////////////////영어 자막 번역하기 위함 (cue가 바뀌면 자막이 바꼇다고 보고 영어 자막을 보냄)

var latest_subtitle_text = '';

function check_change_subtitle_text(){
	
	try{
	
		var current_subtitle_text = document.querySelector('#subtitle-1').textContent;
		
		var trans_sub = translated_subtitles[current_subtitle_text];
		
		if(trans_sub != null){
			var trans_sub_bar_element = document.querySelector('#subtitle-2');
			
			if(trans_sub_bar_element.textContent != trans_sub){
				
				trans_sub_bar_element.textContent = trans_sub;
				trans_sub_bar_element.style.display = '';
				//console.log(trans_sub);

			}

		}else{

			if(current_subtitle_text != null && current_subtitle_text.length > 0){

				if(current_subtitle_text != latest_subtitle_text){
					
					trans_sub_bar_element = document.querySelector('#subtitle-2');
					trans_sub_bar_element.textContent = '';
					
					//translated_subtitles[current_subtitle_text] = ''; //같은거 여러번 번역 안하기 위함
					
					var data = new Object() ;
					data.msg = current_subtitle_text;
					
					send(data);
						
					console.log(current_subtitle_text);
				}

				latest_subtitle_text = current_subtitle_text;
				
			}
			
		}
		
	
	}catch{}
	
	setTimeout(check_change_subtitle_text, 10);
}

check_change_subtitle_text();