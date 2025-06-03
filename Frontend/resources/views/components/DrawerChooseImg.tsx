import React, { useState } from 'react';
import { Button, Drawer, Space } from 'antd';
import type { DrawerProps } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import ImgData from './ImgData';
import { FileFace } from '../../../interface/ImgInterface.ts'

interface ChildProps {
    handleChooseImage: (file: FileFace) => void;
}

const DrawerChooseImg: React.FC<ChildProps> = ({ handleChooseImage }) => {
    const [open, setOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<FileFace>();
    const [placement] = useState<DrawerProps['placement']>('top');
    const showDrawer = () => {
        setOpen(true);
    };
    const onClose = () => {
        if (selectedImage) {
            handleChooseImage(selectedImage);
        }
        setOpen(false);
    };
    const handleImageClick = (image: FileFace) => {
        setSelectedImage(image);
    };

    return (
        <>
            <Button icon={<UploadOutlined />} onClick={showDrawer}>Chọn File</Button>
            <Drawer
                title="Drawer with extra actions"
                placement={placement}
                width={500}
                height={500}
                onClose={onClose}
                open={open}
                extra={
                    <Space>
                        <Button onClick={onClose}>Cancel</Button>
                        <Button type="primary" onClick={onClose}>
                            OK
                        </Button>
                    </Space>
                }
            >
                <ImgData selectedImage={selectedImage} handleImageClick={handleImageClick}></ImgData>
            </Drawer>
        </>
    );
};

export default DrawerChooseImg;