// src/config/swagger.config.ts

import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index'; // Import đối tượng config của bạn để lấy cổng

const swaggerOptions: swaggerJsdoc.Options = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Your IoT Platform API',
            version: '1.0.0',
            description: 'API Documentation for the IoT Device Management Platform',
            contact: {
                name: 'Your Team/Company',
                url: 'http://yourwebsite.com',
                email: 'your.email@example.com',
            },
        },
        servers: [
            {
                url: `http://localhost:${config.port}/api`,
                description: 'Local Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token in the format "Bearer <token>"',
                },
                apiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key',
                    description: 'Enter your API key in the header',
                }
            },
            schemas: {
                // --- Schema chung cho phản hồi lỗi ---
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            description: 'A human-readable error message.',
                            example: 'Resource not found'
                        },
                        code: {
                            type: 'string',
                            description: 'An application-specific error code.',
                            example: 'NOT_FOUND_ERROR'
                        }
                    }
                },
                // --- Schema cho IotStatistic (Mongoose) ---
                IotStatistic: {
                    type: 'object',
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'ID duy nhất của bản ghi thống kê (MongoDB ObjectId)',
                            example: '60c72b2f9b1d8e001c8c4f2a'
                        },
                        deviceId: {
                            type: 'string',
                            description: 'ID của thiết bị IoT.',
                            example: 'DEV-ABC-123'
                        },
                        cmd: {
                            type: 'string',
                            description: 'Lệnh (command) của gói tin.',
                            example: 'CMD_STATUS_REPORT'
                        },
                        isMissed: {
                            type: 'boolean',
                            description: 'Cho biết gói tin có bị bỏ lỡ hay không.',
                            example: false
                        },
                        timestamp: {
                            type: 'number',
                            description: 'Thời gian tạo bản ghi (Unix timestamp).',
                            example: 1678886400000 // Ví dụ: March 15, 2023 12:00:00 PM GMT
                        },
                        // Thêm các trường động nếu strict: false cho phép
                        // (Bạn có thể bỏ qua nếu không muốn hiển thị các trường không xác định)
                        // Nếu có các trường đặc biệt từ [key: string]: any, bạn có thể mô tả chúng cụ thể hơn
                        // hoặc sử dụng additionalProperties nếu muốn mô tả các trường động chung chung.
                        // additionalProperties: true // Cho phép các thuộc tính bổ sung không được định nghĩa rõ ràng
                    },
                    required: ['deviceId', 'cmd', 'isMissed']
                    // MongoDB thêm _id tự động, không cần required
                },
                // --- Schema cho IotSettings (Sequelize) ---
                IotSettings: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', format: 'int64', description: 'ID duy nhất của cài đặt thiết bị.', example: 101 },
                        name: { type: 'string', description: 'Tên hiển thị của thiết bị.', example: 'Sensor nhiệt độ kho lạnh' },
                        device_id: { type: 'string', description: 'ID định danh thiết bị.', example: 'SN-ABC-XYZ' },
                        mac: { type: 'string', description: 'Địa chỉ MAC của thiết bị.', example: 'AA:BB:CC:DD:EE:FF' },
                        ip: { type: 'string', format: 'ipv4', description: 'Địa chỉ IP của thiết bị.', example: '192.168.1.100' },
                        type: { type: 'integer', description: 'Loại thiết bị (có thể là mã định danh).', example: 1 },
                        note: { type: 'string', description: 'Ghi chú về thiết bị.', example: 'Thiết bị lắp đặt tại khu vực A' },
                        user_created: { type: 'integer', format: 'int64', description: 'ID người tạo.', example: 1 },
                        time_created: { type: 'string', format: 'date-time', description: 'Thời gian tạo bản ghi.', example: '2023-01-01T10:00:00Z' },
                        user_updated: { type: 'integer', format: 'int64', description: 'ID người cập nhật gần nhất.', example: 2 },
                        time_updated: { type: 'string', format: 'date-time', description: 'Thời gian cập nhật gần nhất.', example: '2023-01-05T15:30:00Z' },
                        isdelete: { type: 'boolean', description: 'Trạng thái xóa mềm (0: không xóa, 1: đã xóa).', example: false },
                        tcp_status: { type: 'string', enum: ['requestOpen', 'opened', 'requestClose', 'closed'], description: 'Trạng thái kết nối TCP.', example: 'opened' },
                        udp_status: { type: 'string', enum: ['requestOpen', 'opened', 'requestClose', 'closed'], description: 'Trạng thái kết nối UDP.', example: 'closed' },
                        wifiConfig: {
                            type: 'object',
                            description: 'Cấu hình Wi-Fi của thiết bị.',
                            properties: {
                                ssid: { type: 'string', example: 'MyWiFiNetwork' },
                                password: { type: 'string', format: 'password', example: 'securepass' },
                                ip: { type: 'string', format: 'ipv4', example: '192.168.1.200' },
                                gateway: { type: 'string', format: 'ipv4', example: '192.168.1.1' },
                                subnet: { type: 'string', example: '255.255.255.0' },
                                dns: { type: 'string', format: 'ipv4', example: '8.8.8.8' }
                            }
                        },
                        ethernetConfig: {
                            type: 'object',
                            description: 'Cấu hình Ethernet của thiết bị.',
                            properties: {
                                mac: { type: 'string', example: 'FF:EE:DD:CC:BB:AA' },
                                ip: { type: 'string', format: 'ipv4', example: '10.0.0.50' },
                                gateway: { type: 'string', format: 'ipv4', example: '10.0.0.1' },
                                subnet: { type: 'string', example: '255.255.255.0' },
                                dns: { type: 'string', format: 'ipv4', example: '8.8.4.4' }
                            }
                        },
                        mqttConfig: {
                            type: 'object',
                            description: 'Cấu hình MQTT của thiết bị.',
                            properties: {
                                server: { type: 'string', example: 'mqtt.broker.com' },
                                port: { type: 'integer', example: 1883 },
                                user: { type: 'string', example: 'mqttuser' },
                                pw: { type: 'string', format: 'password', example: 'mqttpass' },
                                subTopic: { type: 'string', example: 'device/data/{deviceId}' },
                                pubTopic: { type: 'string', example: 'device/command/{deviceId}' },
                                qos: { type: 'integer', enum: [0, 1, 2], example: 1 },
                                keepAlive: { type: 'integer', example: 60 }
                            }
                        },
                        rs485Config: {
                            type: 'object',
                            description: 'Cấu hình RS485 của thiết bị.',
                            properties: {
                                baudrate: { type: 'integer', example: 9600 },
                                serialConfig: { type: 'string', example: '8N1' }, // Ví dụ: 8 data bits, no parity, 1 stop bit
                                id: { type: 'integer', example: 1 },
                                address: { type: 'string', example: '01' }
                            }
                        },
                        tcpConfig: {
                            type: 'object',
                            description: 'Cấu hình TCP của thiết bị.',
                            properties: {
                                // Tùy thuộc vào cấu hình TCP thực tế của bạn
                                port: { type: 'integer', example: 502 },
                                mode: { type: 'string', enum: ['client', 'server'], example: 'client' },
                                targetIp: { type: 'string', format: 'ipv4', example: '192.168.1.5' },
                            }
                        },
                        canConfig: {
                            type: 'object',
                            description: 'Cấu hình CAN của thiết bị.',
                            properties: {
                                baudrate: { type: 'integer', example: 500000 }, // Ví dụ: 500kbps
                                filterId: { type: 'string', example: '0x123' },
                                mask: { type: 'string', example: '0xFFF' }
                            }
                        },
                        rs232Config: {
                            type: 'object',
                            description: 'Cấu hình RS232 của thiết bị.',
                            properties: {
                                baudrate: { type: 'integer', example: 115200 },
                                serialConfig: { type: 'string', example: '8N1' },
                                id: { type: 'integer', example: 2 },
                                address: { type: 'string', example: '02' }
                            }
                        },
                        digitalInputConfig: {
                            type: 'object',
                            description: 'Cấu hình Digital Input của thiết bị.',
                            properties: {
                                modeDigitalInput: { type: 'string', enum: ['pull_up', 'pull_down', 'none'], example: 'pull_up' }
                            }
                        },
                        firmware_version_id: {
                            type: 'integer',
                            description: 'ID của phiên bản firmware.',
                            example: 1
                        },
                    },
                    required: ['device_id'] // Các trường bắt buộc tối thiểu
                }
                // Thêm các schema khác nếu cần
            }
        }
    },
    apis: [
        './src/routes/*.routes.ts',
        // 'src/controllers/*.ts', // Bỏ comment nếu bạn định nghĩa swagger comments trong controllers
        // 'src/models/sql/*.ts',   // Bỏ comment nếu bạn định nghĩa swagger comments trong các file model Sequelize của bạn
        // 'src/models/mongo/*.ts', // Bỏ comment nếu bạn định nghĩa swagger comments trong các file model Mongoose của bạn
    ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;