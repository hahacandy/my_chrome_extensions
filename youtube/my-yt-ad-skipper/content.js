// content.js
setInterval(() => {
  // 광고 배지(요소) 클래스
  const adBadge = document.querySelector(
    '.ad-simple-attributed-string.ytp-ad-badge__text--clean-player.ytp-ad-badge__text--clean-player-with-light-shadow'
  );
  
  // 광고 배지가 있으면 광고로 간주
  if (adBadge) {
    const video = document.querySelector('video');
    // 영상 객체가 있고, 재생 길이가 0보다 크다면
    if (video && video.duration > 0) {
      // 광고 구간 끝으로 강제 이동
      video.currentTime = video.duration;
      console.log('광고 구간을 건너뛰었습니다!');
    }
  }
}, 100);
