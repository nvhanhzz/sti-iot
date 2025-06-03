import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '../lang/en'
import vi from '../lang/vi'
i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: en,
            },
            vi: {
                translation: vi,
            },
        },
        lng: localStorage.getItem('lang') ? localStorage.getItem('lang') : 'vi',
        fallbackLng: localStorage.getItem('lang') ? localStorage.getItem('lang') : 'vi',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
