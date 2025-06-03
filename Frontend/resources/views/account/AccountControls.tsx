import React, { useRef, useState } from 'react';
import { useOutletContext } from "react-router-dom";
import { useTranslation } from 'react-i18next';

import { SearchOutlined, FileAddOutlined, ExportOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons';
import type { InputRef, TableColumnsType, TableColumnType, UploadFile } from 'antd';
import { Button, Input, Space, Table, Flex, Upload } from 'antd';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import Highlighter from 'react-highlight-words';

interface DataType {
    key: string;
    name: string;
    age: number;
    address: string;
}
type DataIndex = keyof DataType;

const data: DataType[] = [
    {
        key: '1',
        name: 'John Brown',
        age: 32,
        address: 'New York No. 1 Lake Park',
    },
    {
        key: '2',
        name: 'Joe Black',
        age: 42,
        address: 'London No. 1 Lake Park',
    },
    {
        key: '3',
        name: 'Jim Green',
        age: 32,
        address: 'Sydney No. 1 Lake Park',
    },
    {
        key: '4',
        name: 'Jim Red',
        age: 32,
        address: 'London No. 2 Lake Park',
    },
];
const fileList: UploadFile[] = [
];
type ContextType = {
    changePageName: (page: string) => void;
};
const AccountControls: React.FC = () => {
    const { t } = useTranslation();
    const { changePageName } = useOutletContext<ContextType>();
    React.useEffect(() => {
        changePageName(t('navleft.accounts'));
    }, [changePageName]);
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const searchInput = useRef<InputRef>(null);

    const handleSearch = (
        selectedKeys: string[],
        confirm: FilterDropdownProps['confirm'],
        dataIndex: DataIndex,
    ) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };

    const handleReset = (clearFilters: () => void) => {
        clearFilters();
        setSearchText('');
    };

    const getColumnSearchProps = (dataIndex: DataIndex): TableColumnType<DataType> => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
                <Input
                    ref={searchInput}
                    placeholder={`${t('search')} ${t('for')} ${t(dataIndex)}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
                    style={{ marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        {t('search')}
                    </Button>
                    <Button
                        onClick={() => clearFilters && handleReset(clearFilters)}
                        size="small"
                        style={{ width: 90 }}
                    >
                        {t('reset')}
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            confirm({ closeDropdown: false });
                            setSearchText((selectedKeys as string[])[0]);
                            setSearchedColumn(dataIndex);
                        }}
                    >
                        {t('filter')}
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered: boolean) => (
            <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
        ),
        onFilter: (value, record) =>
            record[dataIndex]
                .toString()
                .toLowerCase()
                .includes((value as string).toLowerCase()),
        filterDropdownProps: {
            onOpenChange(open) {
                if (open) {
                    setTimeout(() => searchInput.current?.select(), 100);
                }
            },
        },
        render: (text) =>
            searchedColumn === dataIndex ? (
                <Highlighter
                    highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                    searchWords={[searchText]}
                    autoEscape
                    textToHighlight={text ? text.toString() : ''}
                />
            ) : (
                text
            ),
    });

    const columns: TableColumnsType<DataType> =
        [
            {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
                width: '30%',
                ...getColumnSearchProps('name'),
            },
            {
                title: 'Age',
                dataIndex: 'age',
                key: 'age',
                width: '20%',
                ...getColumnSearchProps('age'),
            },
            {
                title: 'Address',
                dataIndex: 'address',
                key: 'address',
                ...getColumnSearchProps('address'),
                sortDirections: ['descend', 'ascend'],
            },
            {
                title: 'operation',
                dataIndex: 'operation',
                render: (_) =>
                    data.length >= 1 ? (
                        <Button type="primary" icon={<EditOutlined />}>
                            Sửa
                        </Button>
                    ) : null,
            },
        ];
    return (
        <div className="card">
            <div className="card-header">
                <Flex gap="small" wrap>
                    <Button type="primary" size={'large'} icon={<FileAddOutlined />}>
                        Thêm Tài Khoản
                    </Button>
                    <Upload
                        action="https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload"
                        listType="picture"
                        defaultFileList={fileList}
                    >
                        <Button size={'large'} icon={<UploadOutlined />}>
                            Nhập File Excel
                        </Button>
                    </Upload>
                    <Button type="dashed" size={'large'} icon={<ExportOutlined />}>
                        Xuất File Excel
                    </Button>
                </Flex>
            </div>
            <div className="card-body">
                <Table<DataType> columns={columns} dataSource={data} />
            </div>
        </div>

    );
};

export default AccountControls;