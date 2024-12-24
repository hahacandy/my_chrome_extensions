// content.js

// 특정 클래스 이름을 가진 모든 요소를 가져오는 함수
function getElementsByClassNames(classNames) {
    return classNames
        .map((name) => Array.from(document.getElementsByClassName(name)) || [])
        .reduce((acc, elems) => acc.concat(elems), [])
        .map((elem) => elem);
}

// 광고 구간을 건너뛰는 별도의 함수
function skipAdSection() {
    try {
        // 광고 배지(요소) 클래스
        const adBadge = document.querySelector(
            '.ad-simple-attributed-string.ytp-ad-badge__text--clean-player.ytp-ad-badge__text--clean-player-with-light-shadow'
        );

        // 광고 배지가 있으면 광고로 간주
        if (adBadge) {
            const video = document.querySelector('video');
            // 영상 객체가 있고, 재생 길이가 0보다 클 때만 실행
            if (video && video.duration > 0) {
                const skip_video_time = video.duration - 3;
                if (video.currentTime < skip_video_time) {
                    video.currentTime = skip_video_time;
                    console.log('광고 구간을 건너뛰었습니다!');
                }
            }
        }
    } catch (error) {
        console.error('광고 구간 건너뛰기 중 오류 발생:', error);
    }
}

// 광고 스킵 버튼을 클릭하는 함수
function clickSkipAdBtn() {
    const elems = getElementsByClassNames(skipButtonClasses);
    elems.forEach((el) => {
        el.click();
        console.log('Skip Ad 버튼을 클릭했습니다:', el);
    });
}

// 광고 요소를 감지하고 삭제하는 함수
function checkAndRemoveAds() {
    try {

        // 2. <div id="player-ads" class="style-scope ytd-watch-flexy"> 요소 삭제
        const playerAds = document.querySelector('#player-ads.style-scope.ytd-watch-flexy');
        if (playerAds) {
            playerAds.remove();
            console.log('<div id="player-ads"> 요소를 삭제했습니다.');
        }

        // 3. <ytd-ad-slot-renderer class="style-scope ytd-item-section-renderer" layout=""> 요소 삭제
        const adSlotRenderers = document.querySelectorAll('ytd-ad-slot-renderer.style-scope.ytd-item-section-renderer');
        adSlotRenderers.forEach(adSlot => {
            adSlot.remove();
            console.log('<ytd-ad-slot-renderer> 요소를 삭제했습니다.');
        });

        // 4. <ytd-rich-item-renderer class="style-scope ytd-rich-grid-renderer" ...> 요소 내 특정 광고 요소 삭제
        const richItemRenderers = document.querySelectorAll('ytd-rich-item-renderer.style-scope.ytd-rich-grid-renderer');
        richItemRenderers.forEach(richItem => {
            // 기존: 광고 메타 블록 확인 및 삭제
            const adInlinePlaybackMeta = richItem.querySelector('ytd-ad-inline-playback-meta-block.style-scope.ytd-video-display-full-buttoned-and-button-group-renderer[ui-update]');
            if (adInlinePlaybackMeta) {
                richItem.remove();
                console.log('<ytd-rich-item-renderer> 요소를 삭제했습니다 (내부에 광고 메타 블록 포함).');
                return; // 이미 삭제했으므로 다음 요소로 이동
            }

            // 새로 추가된 조건: <ytd-ad-slot-renderer> 요소가 포함되어 있는지 확인
            const adSlotInRichItem = richItem.querySelector('ytd-ad-slot-renderer');
            if (adSlotInRichItem) {
                richItem.remove();
                console.log('<ytd-rich-item-renderer> 요소를 삭제했습니다 (내부에 <ytd-ad-slot-renderer> 포함).');
            }
        });

        // 5. <div id="masthead-ad" class="style-scope ytd-rich-grid-renderer"> 요소 삭제
        const mastheadAd = document.querySelector('#masthead-ad.style-scope.ytd-rich-grid-renderer');
        if (mastheadAd) {
            mastheadAd.remove();
            console.log('<div id="masthead-ad"> 요소를 삭제했습니다.');
        }

    } catch (error) {
        console.error('광고 제거 중 오류 발생:', error);
    }
}

const skipButtonClasses = [
    "videoAdUiSkipButton",
    "ytp-ad-skip-button ytp-button",
    "ytp-ad-skip-button-modern ytp-button",
    "ytp-skip-ad-button",
];

// 초기 광고 제거 실행
checkAndRemoveAds();
skipAdSection();
clickSkipAdBtn();


// MutationObserver 설정
const observer = new MutationObserver((mutations) => {
    for (let mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'subtree') {
            checkAndRemoveAds();
			skipAdSection();
            clickSkipAdBtn();
            break; // 한 번만 호출하여 효율성을 높임
        }
    }
});

// 관찰 대상 노드 및 옵션 설정
const targetNode = document.body;
const config = { childList: true, subtree: true };

// 관찰 시작
observer.observe(targetNode, config);

console.log('광고 제거 스크립트가 활성화되었습니다.');
