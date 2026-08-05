"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadConfig = void 0;
const multer_1 = require("multer");
const path_1 = require("path");
exports.uploadConfig = {
    storage: (0, multer_1.diskStorage)({
        destination: process.env.UPLOAD_DIR || './uploads',
        filename: (req, file, callback) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = (0, path_1.extname)(file.originalname);
            callback(null, 'file-' + uniqueSuffix + ext);
        },
    }),
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    },
    fileFilter: (req, file, callback) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        if (allowedMimes.includes(file.mimetype)) {
            callback(null, true);
        }
        else {
            callback(new Error('Invalid file type'), false);
        }
    },
};
