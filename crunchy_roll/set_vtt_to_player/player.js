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
	
	try{
		x.open("GET", vtt_url);
		x.send();
	}catch{
		chrome.storage.local.clear();
	}

}


// vtt_cues의 start와 end 시간이 겹치는지 확인하고 조정
function adjust_cue_times(vtt_cues) {
    for (let i = 0; i < vtt_cues.length - 1; i++) {
        let currentCue = vtt_cues[i];
        let nextCue = vtt_cues[i + 1];

        // 현재 자막의 end 시간이 다음 자막의 start 시간과 겹치면 조정
        if (currentCue.end > nextCue.start) {
            currentCue.end = nextCue.start - 0.01; // 0.01초 간격을 추가해 겹치지 않게 조정
        }
    }
}

// vtt_cues를 불러온 후 시간 조정 적용
function convert_vtt_to_cue(all_vtt) {
    vtt_cues = [];
    var is_differt_vtt = null;
    var temp_split_vtt = all_vtt.split('\r\n\r\n');
    if (temp_split_vtt.length == 2) {
        is_differt_vtt = '1';
        temp_split_vtt = all_vtt.split('\n\n');
    }

    for (var i = 0; i < temp_split_vtt.length; i++) {
        if (i == 0) {
            temp_split_vtt[i] = temp_split_vtt[i].replace('WEBVTT\r\n\r\n', '');
        }

        if (temp_split_vtt[i].includes(' --> ') == true) {
            var split_vt = null;
            if (is_differt_vtt == null) {
                split_vt = temp_split_vtt[i].split('\r\n');
            } else if (is_differt_vtt == '1') {
                split_vt = temp_split_vtt[i].split('\n');
            }

            var vtt_cue = {};
            var text_cue = '';

            for (var j = 0; j < split_vt.length; j++) {
                if (j == 0) {
                    continue;
                }

                if (j == 1) {
                    var split_v = split_vt[j].split(' ');
                    vtt_cue.start = split_v[0];
                    var start_split = vtt_cue.start.split(':');
                    vtt_cue.start = parseFloat((start_split[0] * 60 * 60)) + parseFloat((start_split[1] * 60)) + parseFloat(start_split[2]);

                    vtt_cue.end = split_v[2];
                    var end_split = vtt_cue.end.split(':');
                    vtt_cue.end = parseFloat((end_split[0] * 60 * 60)) + parseFloat((end_split[1] * 60)) + parseFloat(end_split[2]);
                } else {
                    text_cue += split_vt[j];
                    if (j != split_vt.length - 1) {
                        text_cue += '\n';
                    }
                }
            }

            vtt_cue.text = text_cue.replaceAll(/(<([^>]+)>)/ig, "");
            vtt_cues.push(vtt_cue);
        }
    }

    // 자막의 시간이 겹치는 경우 조정
    adjust_cue_times(vtt_cues);
}





//////////////////

setInterval(function() {
	
	try{
		chrome.storage.local.get(['vtt_url'], function(items) {
			vtt_url = items['vtt_url']
		});
	}catch{}
	
	if(vtt_url != '' && vtt_url != latest_vtt_url && document.querySelector("#vilosVttJs > div") != null){
		latest_vtt_url = vtt_url;
		get_subtitle();
	}
}, 100);

setInterval(function() {
	var black_screen_div = getElementByXpath('//*[@id="velocity-controls-package"]/div[1]');
	if(black_screen_div != null)
		black_screen_div.style.backgroundColor = 'rgba(0, 0, 0, 0.0)';
}, 100);

//////////// 키보드 누르면 자막 이동 되게

var current_cue_cursor = null;
var video_sync = 0;
var min_repeat_time = 0.3;  // 반복 재생 최소 시간

function get_video_time(mode, vid_current_time) {
    var move_time = null;
    var move_cursor = null;
    var time_offset = 0.1;  // 0.1초 오차 허용 범위

    if (current_cue_cursor == null) {
        for (let i = 0; i < vtt_cues.length; i++) {
            if (vid_current_time < vtt_cues[i].start + video_sync) {
                current_cue_cursor = i;
                break;
            }
        }
    }

    if (mode === 'right') {
        move_cursor = current_cue_cursor + 1;
        if (move_cursor >= vtt_cues.length) {
            move_cursor = vtt_cues.length - 1;
        }
    } else if (mode === 'left') {
        move_cursor = current_cue_cursor - 1;
        if (move_cursor < 0) {
            move_cursor = 0;
        }
    } else if (mode === 'up') {
        move_cursor = current_cue_cursor;
    }

    // 자막이 존재하는 경우만 이동 시간을 설정
    if (move_cursor >= 0 && move_cursor < vtt_cues.length) {
        move_time = vtt_cues[move_cursor].start + video_sync;

        // 이전 자막으로 이동할 때 오차 보정
        if (mode === 'left' && Math.abs(vid_current_time - move_time) < time_offset) {
            move_time = vtt_cues[move_cursor].start + video_sync - time_offset; // 0.1초 이전으로 이동
        }

        // 반복 재생할 때 최소 시간 확보
        if (mode === 'up' && (vtt_cues[move_cursor].end - move_time) < min_repeat_time) {
            move_time = Math.max(vtt_cues[move_cursor].start + video_sync - min_repeat_time, 0); // 최소 0.3초 앞에서 재생
        }
        
        current_cue_cursor = move_cursor;  // 이동한 자막의 인덱스를 갱신
    }

    return move_time;
}

var cue_will_stop = false;

function video_event_listener(e, vtt_cues) {
    var vid = document.querySelector('video');
    var vid_current_time = vid.currentTime;
    var move_time = null;

    if (e.code === "KeyA") {
        // 이전 자막으로 이동
        move_time = get_video_time('left', vid_current_time);
        cue_will_stop = false;
        vid.play();  // 이동 후 자동 재생
    } else if (e.code === "KeyD") {
        // 다음 자막으로 이동
        move_time = get_video_time('right', vid_current_time);
        cue_will_stop = false;
        vid.play();  // 이동 후 자동 재생
    } else if (e.code === "KeyW") {
        // 현재 자막 반복
        if (current_cue_cursor !== null && vtt_cues[current_cue_cursor]) {
            move_time = vtt_cues[current_cue_cursor].start + video_sync;
            cue_will_stop = true;  // 자막을 반복하기 위한 플래그 설정
        }
    } else if (e.code === "KeyS") {
        // 재생/일시정지
        if (vid.paused) {
            vid.play();
        } else {
            vid.pause();
        }
    }

    if (move_time !== null) {
        vid.currentTime = move_time;

        // 반복 재생을 할 때는 정지하지 않도록 처리
        if (!cue_will_stop) {
            vid.play();
        } else {
            cue_will_stop = false;  // W키로 반복 재생 후 다시 재생 상태로 전환
            vid.play();
        }
    }
}

document.addEventListener("keydown", (event) => {
    event.preventDefault();
    video_event_listener(event, vtt_cues);
});



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
var is_click_sub2 = false;

function create_subtitle(){
	
	var my_subtitles = document.querySelector('#subtitles');
	
	if(my_subtitles == null){
		
		var temp_ele = document.createElement('div');
		temp_ele.id = 'subtitles';
		
		var temp_ele_1 = document.createElement('div');
		temp_ele_1.id = 'sub_left';
		var temp_ele_1_1 = document.createElement('div');
		temp_ele_1_1.id = 'sub_left_1';
		temp_ele_1_1.addEventListener('mousedown', function(e){
			video_sync = video_sync + 0.25;
			temp_ele_1_3.textContent = video_sync;
		});
		var temp_ele_1_2 = document.createElement('div');
		temp_ele_1_2.id = 'sub_left_2';
		temp_ele_1_2.addEventListener('mousedown', function(e){
			video_sync = video_sync + -0.25;
			temp_ele_1_3.textContent = video_sync;
		});
		var temp_ele_1_3 = document.createElement('div');
		temp_ele_1_3.id = 'sub_left_3';
		temp_ele_1_3.textContent = '0';
		temp_ele_1.appendChild(temp_ele_1_1);
		temp_ele_1.appendChild(temp_ele_1_2);
		temp_ele_1.appendChild(temp_ele_1_3);
		
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
		
		/*
		temp_ele3.style.filter='blur(10px)';
		temp_ele3.onclick = function (event) {
			
			if(is_click_sub2 == true){
				temp_ele3.style.filter='blur(10px)';
				is_click_sub2 = false;
			}else{
				temp_ele3.style.filter='blur(0px)';
				is_click_sub2 = true;
			}
		}
		*/
		
		
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

			if(vtt_cue.start + video_sync <= video_current_time && video_current_time < vtt_cue.end + video_sync){
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
					//document.querySelector('#subtitle-2').style.filter='blur(10px)';
					
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
			
			video.addEventListener("pause", (event) => {
				document.getElementById('sub_right_1').className = 'red_back';
			});
			
			video.addEventListener("play", (event) => {
				document.getElementById('sub_right_1').className = '';
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