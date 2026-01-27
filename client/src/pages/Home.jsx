import React, { useState, useRef } from 'react';

function Home() {
    const fileInputRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [modelUrl, setModelUrl] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        const files = fileInputRef.current.files;
        if (files.length === 0) {
            setError("사진을 선택해주세요!");
            return;
        }

        const isAllImages = Array.from(files).every(file => file.type.startsWith('image/'));
        if (!isAllImages) {
            setError("이미지 파일만 업로드해주세요!");
            return;
        }

        setIsLoading(true);
        setModelUrl(null);
        setError(null);

        const formData = new FormData();
        Array.from(files).forEach(file => {
            formData.append('roomImages', file);
        });

        try {
            const response = await fetch('/api/generate-3d', {
                method: 'POST',
                body: formData,
            });

            // 응답이 성공적이지 않을 경우(e.g., 4xx, 5xx), API가 보낸 에러 메시지를 파싱합니다.
            if (!response.ok) {
                let errorData;
                try {
                    // 에러 응답이 JSON 형태일 경우
                    errorData = await response.json();
                } catch (e) {
                    // JSON이 아닐 경우 (e.g., 500 Internal Server Error의 HTML 페이지)
                    throw new Error(`서버 에러: ${response.status} ${response.statusText}`);
                }
                // JSON에 담긴 에러 메시지를 사용하거나, 없을 경우 기본 메시지 사용
                throw new Error(errorData.error || '알 수 없는 서버 오류가 발생했습니다.');
            }

            const result = await response.json();
            setModelUrl(result.data.modelUrl);
        } catch (err) {
            console.error(err.message); // API가 보내주는 에러 메시지만 콘솔에 출력
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="app-container">
            <h1>📸 3D Room Tour 생성기</h1>
            <p className="description">여러 장의 방 사진을 업로드하여 나만의 3D 가상 투어를 만들어보세요!</p>
            <div className="controls">
                <input type="file" ref={fileInputRef} multiple accept="image/*" disabled={isLoading} />
                <button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? '생성 중...' : '3D 투어 생성하기'}
                </button>
            </div>
            <div className="viewer-container">
                {isLoading && <div className="message">모델을 생성하고 있습니다. 잠시만 기다려주세요...</div>}
                {error && <div className="message error">{error}</div>}
                {!isLoading && !modelUrl && !error && <div className="message">사진을 업로드하면 여기에 3D 방이 나타납니다.</div>}
                {modelUrl && <model-viewer src={modelUrl} camera-controls auto-rotate style={{ width: '100%', height: '600px' }} alt="A 3D model of a room"></model-viewer>}
            </div>
        </div>
    );
}

export default Home;