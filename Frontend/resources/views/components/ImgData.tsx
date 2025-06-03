import React, { useState, useEffect } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import { uid } from 'uid';
import { getAuthToken } from '../../../cookie/AuthCookie.ts'
import AuthService from '../../../services/AuthService.ts';
import { FileFace } from '../../../interface/ImgInterface.ts'
const props: UploadProps = {
    action: 'http://127.0.0.1:3030/user/post-file-img',
    headers: {
        'Authorization': `Bearer ${(getAuthToken()?.slice(1))?.slice(0, -1)}`, // Gửi token vào header
    },
    defaultFileList: [],
};
interface ChildProps {
    selectedImage?: FileFace;
    handleImageClick: (file: FileFace) => void;
}
const ImgData: React.FC<ChildProps> = ({ selectedImage, handleImageClick }) => {
    const [fileList, setFileList] = useState<FileFace[]>([]);
    const fetchData = async () => {
        const dataImgs = await AuthService.getDataImg();
        setFileList(dataImgs.data.data);
    };
    useEffect(() => {
        fetchData();
    }, []);
    const handleChange: UploadProps['onChange'] = ({ file }) => {
        if (file.status === 'done') {
            message.success(`${file.name} file uploaded successfully.`);
            console.log('Server response:', file.response);
            setFileList([...fileList, file.response.data]);
        }
        else if (file.status === 'error') {
            message.error(`${file.name} file upload failed. : ${file.response.status} => ${file.response.msg}`);
        }
    };
    return (
        <>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {fileList.map((image) => (
                    <div
                        key={uid()}
                        style={{
                            margin: '10px',
                            border: selectedImage?.id === image.id ? '2px solid blue' : 'none',
                            cursor: 'pointer',
                        }}
                        onClick={() => handleImageClick(image)}
                    >
                        <img src={`http://127.0.0.1:3030${image.url}`} alt={image.name} style={{ width: '100px', height: '100px' }} />
                    </div>
                ))}
            </div>
            <Upload {...props} onChange={handleChange}>
                <Button icon={<UploadOutlined />}>Upload</Button>
            </Upload>
        </>
    );
};

export default ImgData;