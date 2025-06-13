# Agent执行流可视化工具 - 使用演示

## 🚀 服务已启动

现在您可以访问以下地址：

- **Web界面**: http://localhost:3456
- **API文档**: http://localhost:8765/docs
- **健康检查**: http://localhost:8765

## 📊 测试结果总结

我们刚才运行的测试展示了以下功能：

### 1. 简单工作流解析
- 解析了8个节点的数据分析流程
- 自动识别START、ACTION、RESULT、END等节点类型

### 2. 错误处理流程
- 解析了10个节点，包含错误和恢复流程
- 正确识别ERROR节点并标记为红色

### 3. LangChain日志
- 成功识别LangChain框架格式
- 解析了16个节点的研究任务流程
- 支持Thought、Action、Observation模式

### 4. 复杂决策流
- 成功处理30个节点的复杂流程
- 包含多层决策、错误处理和性能优化步骤

## 🎯 快速上手

### 方式一：使用Web界面

1. 打开浏览器访问 http://localhost:3456
2. 选择"上传日志文件"或"输入日志文本"
3. 上传测试文件或粘贴日志内容
4. 点击"解析日志"查看可视化结果

### 方式二：使用测试案例

1. 点击"加载示例日志"按钮
2. 或上传 `test_cases/` 目录中的任一文件：
   - `complex_agent_flow.log` - 复杂性能优化流程
   - `langchain_research.log` - 量子计算研究
   - `autogen_collaboration.log` - 多智能体协作
   - `performance_monitoring.log` - 性能监控流程

### 方式三：使用API

```bash
# 解析文本
curl -X POST "http://localhost:8765/parse-text" \
  -G --data-urlencode "text=[START] 你的日志内容..."

# 上传文件
curl -X POST "http://localhost:8765/parse-log" \
  -F "file=@your_log_file.log"
```

## 🎨 可视化特性

- **节点颜色**：不同类型节点用不同颜色区分
- **交互式**：点击节点查看详细信息
- **自动布局**：流程图自动优化布局
- **缩放拖拽**：支持缩放和拖拽查看

## 💡 高级功能

1. **框架自动检测**：自动识别LangChain、AutoGen、CrewAI等框架
2. **性能指标**：显示执行时间、内存使用等指标
3. **错误追踪**：突出显示错误节点和错误路径
4. **时间线视图**：支持带时间戳的日志

## 🛠️ 故障排除

如果遇到问题：

```bash
# 查看服务状态
./start-ubuntu.sh status

# 查看日志
tail -f logs/backend.log
tail -f logs/frontend.log

# 重启服务
./start-ubuntu.sh restart
```

## 📝 自定义日志格式

支持的日志格式示例：

```
[START] 任务开始
[THINKING] 分析问题
[ACTION] tool_name: 执行动作
[RESULT] 执行结果
[ERROR] 错误信息
[END] 任务结束
```

现在就去 http://localhost:3456 体验吧！ 