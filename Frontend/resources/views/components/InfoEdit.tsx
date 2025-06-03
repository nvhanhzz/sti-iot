import React, { useState, useEffect } from 'react';
import { Form, Input, Image, Button } from 'antd';

import AuthService from '../../../services/AuthService';
import DrawerChooseImg from './DrawerChooseImg';
import { FileFace } from '../../../interface/ImgInterface'
import { UserItemsType } from '../../../interface/UserInterface'

const InfoEdit: React.FC = () => {
    const [defautVal, setDefautVal] = useState<UserItemsType>({});
    const [form] = Form.useForm<UserItemsType>();
    const handleFinish = async (values: UserItemsType) => {
        try {

            defautVal.name = values.name;
            defautVal.username = values.username;
            defautVal.email = values.email;
            defautVal.avatar = values.avatar;
            console.log(defautVal);
            // console.log(values);
            const response = await AuthService.updateDataInfo(values);
            console.log('Response:', response);
        } catch (error) {
            console.error('Error:', error);
        }
    };
    const handleChooseImage = (file: FileFace) => {
        const updatedImage = file.url;
        setDefautVal((prev) => ({
            ...prev,
            avatar: updatedImage,
        }));
        form.setFieldsValue({ avatar: updatedImage });
    };

    const fetchData = async () => {
        const userData = AuthService.getUserLocal();
        form.setFieldsValue(userData);
        setDefautVal(userData);
    };
    useEffect(() => {
        fetchData();
    }, []);
    return (
        <Form<UserItemsType>
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={defautVal}
        >
            <Form.Item
                label="name"
                name="name"
                rules={[{ required: true, message: 'Please enter some text!' }]}
            >
                <Input placeholder="Enter text here" />
            </Form.Item>
            <Form.Item
                label="username"
                name="username"
                rules={[{ required: true, message: 'Please enter some text!' }]}
            >
                <Input placeholder="Enter text here" />
            </Form.Item>
            <Form.Item
                label="email"
                name="email"
                rules={[{ required: true, message: 'Please enter some text!' }]}
            >
                <Input placeholder="Enter text here" />
            </Form.Item>
            <Form.Item
                label="avatar"
                name="avatar"
                className='d-none'
            >
                <Input placeholder="Enter text here" />
            </Form.Item>
            <Form.Item>
                <Image
                    width={150}
                    src={defautVal.avatar ? `http://127.0.0.1:3030${defautVal.avatar}` : undefined}
                    fallback="https://via.placeholder.com/200"
                />
            </Form.Item>
            <Form.Item>
                <DrawerChooseImg handleChooseImage={handleChooseImage}></DrawerChooseImg>
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit">
                    Submit
                </Button>
            </Form.Item>
        </Form>
    );
};

export default InfoEdit;
