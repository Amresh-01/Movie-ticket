import multer from 'multer';
import path from 'path';

// Use memory storage for quick direct upload to Cloudinary stream
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    const filetypes = /jpeg|jpg|png|webp|gif|svg|bmp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype || extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpeg, jpg, png, webp, gif) are allowed!'));
  },
});

export default upload;
