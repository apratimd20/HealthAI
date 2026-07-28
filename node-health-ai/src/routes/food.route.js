// routes/food.route.js
import express from 'express';
import multer from 'multer';
import { 
    analyseFood, 
    analyseFoodStream,
    analyseFoodHealth 
} from '../controllers/food.controller.js';

export const foodRouter = express.Router();

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Routes
foodRouter.post('/analyse', upload.single('image'), analyseFood);
foodRouter.post('/analyse-stream', upload.single('image'), analyseFoodStream);
foodRouter.get('/health', analyseFoodHealth);

export default foodRouter;