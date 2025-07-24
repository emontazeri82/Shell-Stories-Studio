import nextConnect from 'next-connect';

import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
    storage: multer.memoryStorage(),
});

const apiRoute = nextConnect({
    onError(error, req, res) {
        res.status(501).json({ error: `Upload failed: ${error.message}` });
    },
    onNoMatch(req, res) {
        res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
    },
});

apiRoute.use(upload.single('file'));

apiRoute.post(async (req, res) => {
    console.log('🛬 Upload route hit');

    if (!req.file) {
        console.error('❌ No file received');
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const stream = cloudinary.uploader.upload_stream(
        { folder: 'admin/products' },
        (error, result) => {
            if (error) return res.status(500).json({ error: error.message });
            return res.status(200).json({ 
                url: result.secure_url,
                publicId: result.public_id, 
            });
        }
    );

    Readable.from(req.file.buffer).pipe(stream);
});

export default apiRoute;

export const config = {
    api: {
        bodyParser: false,
    },
};
