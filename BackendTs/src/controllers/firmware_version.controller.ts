import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { models } from '../config/db.config'; // Import đối tượng 'models'

// Lấy đường dẫn thư mục upload từ biến môi trường
const UPLOAD_DIR = process.env.FIRMWARE_UPLOAD_DIR || path.join(__dirname, '..', 'uploads');

// Đảm bảo thư mục upload tồn tại
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Cấu hình Multer để lưu file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

export const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // Giới hạn 100MB cho file firmware
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname).toLowerCase() !== '.bin') {
            return cb(new Error('Chỉ cho phép file .bin!'));
        }
        cb(null, true);
    }
});

// --- CONTROLLER FUNCTIONS ---

// Lấy tất cả các phiên bản Firmware
export const getAllFirmwareVersions = async (req: Request, res: Response) => {
    try {
        const firmwareVersions = await models.FirmwareVersion.findAll(); // Sử dụng models.FirmwareVersion
        res.status(200).json(firmwareVersions);
    } catch (error: any) {
        console.error('Error fetching firmware versions:', error);
        res.status(500).json({ message: 'Lỗi khi lấy danh sách firmware.', error: error.message });
    }
};

// Lấy phiên bản Firmware theo ID
export const getFirmwareVersionById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const firmwareVersion = await models.FirmwareVersion.findByPk(id); // Sử dụng models.FirmwareVersion

        if (!firmwareVersion) {
            res.status(404).json({ message: 'Không tìm thấy phiên bản firmware.' });
            return;
        }
        res.status(200).json(firmwareVersion);
    } catch (error: any) {
        console.error(`Error fetching firmware version with ID ${req.params.id}:`, error);
        res.status(500).json({ message: 'Lỗi khi lấy thông tin firmware.', error: error.message });
    }
};

// Tạo một phiên bản Firmware mới (với upload file)
export const createFirmwareVersion = async (req: Request, res: Response) => {
    const file = req.file;

    try {
        const { versionNumber, releaseDate, description } = req.body;

        if (!versionNumber || !releaseDate || !file) {
            if (file) fs.unlinkSync(file.path);
            res.status(400).json({ message: 'Vui lòng cung cấp số phiên bản, ngày phát hành và file firmware.' });
            return;
        }

        const existingFirmware = await models.FirmwareVersion.findOne({ where: { versionNumber } }); // Sử dụng models.FirmwareVersion
        if (existingFirmware) {
            if (file) fs.unlinkSync(file.path);
            res.status(409).json({ message: 'Số phiên bản firmware đã tồn tại.' });
            return;
        }

        const firmwareFileName = `${versionNumber}_${Date.now()}${path.extname(file.originalname)}`;
        const newFilePath = path.join(UPLOAD_DIR, firmwareFileName);

        fs.renameSync(file.path, newFilePath);

        const downloadUrl = `/firmware_files/${firmwareFileName}`;

        const newFirmware = await models.FirmwareVersion.create({ // Sử dụng models.FirmwareVersion
            versionNumber,
            releaseDate: new Date(releaseDate),
            description,
            downloadUrl,
        });

        res.status(201).json({ message: 'Thêm phiên bản firmware thành công!', firmware: newFirmware });

    } catch (error: any) {
        console.error('Error creating firmware version:', error);
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        res.status(500).json({ message: 'Lỗi khi thêm phiên bản firmware.', error: error.message });
    }
};

// Cập nhật một phiên bản Firmware (có thể cập nhật file hoặc không)
export const updateFirmwareVersion = async (req: Request, res: Response) => {
    const file = req.file;

    try {
        const { id } = req.params;
        const { versionNumber, releaseDate, description } = req.body;

        const firmwareVersion = await models.FirmwareVersion.findByPk(id); // Sử dụng models.FirmwareVersion
        if (!firmwareVersion) {
            if (file) fs.unlinkSync(file.path);
            res.status(404).json({ message: 'Không tìm thấy phiên bản firmware để cập nhật.' });
            return;
        }

        let newDownloadUrl = firmwareVersion.downloadUrl;

        if (file) {
            if (firmwareVersion.downloadUrl) {
                const oldFileName = path.basename(firmwareVersion.downloadUrl);
                const oldFilePath = path.join(UPLOAD_DIR, oldFileName);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                    console.log(`Deleted old firmware file: ${oldFilePath}`);
                }
            }

            const newVersionNum = versionNumber || firmwareVersion.versionNumber;
            const firmwareFileName = `${newVersionNum}_${Date.now()}${path.extname(file.originalname)}`;
            const newFilePath = path.join(UPLOAD_DIR, firmwareFileName);
            fs.renameSync(file.path, newFilePath);
            newDownloadUrl = `/firmware_files/${firmwareFileName}`;
        }

        await firmwareVersion.update({
            versionNumber: versionNumber || firmwareVersion.versionNumber,
            releaseDate: releaseDate ? new Date(releaseDate) : firmwareVersion.releaseDate,
            description: description || firmwareVersion.description,
            downloadUrl: newDownloadUrl,
        });

        res.status(200).json({ message: 'Cập nhật phiên bản firmware thành công!', firmware: firmwareVersion });

    } catch (error: any) {
        console.error(`Error updating firmware version with ID ${req.params.id}:`, error);
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        res.status(500).json({ message: 'Lỗi khi cập nhật phiên bản firmware.', error: error.message });
    }
};

// Xóa một phiên bản Firmware (và file liên quan)
export const deleteFirmwareVersion = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const firmwareVersion = await models.FirmwareVersion.findByPk(id); // Sử dụng models.FirmwareVersion

        if (!firmwareVersion) {
            res.status(404).json({ message: 'Không tìm thấy phiên bản firmware để xóa.' });
            return;
        }

        if (firmwareVersion.downloadUrl) {
            const fileName = path.basename(firmwareVersion.downloadUrl);
            const filePath = path.join(UPLOAD_DIR, fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted firmware file: ${filePath}`);
            }
        }

        await firmwareVersion.destroy();

        res.status(200).json({ message: 'Xóa phiên bản firmware thành công!' });

    } catch (error: any) {
        console.error(`Error deleting firmware version with ID ${req.params.id}:`, error);
        res.status(500).json({ message: 'Lỗi khi xóa phiên bản firmware.', error: error.message });
    }
};