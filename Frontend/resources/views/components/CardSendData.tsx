import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MinusCircleOutlined, PlusOutlined, ThunderboltOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Button, Input, Modal, Form, message, Row, Col, Card, Space, List } from 'antd';
import PaginatedSearchSelect from '../components/PaginatedSearchSelect';
import PaginatedSearchChoose from '../components/PaginatedSearchChoose';
import IotService from '../../../services/IotService';

const CardSendData: React.FC = () => {
    const { t } = useTranslation();
    const [modal3Open, setModal3Open] = useState(false);
    const [formSendData] = Form.useForm();
    const [dataList, setDataList] = useState<any>([]);
    const handleOkDataSend = async () => {
        const loadingMessage = message.loading('Loading...', 0);
        try {
            const values = await formSendData.validateFields();
            const response: any = await IotService.PostDeviceSendData(values);
            console.log(response);
            const resData = response.data;
            setDataList(resData.data);
            message.success(t('errorCode.' + resData.message));
        } catch (errorInfo: any) {
            const response = errorInfo?.response;
            const errorMessage = response?.data?.message || 'Something went wrong';
            message.error(t('errorCode.' + errorMessage));
        } finally {
            loadingMessage();
        }
    };

    return (
        <>
            <Button size={'large'} icon={<ThunderboltOutlined />} onClick={() => setModal3Open(true)}>
                {t('action')}
            </Button>
            <Modal
                title={t('iots.output')}
                open={modal3Open}
                onCancel={() => { setModal3Open(false) }}
                width={1000}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Card title="Dữ Liệu Dạng Json">
                            <Form
                                style={{ maxWidth: 600 }}
                                autoComplete="off"
                                layout="vertical"
                                form={formSendData}
                            >
                                <Form.Item name="topic" label="Topic" rules={[{ required: true, message: 'Bạn Chưa Nhập Topic' }]}>
                                    <Input />
                                </Form.Item>
                                <Form.Item name="mac" label="MAC ( Nếu Không Chọn Thì Là Gửi Tất Cả IOT )">
                                    <PaginatedSearchSelect columns="mac" table='iot' />
                                </Form.Item>
                                <Form.Item name="cmd" label="CMD" rules={[{ required: true, message: 'Bạn Chưa Nhập CMD' }]}>
                                    <PaginatedSearchChoose columns="decriptions" table='iot_cmd' />
                                </Form.Item>
                                <p>PAYLOAD : </p>
                                <Form.List name="payload" >
                                    {(fields, { add, remove }) => (
                                        <>
                                            {fields.map(({ key, name, ...restField }) => (
                                                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                                    <Form.Item
                                                        name={[name, 'payload_type']}
                                                        rules={[{ required: true, message: 'Bạn Chưa Nhập Kiểu Dữ Liệu' }]}
                                                        style={{ width: "200px" }}
                                                    >
                                                        <PaginatedSearchChoose columns="js_type" table='payload_type' />
                                                    </Form.Item>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'data']}
                                                        rules={[{ required: true, message: 'Bạn Chưa Nhập Dữ Liệu' }]}
                                                    >
                                                        <Input placeholder="Dữ Liệu" />
                                                    </Form.Item>
                                                    <MinusCircleOutlined onClick={() => remove(name)} />
                                                </Space>
                                            ))}
                                            <Form.Item>
                                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                    Add field
                                                </Button>
                                            </Form.Item>
                                        </>
                                    )}
                                </Form.List>
                                <Form.Item name="crc" label="CRC" rules={[{ required: true, message: 'Bạn Chưa Nhập CRC' }]}>
                                    <Input />
                                </Form.Item>
                            </Form>
                            <Button type="primary" onClick={() => handleOkDataSend()}>
                                Gửi Dữ Liệu
                            </Button>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card title="Dữ Liệu Dạng Hex">
                            <List
                                itemLayout="horizontal"
                                dataSource={dataList}
                                renderItem={(item: any, index: any) => (
                                    <List.Item>
                                        <List.Item.Meta
                                            title={<p>{item.title} <span style={{ color: item.status ? 'green' : 'red' }}> {item.status ? <CheckCircleOutlined /> : <CloseCircleOutlined />}</span></p>}
                                            description={
                                                <>
                                                    <p>{item.topic} : {item.data}</p>
                                                </>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </Col>
                </Row>
            </Modal>
        </>
    );
};

export default CardSendData;