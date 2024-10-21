from selenium import webdriver
from selenium.webdriver.common.by import By
import time
import nest_asyncio
import asyncio
import websockets
import json
from io import StringIO
from selenium.webdriver.common.keys import Keys

# 번역된 자막을 저장하는 캐시
saved_translated_subtitles = {}

# Selenium WebDriver 설정 및 생성 함수
def get_driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--mute-audio")
    options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36")
    options.add_argument("--app-version=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-setuid-sandbox")
    options.add_argument('--disable-gpu')
    options.add_argument('headless')  # Headless 모드로 실행 (UI 없는 브라우저)
    
    driver = webdriver.Chrome(options=options)
    return driver

# 번역 텍스트 처리 함수
def trans_text(driver, msg):
    if len(msg) == 0:
        return None

    print(f"Translating message: {msg}")
    
    # 메시지에서 불필요한 개행을 제거
    input_msg = msg.replace('\n', ' ').strip()

    # 번역 입력란 요소를 찾음
    input_el = driver.find_element(By.XPATH, '//*[@id="tw-source-text-ta"]')

    # 텍스트를 키보드 이벤트로 입력
    js_code = '''(function (element, text) {
                    Array.prototype.forEach.call(text, function (char) {
                        element.value += char;
                        element.dispatchEvent(new KeyboardEvent("keydown"));
                        element.dispatchEvent(new KeyboardEvent("keypress"));
                        element.dispatchEvent(new KeyboardEvent("input"));
                        element.dispatchEvent(new KeyboardEvent("keyup"));
                    });
                }).apply(null, arguments);'''

    latest_text = ''
    current_text = ''
    
    # 텍스트 번역 대기
    while current_text == '':
        driver.execute_script(js_code, input_el, input_msg)
        try_idx = 0
        text_check = 0

        while True:
            try_idx += 1
            try:
                output_el = driver.find_element(By.XPATH, '//*[@id="tw-target-text"]/span[1]')
                current_text = output_el.text
                output_el2 = driver.find_element(By.XPATH, '//*[@id="CZf0ub"]')
                current_progress = output_el2.get_attribute('class')

                if latest_text == current_text:
                    text_check += 1
                else:
                    text_check = 0

                # 동일한 결과가 5번 반복되고, "번역 중"이 아닌 상태일 때 종료
                if len(current_text) != 0 and current_progress == 'RxYbNe iRZc1e' and current_text != '번역 중' and text_check >= 5:
                    break

            except Exception as e:
                print(f"Error during translation: {e}")

            latest_text = current_text

            # 일정 횟수 이상 시도하면 중단
            if try_idx >= 25:
                current_text = ''
                break

            time.sleep(0.1)

        # 입력란 초기화
        input_el.send_keys(Keys.CONTROL, 'a')
        input_el.send_keys(Keys.BACKSPACE)

    # 페이지를 맨 위로 스크롤
    driver.execute_script('window.scrollTo(0, 0);')

    return current_text.replace('\n', ' ').strip()

# WebSocket 연결을 처리하는 함수
async def accept_func(websocket, path):
    global driver
    
    while True:
        try:
            data = await websocket.recv()  # 클라이언트로부터 메시지 수신
            io = StringIO(data)
            json_data = json.load(io)
            msg = json_data['msg']

            # 번역된 메시지가 캐시에 있는지 확인
            if msg in saved_translated_subtitles:
                trans_msg = saved_translated_subtitles[msg]
            else:
                # 캐시에 없으면 번역 수행
                trans_msg = trans_text(driver, msg)
                if trans_msg:
                    saved_translated_subtitles[msg] = trans_msg

            # 번역된 메시지 전송
            if trans_msg:
                print(f"{msg} -> {trans_msg}")
                send_info = json.dumps({'msg': msg, 'trans_msg': trans_msg})
                await websocket.send(send_info)

        except Exception as e:
            print(f"Error in WebSocket communication: {e}")
            pass

# 웹소켓 및 이벤트 루프 설정
nest_asyncio.apply()

# Selenium WebDriver 설정
driver = get_driver()
driver.implicitly_wait(3)
driver.get('https://www.google.com/search?q=%EA%B5%AC%EA%B8%80+%EB%B2%88%EC%97%AD')

# WebSocket 서버 시작
start_server = websockets.serve(accept_func, "0.0.0.0", 9990)

# 비동기 서버 대기
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
