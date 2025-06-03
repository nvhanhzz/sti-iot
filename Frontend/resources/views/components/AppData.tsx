import React from 'react';
import { Row, Col } from 'antd';
import { AppItemsType } from '../../../interface/AppInterface';
import { uid } from 'uid';
import { useTranslation } from 'react-i18next';
interface ChildProps {
    AppItemArray: AppItemsType[];
    span: number;
}

const AppData: React.FC<ChildProps> = ({ AppItemArray, span }) => {
    const { t } = useTranslation();
    return (
        <>
            <Row gutter={[16, 24]}>
                {AppItemArray.map((item) => {
                    return <Col key={uid()} className="gutter-row" span={span}>
                        <div className="menu-apps" style={{ textAlign: 'center' }}>
                            <img src={item.img} alt="User-Profile-Image" style={{ width: '100px' }} />
                            <div className="user-details">
                                <div id="more-details">
                                    <a href={item.status ? (item.url) : '#'} target="_blank" style={{ fontSize: '15px', textDecoration: 'underline' }}>
                                        {item.name}
                                    </a>
                                    <div>
                                        <p>{item.decription}</p>
                                        <p>{t('status')} : <span style={item.status ? { color: 'green' } : { color: 'red' }}>{item.status ? t('availability') : t('not_available')}</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Col>
                })}
            </Row>
        </>
    )
}



export default AppData;