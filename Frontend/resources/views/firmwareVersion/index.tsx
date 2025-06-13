// src/components/FirmwareList.tsx
import React, { useEffect, useState, useCallback } from 'react';
import FirmwareFormModal from './FirmwareFormModal';

// --- IMPORT CÁC ICON TỪ REACT-ICONS ---
import { FaPencilAlt, FaTrashAlt, FaLock, FaSave, FaTimes } from 'react-icons/fa';
// Bạn có thể chọn các icon khác từ react-icons phù hợp hơn nếu muốn, ví dụ:
// import { MdEdit, MdDelete, MdLock, MdSave, MdCancel } from 'react-icons/md';
// import { AiFillEdit, AiFillDelete, AiFillLock, AiFillSave, AiFillCloseCircle } from 'react-icons/ai';
// ---

interface FirmwareVersion {
    id: number;
    versionNumber: string;
    releaseDate: string;
    downloadUrl: string | null;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3335';

const FirmwareList: React.FC = () => {
    const [firmwareVersions, setFirmwareVersions] = useState<FirmwareVersion[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editedData, setEditedData] = useState<Partial<FirmwareVersion>>(); // Bỏ newFirmwareFile

    // fileInputRef không còn cần thiết cho inline editing, nhưng có thể cần cho modal nếu bạn dùng nó
    // const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchFirmware = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/firmware-version`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: FirmwareVersion[] = await response.json();
            setFirmwareVersions(data);
        } catch (err: any) {
            setError(err.message || 'Lỗi khi tải danh sách firmware.');
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL]);

    useEffect(() => {
        fetchFirmware();
    }, [fetchFirmware]);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSuccessAdd = () => {
        handleCloseModal();
        fetchFirmware();
    };

    // --- Chức năng Sửa (Inline Editing) ---
    const handleEditClick = (firmware: FirmwareVersion) => {
        setEditingId(firmware.id);
        setEditedData({
            ...firmware,
            releaseDate: new Date(firmware.releaseDate).toISOString().split('T')[0],
        });
        // if (fileInputRef.current) { // Không cần reset file input nữa
        //     fileInputRef.current.value = '';
        // }
    };

    const handleSaveEdit = async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            // Dữ liệu gửi đi KHÔNG BAO GỒM FILE, chỉ là JSON
            const dataToUpdate = {
                versionNumber: editedData?.versionNumber,
                releaseDate: editedData?.releaseDate,
                description: editedData?.description,
                // downloadUrl sẽ được giữ nguyên ở backend nếu không có file mới được gửi
            };

            const response = await fetch(`${API_BASE_URL}/api/firmware-versions/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json', // Trở lại Content-Type JSON
                },
                body: JSON.stringify(dataToUpdate),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            await fetchFirmware();
            setEditingId(null);
            setEditedData({});
        } catch (err: any) {
            setError(err.message || 'Lỗi khi cập nhật firmware.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditedData({});
        // if (fileInputRef.current) { // Không cần reset file input nữa
        //     fileInputRef.current.value = '';
        // }
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditedData((prev) => ({ ...prev, [name]: value }));
    };

    // handleFileEditChange không còn cần thiết cho inline editing

    const handleDeleteClick = async (id: number, versionNumber: string) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa phiên bản firmware ${versionNumber} (ID: ${id}) không?`)) {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${API_BASE_URL}/api/firmware-versions/${id}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }

                await fetchFirmware();
            } catch (err: any) {
                setError(err.message || 'Lỗi khi xóa firmware.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleLockClick = (id: number) => {
        alert(`Chức năng Khóa Firmware ID: ${id} sẽ được xử lý sau.`);
    };

    // Định nghĩa các style inline
    const containerStyle: React.CSSProperties = {
        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        padding: '20px',
        maxWidth: '100%', // Đã dùng max-width của bạn
        margin: '20px auto',
        backgroundColor: '#fff',
        borderRadius: '5px',
        boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
        border: '1px solid #ddd',
    };

    const headerContainerStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '1px solid #eee',
        paddingBottom: '10px',
    };

    const headerTitleStyle: React.CSSProperties = {
        fontSize: '20px',
        fontWeight: 'normal',
        color: '#333',
        margin: 0,
        textAlign: 'left',
    };

    const addButtonContainerStyle: React.CSSProperties = {
        textAlign: 'right',
    };

    const addButtonSyle: React.CSSProperties = {
        backgroundColor: '#5cb85c',
        color: 'white',
        border: '1px solid #4cae4c',
        padding: '8px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        transition: 'background-color 0.2s ease',
        whiteSpace: 'nowrap',
    };

    const tableContainerStyle: React.CSSProperties = {
        overflowX: 'auto',
        borderRadius: '4px',
        border: '1px solid #ddd',
    };

    const tableStyle: React.CSSProperties = {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '0',
        marginTop: '0px',
        borderRadius: '4px',
    };

    const thStyle: React.CSSProperties = {
        backgroundColor: '#f5f5f5',
        color: '#555',
        fontWeight: 'bold',
        padding: '10px 15px',
        borderBottom: '1px solid #ddd',
        borderRight: '1px solid #ddd',
        textTransform: 'none',
        fontSize: '13px',
        textAlign: 'left',
    };

    const thFirstStyle: React.CSSProperties = {
        ...thStyle,
        borderTopLeftRadius: '4px',
    };
    const thLastStyle: React.CSSProperties = {
        ...thStyle,
        borderTopRightRadius: '4px',
        borderRight: 'none',
    };

    const tdStyle: React.CSSProperties = {
        padding: '8px 15px',
        borderBottom: '1px solid #eee',
        borderRight: '1px solid #eee',
        color: '#333',
        fontSize: '13px',
        lineHeight: '1.42857143',
        verticalAlign: 'middle',
    };

    const tdLastColStyle: React.CSSProperties = {
        ...tdStyle,
        borderRight: 'none',
        borderBottomRightRadius: '4px',
    };

    const aStyle: React.CSSProperties = {
        color: '#337ab7',
        textDecoration: 'none',
    };

    const errorStyle: React.CSSProperties = {
        color: '#a94442',
        backgroundColor: '#f2dede',
        border: '1px solid #ebccd1',
        padding: '15px',
        borderRadius: '4px',
        textAlign: 'center',
        marginBottom: '20px',
    };

    const oddRowStyle: React.CSSProperties = {
        backgroundColor: '#fff',
    };
    const evenRowStyle: React.CSSProperties = {
        backgroundColor: '#f9f9f9',
    };

    const actionButtonContainerStyle: React.CSSProperties = {
        display: 'flex',
        gap: '5px', // Tăng gap lên 5px như trong ảnh
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
    };

    // --- Cập nhật style cho nút icon: Bỏ viền, nền trong suốt, chỉ dùng màu icon ---
    const iconButtonStyle: React.CSSProperties = {
        background: 'none', // Nền trong suốt
        border: 'none', // Bỏ viền
        borderRadius: '3px',
        padding: '6px', // Padding nhỏ hơn để chỉ viền icon
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
        minWidth: '28px', // Kích thước nút nhỏ hơn
        minHeight: '28px', // Kích thước nút nhỏ hơn
        position: 'relative', // Cho tooltip
    };

    const iconButtonHoverStyle: React.CSSProperties = {
        color: '#333', // Màu icon đậm hơn khi hover
    };

    const tooltipStyle: React.CSSProperties = {
        position: 'absolute',
        bottom: 'calc(100% + 5px)',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        whiteSpace: 'nowrap',
        zIndex: 1,
        visibility: 'hidden',
        opacity: 0,
        transition: 'opacity 0.2s ease, visibility 0.2s ease',
    };

    const tooltipVisibleStyle: React.CSSProperties = {
        visibility: 'visible',
        opacity: 1,
    };

    // Style màu cho từng loại icon button (chỉ áp dụng cho icon, không phải nền/viền)
    const editIconColor: React.CSSProperties = {
        color: '#337ab7', // Xanh dương cho bút chì
    };
    const deleteIconColor: React.CSSProperties = {
        color: '#d9534f', // Đỏ cho thùng rác
    };
    const lockIconColor: React.CSSProperties = {
        color: '#f0ad4e', // Cam cho khóa
    };
    const saveIconColor: React.CSSProperties = {
        color: '#5cb85c', // Xanh lá cho lưu
    };
    const cancelIconColor: React.CSSProperties = {
        color: '#a6a6a6', // Xám cho hủy
    };

    const inputInTableStyle: React.CSSProperties = {
        width: '100%',
        padding: '5px',
        boxSizing: 'border-box',
        border: '1px solid #ccc',
        borderRadius: '3px',
        fontSize: '13px',
    };

    const textareaInTableStyle: React.CSSProperties = {
        ...inputInTableStyle,
        resize: 'vertical',
        minHeight: '60px',
    };

    // Component nhỏ cho nút có tooltip
    const TooltipButton: React.FC<{
        onClick: () => void;
        icon: React.ReactNode;
        tooltip: string;
        baseColorStyle: React.CSSProperties; // Màu cơ bản của icon
        disabled?: boolean;
    }> = ({ onClick, icon, tooltip, baseColorStyle, disabled }) => {
        const [isHovered, setIsHovered] = useState(false);
        return (
            <button
                onClick={onClick}
                style={{
                    ...iconButtonStyle,
                    ...baseColorStyle, // Áp dụng màu icon cơ bản
                    ...(isHovered ? iconButtonHoverStyle : {}), // Hiệu ứng hover
                    ...(disabled ? { cursor: 'not-allowed', opacity: 0.6 } : {}) // Disable style
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                disabled={disabled}
            >
                {icon}
                <span style={isHovered ? { ...tooltipStyle, ...tooltipVisibleStyle } : tooltipStyle}>
                    {tooltip}
                </span>
            </button>
        );
    };

    if (loading) {
        return <div style={containerStyle}>Đang tải danh sách firmware...</div>;
    }

    if (error) {
        return <div style={{ ...containerStyle, ...errorStyle }}>Lỗi: {error}</div>;
    }

    return (
        <div style={containerStyle}>
            <div style={headerContainerStyle}>
                <h2 style={headerTitleStyle}>Danh sách Phiên bản Firmware</h2>
                <div style={addButtonContainerStyle}>
                    <button style={addButtonSyle} onClick={handleOpenModal}>
                        + Thêm
                    </button>
                </div>
            </div>

            {firmwareVersions.length === 0 ? (
                <p style={{ padding: '15px', textAlign: 'center', color: '#777' }}>Không có phiên bản firmware nào được tìm thấy.</p>
            ) : (
                <div style={tableContainerStyle}>
                    <table style={tableStyle}>
                        <thead>
                        <tr>
                            <th style={thFirstStyle}>ID</th>
                            <th style={thStyle}>Số phiên bản</th>
                            <th style={thStyle}>Ngày phát hành</th>
                            <th style={thStyle}>Mô tả</th>
                            <th style={thStyle}>Link tải xuống</th>
                            <th style={{ ...thLastStyle, textAlign: 'center' }}>Thao tác</th>
                        </tr>
                        </thead>
                        <tbody>
                        {firmwareVersions.map((firmware, index) => (
                            <tr key={firmware.id} style={index % 2 === 0 ? evenRowStyle : oddRowStyle}>
                                <td style={tdStyle}>{firmware.id}</td>
                                {/* Cột Số phiên bản */}
                                <td style={tdStyle}>
                                    {editingId === firmware.id ? (
                                        <input
                                            type="text"
                                            name="versionNumber"
                                            value={editedData?.versionNumber || ''}
                                            onChange={handleEditChange}
                                            style={inputInTableStyle}
                                        />
                                    ) : (
                                        firmware.versionNumber
                                    )}
                                </td>
                                {/* Cột Ngày phát hành */}
                                <td style={tdStyle}>
                                    {editingId === firmware.id ? (
                                        <input
                                            type="date"
                                            name="releaseDate"
                                            value={editedData?.releaseDate || ''}
                                            onChange={handleEditChange}
                                            style={inputInTableStyle}
                                        />
                                    ) : (
                                        new Date(firmware.releaseDate).toLocaleDateString()
                                    )}
                                </td>
                                {/* Cột Mô tả */}
                                <td style={tdStyle}>
                                    {editingId === firmware.id ? (
                                        <textarea
                                            name="description"
                                            value={editedData?.description || ''}
                                            onChange={handleEditChange}
                                            rows={3}
                                            style={textareaInTableStyle}
                                        />
                                    ) : (
                                        firmware.description || 'N/A'
                                    )}
                                </td>
                                {/* Cột Link tải xuống (Chỉ hiển thị, không sửa inline) */}
                                <td style={tdStyle}>
                                    {firmware.downloadUrl ? (
                                        <a
                                            href={`${API_BASE_URL.replace('/api', '')}${firmware.downloadUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={aStyle}
                                        >
                                            Tải xuống
                                        </a>
                                    ) : (
                                        'N/A'
                                    )}
                                </td>
                                {/* Cột Thao tác */}
                                <td style={{ ...tdLastColStyle, textAlign: 'center' }}>
                                    <div style={actionButtonContainerStyle}>
                                        {editingId === firmware.id ? (
                                            <>
                                                <TooltipButton
                                                    onClick={() => handleSaveEdit(firmware.id)}
                                                    icon={<FaSave />} // React Icon
                                                    tooltip="Lưu"
                                                    baseColorStyle={saveIconColor}
                                                    disabled={loading}
                                                />
                                                <TooltipButton
                                                    onClick={handleCancelEdit}
                                                    icon={<FaTimes />} // React Icon
                                                    tooltip="Hủy"
                                                    baseColorStyle={cancelIconColor}
                                                    disabled={loading}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <TooltipButton
                                                    onClick={() => handleEditClick(firmware)}
                                                    icon={<FaPencilAlt />} // React Icon
                                                    tooltip="Sửa"
                                                    baseColorStyle={editIconColor}
                                                />
                                                <TooltipButton
                                                    onClick={() => handleLockClick(firmware.id)}
                                                    icon={<FaLock />} // React Icon
                                                    tooltip="Khóa"
                                                    baseColorStyle={lockIconColor}
                                                />
                                                <TooltipButton
                                                    onClick={() => handleDeleteClick(firmware.id, firmware.versionNumber)}
                                                    icon={<FaTrashAlt />} // React Icon
                                                    tooltip="Xóa"
                                                    baseColorStyle={deleteIconColor}
                                                />
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal tạo mới */}
            <FirmwareFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={handleSuccessAdd}
            />
        </div>
    );
};

export default FirmwareList;