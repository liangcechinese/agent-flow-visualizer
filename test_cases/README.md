# 测试用例说明 / Test Cases Documentation

本文件夹包含了多种场景的Agent执行日志测试用例，专门用于测试Agent Flow Visualizer的文字自动换行功能和可视化效果。

## 长文本测试用例 / Long Text Test Cases

以下测试用例包含详细的长文本内容，用于验证文字自动换行功能：

### 1. data_analysis_long_text.log
- **场景**: 数据分析系统
- **特点**: 包含复杂的数据处理流程描述
- **节点类型**: START, THINKING, ACTION, RESULT, DECISION, ERROR, END
- **文本特点**: 中文长句，包含技术术语和数据指标

### 2. ai_model_training_verbose.log
- **场景**: AI模型训练
- **特点**: 详细的模型训练过程和参数调优
- **节点类型**: START, THINKING, ACTION, RESULT, DECISION, TOOL, ERROR, END
- **文本特点**: 技术性强，包含大量AI/ML专业术语

### 3. software_development_lifecycle.log
- **场景**: 软件开发生命周期
- **特点**: 完整的软件项目开发流程
- **节点类型**: START, THINKING, ACTION, RESULT, DECISION, TOOL, ERROR, END
- **文本特点**: 项目管理和技术开发相关的长描述

### 4. cybersecurity_incident_response.log
- **场景**: 网络安全事件响应
- **特点**: 安全事件的检测、分析和处理流程
- **节点类型**: START, THINKING, ACTION, RESULT, DECISION, TOOL, ERROR, END
- **文本特点**: 安全专业术语，应急响应流程描述

### 5. medical_diagnosis_ai_system.log
- **场景**: 医疗诊断AI系统
- **特点**: 医疗影像分析和诊断建议生成
- **节点类型**: START, THINKING, ACTION, RESULT, DECISION, TOOL, ERROR, END
- **文本特点**: 医学术语，诊断流程和临床决策

### 6. financial_risk_management.log
- **场景**: 金融风险管理
- **特点**: 投资组合风险评估和优化
- **节点类型**: START, THINKING, ACTION, RESULT, DECISION, TOOL, ERROR, END
- **文本特点**: 金融术语，风险分析和投资策略

### 7. multilingual_ai_assistant.log
- **场景**: 多语言AI助手
- **特点**: 中英文混合内容，测试多语言文本换行
- **节点类型**: START, THINKING, ACTION, RESULT, DECISION, TOOL, ERROR, END
- **文本特点**: 中英文混合，技术术语双语对照

## 原有测试用例 / Original Test Cases

### 8. autogen_collaboration.log
- **场景**: AutoGen多智能体协作
- **特点**: 大型测试文件，包含复杂的多智能体交互

### 9. langchain_research.log
- **场景**: LangChain研究任务
- **特点**: 研究和分析流程

### 10. complex_agent_flow.log
- **场景**: 复杂Agent流程
- **特点**: 多步骤复杂决策流程

### 11. performance_monitoring.log
- **场景**: 性能监控
- **特点**: 系统性能分析和优化

## 使用方法 / Usage

1. **文件上传测试**: 在前端界面选择"文件上传"标签，上传任意.log文件
2. **文本输入测试**: 在前端界面选择"文本输入"标签，复制粘贴文件内容
3. **换行效果验证**: 查看生成的流程图中节点文字是否正确换行显示
4. **不同节点类型测试**: 观察不同形状节点（矩形、菱形、八角形等）的文字换行效果

## 测试重点 / Testing Focus

- ✅ 长文本自动换行，无省略号截断
- ✅ 不同节点类型的文字适配
- ✅ 中英文混合文本的换行处理
- ✅ 节点大小自动调整
- ✅ 文字居中对齐和可读性
- ✅ 布局优化和节点间距

## 预期效果 / Expected Results

- 所有文本内容完整显示，不出现"..."省略号
- 文字在节点内智能换行，保持良好的可读性
- 节点大小根据文本内容自动调整
- 不同语言和字符类型正确处理
- 整体布局美观，节点间距合理 