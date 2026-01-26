// client/src/app.js (여기는 제미나이가 만듬,,)

const fileInput = document.getElementById('fileInput');
const submitBtn = document.getElementById('submitBtn');
const roomViewer = document.getElementById('roomViewer');
const loadingMsg = document.getElementById('loadingMsg');
const placeholderMsg = document.getElementById('placeholderMsg');

submitBtn.addEventListener('click', async () => {
    const files = fileInput.files;
    if (files.length === 0) return alert("사진을 선택해주세요!");

    // 이미지 파일 유효성 검사 추가
    const isAllImages = Array.from(files).every(file => file.type.startsWith('image/'));
    if (!isAllImages) return alert("이미지 파일만 업로드해주세요!");

    // 로딩 UI 시작
    submitBtn.disabled = true;
    loadingMsg.style.display = 'block';
    placeholderMsg.style.display = 'none';
    roomViewer.style.display = 'none';

    const formData = new FormData();
    Array.from(files).forEach(file => {
        formData.append('roomImages', file);
    });

    try {
        const response = await fetch('/api/generate-3d', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            // 3D 모델 URL 적용 및 화면 표시
            roomViewer.src = result.data.modelUrl;
            roomViewer.style.display = 'block';
            loadingMsg.style.display = 'none';
        } else {
            alert("생성 실패: " + result.error);
            resetUI();
        }
    } catch (error) {
        console.error("Error:", error);
        alert("서버 연결 실패!");
        resetUI();
    } finally {
        submitBtn.disabled = false;
    }
});

function resetUI() {
    loadingMsg.style.display = 'none';
    placeholderMsg.style.display = 'block';
}