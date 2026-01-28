import express from 'express';
import { Client } from "@gradio/client";
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../client')));

const broadcastStatus = (message) => {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) { // 1 = WebSocket.OPEN
            client.send(JSON.stringify({ status: message }));
        }
    });
};

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('이미지 파일만 업로드 가능함!!'));
        }
    }
});

async function generate3DRoom(imageFiles) {
    try {
        broadcastStatus("1단계: Hugging Face VGGT 모델에 연결 중입니다...");
        const client = await Client.connect("facebook/vggt");
        
        const imageBlobs = imageFiles.map(file => 
            new Blob([file.buffer], { type: file.mimetype })
        );
        
        broadcastStatus("2단계: 이미지 데이터를 전송하고 갤러리를 업데이트 중입니다...");
        const uploadResult = await client.predict("/update_gallery_on_upload", { 
            input_video: null,
            input_images: imageBlobs,
        });

        const targetDir = uploadResult.data[1];

        broadcastStatus("3단계: 3D 공간 재구성 연산 시작 (약 1분 소요)...");
        const generateResult = await client.predict("/gradio_demo", { 
            target_dir: targetDir,
            conf_thres: 50, 
            frame_filter: "All",
            mask_black_bg: false,
            mask_white_bg: false,
            show_cam: true,
            mask_sky: false,
            prediction_mode: "Depthmap and Camera Branch",
        });

        broadcastStatus("4단계: 3D 모델 생성이 완료되었습니다! 결과물을 렌더링합니다.");
        return generateResult.data[0]; 

    } catch (error) {
        broadcastStatus("에러: 3D 생성 중 문제가 발생했습니다.");
        console.error("API 통신 장애:", error);
        throw error;
    }
};

app.post('/api/generate-3d', upload.array('roomImages', 20), async (req, res) => {
    try {
        broadcastStatus("이미지 업로드 완료. 서버 연산을 시작합니다.");
        const modelData = await generate3DRoom(req.files);

        res.status(200).json({
            success: true,
            data: {
                modelUrl: modelData.url,  // .glb 파일 다운로드 주소
                origName: modelData.orig_name,
                isExample: modelData.is_example
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message 
        });
    }
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});