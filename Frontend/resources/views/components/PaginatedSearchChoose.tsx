import React, { useState, useEffect } from 'react';
import { Select, Spin, Button } from 'antd';
import IotService from '../../../services/IotService';
import CMDService from '../../../services/CMDService';
import PayloadTypeSevice from '../../../services/PayloadTypeSevice';
import { useTranslation } from 'react-i18next';

const { Option } = Select;

interface OptionType {
    id: number;
    column_name: string;
}

interface PaginationType {
    current_page: number;
    last_page: number;
}

interface PaginatedSearchSelectProps {
    columns: string
    value?: any;
    onChange?: (value: any) => void;
    table: string;
}
const PaginatedSearchChoose: React.FC<PaginatedSearchSelectProps> = ({ columns, value, onChange, table }) => {
    const { t } = useTranslation();
    const [options, setOptions] = useState<OptionType[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    const [lastPage, setLastPage] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
    const fetchSearchResults = async (search: string, currentPage: number = 1) => {
        if (!search) {
            setOptions([]);
            return;
        }
        setLoading(true);
        try {
            const params: any = {
                columns: [columns],
                value: search,
                page: currentPage,
            };
            let response: any = null;
            switch (table) {
                case 'iot':
                    response = await IotService.GetDataColumnsIot(params);
                    break;
                case 'iot_cmd':
                    response = await CMDService.GetDataColumnsIotCMD(params);
                    break;
                case 'payload_type':
                    response = await PayloadTypeSevice.GetDataColumnsPayloadType(params);
                    break;
            }
            const data = response.data.listData as OptionType[];
            const pagination = response.data.pagination as PaginationType;
            setOptions(currentPage === 1 ? data : [...options, ...data]); // Gộp dữ liệu nếu là trang tiếp theo
            setPage(Number(pagination.current_page));
            setLastPage(pagination.last_page);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        setLoading(false);
    };
    useEffect(() => {
        if (searchTerm) {
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }
            const timeout = setTimeout(() => {
                fetchSearchResults(searchTerm, 1);
            }, 500);
            setTypingTimeout(timeout);
        } else {
            setOptions([]);
        }
    }, [searchTerm]);
    const handleSearch = (value: string) => {
        setSearchTerm(value);
    };
    const loadMore = () => {
        if (page < lastPage && !loading) {
            fetchSearchResults(searchTerm, page + 1);
        }
    };
    return (
        <Select
            showSearch
            allowClear
            placeholder={`${t('search')}...`}
            value={value}
            onChange={(val) => onChange?.(val)}
            notFoundContent={loading ? <Spin size="small" /> : `${t('No_results_found')}`}
            filterOption={false}
            onSearch={handleSearch}
            style={{ width: '100%' }}
            dropdownRender={(menu) => (
                <>
                    {menu}
                    {page < lastPage && (
                        <div style={{ textAlign: 'center', padding: 8 }}>
                            <Button type="link" onClick={loadMore} loading={loading}>
                                Tải thêm
                            </Button>
                        </div>
                    )}
                </>
            )}
        >
            {options.map((item) => (
                <Option key={item.id} value={item.column_name}>
                    {item.column_name}
                </Option>
            ))}
        </Select>
    );
};

export default PaginatedSearchChoose;
