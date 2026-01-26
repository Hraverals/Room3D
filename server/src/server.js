import express from 'express';
import { Client } from "@gradio/client";
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// http://localhost:5000 접속 시 client/index.html이 열림
app.use(express.static(path.join(__dirname, '../../client')));

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
        const client = await Client.connect("facebook/vggt");
        
        const imageBlobs = imageFiles.map(file => 
            new Blob([file.buffer], { type: file.mimetype })
        );

        const uploadResult = await client.predict("/update_gallery_on_upload", { 
            input_video: null,
            input_images: imageBlobs,
        });

        const targetDir = uploadResult.data[1];

        const generateResult = await client.predict("/gradio_demo", { 
            target_dir: targetDir,
            conf_thres: 0, 
            frame_filter: "All",
            mask_black_bg: true,
            mask_white_bg: true,
            show_cam: true,
            mask_sky: true,
            prediction_mode: "Depthmap and Camera Branch", 
        });

        return generateResult.data[0]; 

    } catch (error) {
        console.error("API 통신 장애:", error.message);
        throw error;
    }
};

app.post('/api/generate-3d', upload.array('roomImages', 20), async (req, res) => {
    try {
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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});