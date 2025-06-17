// src/components/FirmwareFormModal.tsx
import React, { useState, useEffect, useRef } from 'react';

interface FirmwareFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void; // Callback khi thêm/sửa thành công
}

// Định nghĩa kiểu dữ liệu cho dữ liệu form
interface FormData {
    versionNumber: string;
    releaseDate: string;
    description: string;
    firmwareFile: File | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.121:3335';

const FirmwareFormModal: React.FC<FirmwareFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState<FormData>({
        versionNumber: '',
        releaseDate: new Date().toISOString().split('T')[0],
        description: '',
        firmwareFile: null,
    });
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) {
            setFormData({
                versionNumber: '',
                releaseDate: new Date().toISOString().split('T')[0],
                description: '',
                firmwareFile: null,
            });
            setError(null);
            setSuccessMessage(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.name.endsWith('.bin')) {
                setFormData((prev) => ({ ...prev, firmwareFile: file }));
                setError(null);
            } else {
                setFormData((prev) => ({ ...prev, firmwareFile: null }));
                setError('Chỉ chấp nhận file .bin.');
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        } else {
            setFormData((prev) => ({ ...prev, firmwareFile: null }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        const dataToSend = new FormData();
        dataToSend.append('versionNumber', formData.versionNumber);
        dataToSend.append('releaseDate', formData.releaseDate);
        dataToSend.append('description', formData.description);
        if (formData.firmwareFile) {
            dataToSend.append('firmwareFile', formData.firmwareFile);
        } else {
            setError('Vui lòng chọn file firmware.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/firmware-version`, {
                method: 'POST',
                body: dataToSend,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            setSuccessMessage('Thêm phiên bản firmware thành công!');
            onSuccess();
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (err: any) {
            setError(err.message || 'Lỗi khi thêm phiên bản firmware.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // --- ĐỊNH NGHĨA CÁC STYLE INLINE CHO MODAL ---
    const modalOverlayStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    };

    const modalContentStyle: React.CSSProperties = {
        background: '#fff',
        padding: '25px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        width: '90%',
        maxWidth: '500px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    };

    const modalHeaderStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '10px',
        borderBottom: '1px solid #eee',
    };

    const modalHeaderTitleStyle: React.CSSProperties = {
        margin: 0,
        fontSize: '1.5em',
        color: '#333',
    };

    const modalCloseButtonStyle: React.CSSProperties = {
        background: 'none',
        border: 'none',
        fontSize: '1.8em',
        color: '#aaa',
        cursor: 'pointer',
        padding: 0,
        lineHeight: 1,
    };

    const formGroupStyle: React.CSSProperties = {
        marginBottom: '15px',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        marginBottom: '5px',
        fontWeight: 'bold',
        color: '#555',
        fontSize: '0.9em',
    };

    const inputBaseStyle: React.CSSProperties = {
        width: 'calc(100% - 20px)', // Trừ padding
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '1em',
        boxSizing: 'border-box', // Kích thước bao gồm padding và border
    };

    const textareaStyle: React.CSSProperties = {
        ...inputBaseStyle,
        resize: 'vertical',
        minHeight: '80px', // Chiều cao tối thiểu
    };

    const fileInputStyle: React.CSSProperties = {
        ...inputBaseStyle,
        padding: '8px 0', // Padding riêng cho file input
        border: 'none', // File input thường không có border nổi bật
    };

    const formMessageBaseStyle: React.CSSProperties = {
        padding: '10px',
        borderRadius: '4px',
        marginTop: '10px',
        fontSize: '0.9em',
        textAlign: 'center',
    };

    const errorMessageStyle: React.CSSProperties = {
        ...formMessageBaseStyle,
        backgroundColor: '#fcebeb',
        color: '#e57373',
        border: '1px solid #ef9a9a',
    };

    const successMessageStyle: React.CSSProperties = {
        ...formMessageBaseStyle,
        backgroundColor: '#e8f5e9',
        color: '#66bb6a',
        border: '1px solid #a5d6a7',
    };

    const modalFooterStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '20px',
        paddingTop: '15px',
        borderTop: '1px solid #eee',
    };

    const buttonBaseStyle: React.CSSProperties = {
        padding: '10px 20px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '1em',
        transition: 'background-color 0.2s ease',
    };

    const primaryButtonStyle: React.CSSProperties = {
        ...buttonBaseStyle,
        backgroundColor: '#5cb85c',
        color: 'white',
    };

    const secondaryButtonStyle: React.CSSProperties = {
        ...buttonBaseStyle,
        backgroundColor: '#f0ad4e',
        color: 'white',
    };

    const disabledButtonStyle: React.CSSProperties = {
        backgroundColor: '#cccccc',
        cursor: 'not-allowed',
    };

    return (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <div style={modalHeaderStyle}>
                    <h2 style={modalHeaderTitleStyle}>Thêm Phiên bản Firmware Mới</h2>
                    <button style={modalCloseButtonStyle} onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div style={formGroupStyle}>
                        <label htmlFor="versionNumber" style={labelStyle}>Số phiên bản:</label>
                        <input
                            type="text"
                            id="versionNumber"
                            name="versionNumber"
                            value={formData.versionNumber}
                            onChange={handleChange}
                            required
                            style={inputBaseStyle}
                        />
                    </div>

                    <div style={formGroupStyle}>
                        <label htmlFor="releaseDate" style={labelStyle}>Ngày phát hành:</label>
                        <input
                            type="date"
                            id="releaseDate"
                            name="releaseDate"
                            value={formData.releaseDate}
                            onChange={handleChange}
                            required
                            style={inputBaseStyle}
                        />
                    </div>

                    <div style={formGroupStyle}>
                        <label htmlFor="description" style={labelStyle}>Mô tả:</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            style={textareaStyle}
                        />
                    </div>

                    <div style={formGroupStyle}>
                        <label htmlFor="firmwareFile" style={labelStyle}>File Firmware (.bin):</label>
                        <input
                            type="file"
                            id="firmwareFile"
                            name="firmwareFile"
                            accept=".bin"
                            onChange={handleFileChange}
                            required
                            ref={fileInputRef}
                            style={fileInputStyle}
                        />
                    </div>

                    {error && <p style={errorMessageStyle}>{error}</p>}
                    {successMessage && <p style={successMessageStyle}>{successMessage}</p>}

                    <div style={modalFooterStyle}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={loading ? { ...primaryButtonStyle, ...disabledButtonStyle } : primaryButtonStyle}
                        >
                            {loading ? 'Đang tải lên...' : 'Thêm Firmware'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            style={loading ? { ...secondaryButtonStyle, ...disabledButtonStyle } : secondaryButtonStyle}
                        >
                            Hủy
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FirmwareFormModal;