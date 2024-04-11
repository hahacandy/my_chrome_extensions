from selenium import webdriver
from selenium.webdriver.common.by import By
import time
from urllib import parse
import nest_asyncio
import asyncio              # 웹 소켓 모듈을 선언한다.
import websockets           # 클라이언트 접속이 되면 호출된다.
import json
from io import StringIO
from selenium.webdriver.common.keys import Keys
import re

saved_translated_subtitles = {}

def get_driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--mute-audio")
    options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36")
    options.add_argument("--app-version=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-setuid-sandbox")
    options.add_argument('--disable-gpu')
    options.add_argument('headless')
    
    driver = webdriver.Chrome(options=options)
    
    return driver
    
def trans_text(driver, msg):
    
    if len(msg) == 0:
        return None

    print(msg)

    input_msg = msg.replace('\n', ' ').strip()

    input_el = driver.find_element(By.XPATH, '//*[@id="tw-source-text-ta"]')
    
    js_code = '(function (element, text) {\
        Array.prototype.forEach.call(text, function (char) {\
            element.value += char;\
            element.dispatchEvent(new KeyboardEvent("keydown"));\
            element.dispatchEvent(new KeyboardEvent("keypress"));\
            element.dispatchEvent(new KeyboardEvent("input"));\
            element.dispatchEvent(new KeyboardEvent("keyup"));\
        });\
    }).apply(null, arguments);\
    '
    
    latest_text = ''
    current_text = ''
    
    driver.execute_script(js_code, input_el, input_msg);
    
    try_idx = 0
    text_check = 0
    
    while True:
        try_idx = try_idx + 1
        try:
            output_el = driver.find_element(By.XPATH, '//*[@id="tw-target-text"]')
            current_text = output_el.text
            
            if latest_text == current_text:
                text_check = text_check + 1
            else:
                #print(current_text)
                text_check = 0
                
            
            
            if len(current_text) != 0 and '...' not in current_text and current_text != '번역' and text_check >= 5:
                break
        except:
            pass
        
        latest_text = current_text
        
        if try_idx >= 50:
            break
        
        time.sleep(0.1)

    input_el.send_keys(Keys.CONTROL, 'a')
    input_el.send_keys(Keys.BACKSPACE)

    js_code2 = 'window.scrollTo(0, 0);'
    driver.execute_script(js_code2);

    return current_text.replace('\n', ' ').strip()
    
async def accept_func(websocket, path):
    global driver
    
    while True:
        try:
            data = await websocket.recv();# 클라이언트로부터 메시지를 대기한다.
            #print(time.strftime('%Y-%m-%d  %H:%M:%S'), "receive : " + data);
            
            io = StringIO(data)
            json_data = json.load(io)
            msg = json_data['msg']

            trans_msg = None
            
            if msg in saved_translated_subtitles:
                trans_msg = saved_translated_subtitles[msg]
            else:
                trans_msg= trans_text(driver, msg)
                trans_msg.strip()
                #saved_translated_subtitles[msg] = trans_msg
                 
            if trans_msg != None:
                print(time.strftime('%Y-%m-%d  %H:%M:%S'), ' : ' + msg + ' -> ' + trans_msg)
                send_info = json.dumps({'msg':msg, 'trans_msg':trans_msg})
                print(send_info)
                print()
                #client_socket.sendall(trans_msg.encode(encoding="utf-8"))
                
                await websocket.send(send_info);# 클라인언트로 echo를 붙여서 재 전송한다.
                
        except:
            pass
            
nest_asyncio.apply()

driver = get_driver()
driver.implicitly_wait(3)
driver.get('https://www.google.com/search?q=%EA%B5%AC%EA%B8%80+%EB%B2%88%EC%97%AD')

# "0.0.0.0" => 서버 pc에 ip 주소를 입력해준다.
# 0000 => 서버 pc에 포트를 입력 해 준다.
start_server = websockets.serve(accept_func, "0.0.0.0", 9990);

# 비동기로 서버를 대기한다.
asyncio.get_event_loop().run_until_complete(start_server);
asyncio.get_event_loop().run_forever();
