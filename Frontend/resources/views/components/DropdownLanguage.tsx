import React from 'react';
import type { MenuProps } from 'antd';
import { Dropdown } from 'antd';
import languageImg from '../../assets/img/translation.png'
import { useTranslation } from 'react-i18next';

const DropdownLanguage: React.FC = () => {
    const { i18n } = useTranslation();
    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };
    const items: MenuProps['items'] = [
        {
            label: (
                <a className="btn dropdown-item" style={{ backgroundColor: i18n.language === 'vi' ? '#ffff80' : '' }} onClick={() => changeLanguage('vi')}>Tiếng Việt (VIE)</a>
            ),
            key: '0',
        },
        {
            label: (
                <a className="btn dropdown-item" style={{ backgroundColor: i18n.language === 'en' ? '#ffff80' : '' }} onClick={() => changeLanguage('en')}>English (UK)</a>
            ),
            key: '1',
        },
        {
            label: (
                <a className="btn dropdown-item" style={{ backgroundColor: i18n.language === 'jp' ? '#ffff80' : '' }} onClick={() => changeLanguage('jp')}>日本語 (JP)</a>
            ),
            key: '2',
        },
    ];
    return (
        <>
            <Dropdown menu={{ items }} trigger={['click']}>
                <a onClick={(e) => e.preventDefault()}>
                    <img src={languageImg} className="logo" style={{ width: '30px' }} />
                </a>
            </Dropdown>
        </>
    )
}
export default DropdownLanguage;