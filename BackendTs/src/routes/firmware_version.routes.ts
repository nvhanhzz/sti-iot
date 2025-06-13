import { Router } from 'express';
import {
    getAllFirmwareVersions,
    getFirmwareVersionById,
    createFirmwareVersion,
    updateFirmwareVersion,
    deleteFirmwareVersion,
    upload // Import middleware upload từ controller
} from '../controllers/firmware_version.controller'; // Import tất cả các hàm controller

const router = Router();

// Routes cho FirmwareVersion
router.get('', getAllFirmwareVersions);
router.get('/:id', getFirmwareVersionById);
router.post('', upload.single('firmwareFile'), createFirmwareVersion); // Sử dụng middleware upload
router.put('/:id', upload.single('firmwareFile'), updateFirmwareVersion); // Sử dụng middleware upload
router.delete('/:id', deleteFirmwareVersion);

export default router;