import React from 'react';
import { useOutletContext } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Flex, Button } from 'antd';
import { FileAddOutlined } from '@ant-design/icons'
import InfoEdit from '../components/InfoEdit';
type ContextType = {
    changePageName: (page: string) => void;
};
const Infor: React.FC = () => {
    const { t } = useTranslation();
    const { changePageName } = useOutletContext<ContextType>();
    React.useEffect(() => {
        changePageName(t('navleft.info'));
    }, [changePageName]);

    return (
        <div className="card">
            <div className="card-header">
                <Flex gap="small" wrap>
                    <Button type="primary" size={'large'} icon={<FileAddOutlined />}>
                        Đổi Mật Khẩu
                    </Button>
                    <Button type="primary" size={'large'} icon={<FileAddOutlined />}>
                        Lịch Sử Đăng Nhập
                    </Button>
                </Flex>
            </div>
            <div className="card-body">
                <InfoEdit></InfoEdit>
            </div>
        </div>

    );
};

export default Infor;