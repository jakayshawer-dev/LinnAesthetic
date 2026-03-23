// 飞书表格集成示例
// 这个文件展示了如何将付款确认信息推送到飞书表格

// 飞书配置（需要管理员在飞书开放平台创建应用并获取）
const FEISHU_CONFIG = {
    // 应用凭证
    APP_ID: 'your_app_id',
    APP_SECRET: 'your_app_secret',
    
    // 飞书表格信息
    BITABLE_APP_TOKEN: 'your_bitable_app_token',  // 表格应用的 token
    BITABLE_TABLE_ID: 'your_bitable_table_id',     // 表格 ID
    
    // API 地址
    API_BASE: 'https://open.feishu.cn/open-apis',
    
    // 表格字段映射（根据实际表格字段名调整）
    FIELD_MAPPING: {
        order_id: '订单号',
        payment_method: '支付方式',
        payment_time: '付款时间',
        screenshot: '截图',
        status: '状态',
        created_time: '创建时间',
        notes: '备注',
        result_link: '访问链接'
    }
};

// 获取飞书访问令牌
async function getFeishuAccessToken() {
    const response = await fetch(`${FEISHU_CONFIG.API_BASE}/auth/v3/tenant_access_token/internal`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            app_id: FEISHU_CONFIG.APP_ID,
            app_secret: FEISHU_CONFIG.APP_SECRET
        })
    });
    
    const data = await response.json();
    if (data.code === 0) {
        return data.tenant_access_token;
    } else {
        throw new Error(`获取飞书访问令牌失败: ${data.msg}`);
    }
}

// 上传图片到飞书并获取 file_token
async function uploadImageToFeishu(imageFile) {
    const token = await getFeishuAccessToken();
    
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('image_type', 'message');
    
    const response = await fetch(`${FEISHU_CONFIG.API_BASE}/im/v1/images`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    
    const data = await response.json();
    if (data.code === 0) {
        return data.data.image_key;
    } else {
        throw new Error(`上传图片失败: ${data.msg}`);
    }
}

// 创建飞书表格记录
async function createFeishuRecord(orderData) {
    const token = await getFeishuAccessToken();
    
    // 构建字段数据
    const fields = {
        [FEISHU_CONFIG.FIELD_MAPPING.order_id]: orderData.orderId,
        [FEISHU_CONFIG.FIELD_MAPPING.payment_method]: orderData.paymentMethod,
        [FEISHU_CONFIG.FIELD_MAPPING.payment_time]: orderData.paymentTime,
        [FEISHU_CONFIG.FIELD_MAPPING.status]: '待审核',
        [FEISHU_CONFIG.FIELD_MAPPING.created_time]: new Date().toISOString(),
        [FEISHU_CONFIG.FIELD_MAPPING.notes]: orderData.notes || ''
    };
    
    // 如果有截图，添加截图字段
    if (orderData.screenshotFileToken) {
        fields[FEISHU_CONFIG.FIELD_MAPPING.screenshot] = [{
            file_token: orderData.screenshotFileToken
        }];
    }
    
    const response = await fetch(
        `${FEISHU_CONFIG.API_BASE}/bitable/v1/apps/${FEISHU_CONFIG.BITABLE_APP_TOKEN}/tables/${FEISHU_CONFIG.BITABLE_TABLE_ID}/records`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: fields
            })
        }
    );
    
    const data = await response.json();
    if (data.code === 0) {
        return data.data.record;
    } else {
        throw new Error(`创建表格记录失败: ${data.msg}`);
    }
}

// 更新飞书表格记录（例如更新状态或添加结果链接）
async function updateFeishuRecord(recordId, updates) {
    const token = await getFeishuAccessToken();
    
    const fields = {};
    Object.keys(updates).forEach(key => {
        if (FEISHU_CONFIG.FIELD_MAPPING[key]) {
            fields[FEISHU_CONFIG.FIELD_MAPPING[key]] = updates[key];
        }
    });
    
    const response = await fetch(
        `${FEISHU_CONFIG.API_BASE}/bitable/v1/apps/${FEISHU_CONFIG.BITABLE_APP_TOKEN}/tables/${FEISHU_CONFIG.BITABLE_TABLE_ID}/records/${recordId}`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: fields
            })
        }
    );
    
    const data = await response.json();
    if (data.code === 0) {
        return data.data.record;
    } else {
        throw new Error(`更新表格记录失败: ${data.msg}`);
    }
}

// 发送飞书消息通知（通知管理员有新订单）
async function sendFeishuNotification(recordId, orderData) {
    const token = await getFeishuAccessToken();
    
    // 这里需要配置管理员的飞书用户ID或群聊ID
    const receiveId = 'admin_user_id_or_chat_id';
    const msgType = 'user'; // 或 'chat'
    
    const messageContent = {
        zh_cn: {
            title: '📋 新付款确认待审核',
            content: [
                [
                    {
                        tag: 'text',
                        text: `订单号：${orderData.orderId}\n`
                    },
                    {
                        tag: 'text',
                        text: `支付方式：${orderData.paymentMethod}\n`
                    },
                    {
                        tag: 'text',
                        text: `付款时间：${orderData.paymentTime}\n`
                    },
                    {
                        tag: 'text',
                        text: `状态：待审核\n\n`
                    },
                    {
                        tag: 'a',
                        text: '点击查看订单详情',
                        href: `https://your-feishu-bitable-url/${recordId}`
                    }
                ]
            ]
        }
    };
    
    const response = await fetch(`${FEISHU_CONFIG.API_BASE}/im/v1/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            receive_id: receiveId,
            msg_type: 'interactive',
            content: JSON.stringify(messageContent)
        })
    });
    
    const data = await response.json();
    return data.code === 0;
}

// 完整的付款确认推送流程
async function pushPaymentToFeishu(orderData, screenshotFile) {
    try {
        console.log('开始推送付款信息到飞书...');
        
        // 1. 上传截图到飞书
        let screenshotToken = null;
        if (screenshotFile) {
            console.log('上传截图中...');
            screenshotToken = await uploadImageToFeishu(screenshotFile);
            console.log('截图上传成功，file_token:', screenshotToken);
        }
        
        // 2. 创建表格记录
        console.log('创建表格记录...');
        const recordData = {
            ...orderData,
            screenshotFileToken: screenshotToken
        };
        
        const record = await createFeishuRecord(recordData);
        console.log('表格记录创建成功，record_id:', record.record_id);
        
        // 3. 发送通知
        console.log('发送通知...');
        await sendFeishuNotification(record.record_id, orderData);
        console.log('通知发送成功');
        
        return {
            success: true,
            recordId: record.record_id,
            orderId: orderData.orderId
        };
        
    } catch (error) {
        console.error('推送付款信息失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// 示例使用
async function exampleUsage() {
    // 模拟订单数据
    const orderData = {
        orderId: 'LAA202603231633001234',
        paymentMethod: '支付宝',
        paymentTime: '2026-03-23 16:33:00',
        notes: '付款人：张三，金额：99元'
    };
    
    // 模拟截图文件（实际从input获取）
    // const screenshotFile = document.getElementById('screenshot-input').files[0];
    
    // 推送到飞书
    const result = await pushPaymentToFeishu(orderData, null);
    
    if (result.success) {
        console.log('付款信息已成功推送到飞书');
        console.log('订单号:', result.orderId);
        console.log('记录ID:', result.recordId);
        
        // 可以在这里显示成功消息给用户
        return {
            success: true,
            message: '付款确认已提交，管理员审核后会为你开通结果。'
        };
    } else {
        console.error('推送失败:', result.error);
        return {
            success: false,
            message: '提交失败，请稍后重试或联系管理员。'
        };
    }
}

// 导出函数供其他文件使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getFeishuAccessToken,
        uploadImageToFeishu,
        createFeishuRecord,
        updateFeishuRecord,
        sendFeishuNotification,
        pushPaymentToFeishu,
        exampleUsage
    };
}