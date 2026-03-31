// 引擎加载器 - 用于在浏览器中加载final-v3引擎

// 全局引擎实例
let secondLayerEngine = null;

// 加载引擎
async function loadSecondLayerEngine() {
    try {
        // 加载配置
        const configResponse = await fetch('js/second-layer-config-final-v3.json');
        if (!configResponse.ok) {
            throw new Error(`配置加载失败: ${configResponse.status}`);
        }
        
        const config = await configResponse.json();
        
        // 创建配置全局变量供引擎使用
        window.secondLayerConfig = config;
        
        // 加载引擎模块
        const module = await import('./second-layer-engine-browser.js');
        secondLayerEngine = new module.default();
        
        console.log('第二层结果引擎加载成功');
        return secondLayerEngine;
        
    } catch (error) {
        console.error('第二层结果引擎加载失败:', error);
        return null;
    }
}

// 获取引擎实例
function getSecondLayerEngine() {
    if (!secondLayerEngine) {
        console.warn('第二层结果引擎未初始化，请先调用loadSecondLayerEngine()');
    }
    return secondLayerEngine;
}

// 生成真实结果
function generateRealResult(inputData) {
    const engine = getSecondLayerEngine();
    if (!engine) {
        return {
            error: true,
            message: '引擎未加载',
            fallback: '系统正在维护，请稍后重试'
        };
    }
    
    try {
        // 验证输入数据
        const validation = engine.validateInputData(inputData);
        if (!validation.isValid) {
            return {
                error: true,
                message: '输入数据验证失败',
                errors: validation.errors,
                fallback: '请检查输入数据格式'
            };
        }
        
        // 确定主模板
        const templateResult = engine.determineMainTemplate(inputData);
        
        // 生成第二层结果
        const result = engine.generateSecondLayerResult(inputData, templateResult);
        
        return {
            error: false,
            result: result,
            templateMatch: templateResult
        };
        
    } catch (error) {
        console.error('生成结果失败:', error);
        return {
            error: true,
            message: '结果生成失败',
            errorDetails: error.message,
            fallback: '系统处理出错，请联系管理员'
        };
    }
}

// 导出到全局
window.loadSecondLayerEngine = loadSecondLayerEngine;
window.getSecondLayerEngine = getSecondLayerEngine;
window.generateRealResult = generateRealResult;