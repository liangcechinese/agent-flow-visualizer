# Agent执行流可视化工具

## 项目介绍

这是一款专为解决AI Agent评测过程中追踪复杂决策链效率低下问题而开发的可视化工具。该工具能够自动解析Agent执行日志，并将其转换为直观的流程图，帮助开发者快速理解和调试Agent的执行过程。

### 🎯 解决的核心问题

- **复杂决策链追踪困难**：Agent执行过程往往包含多层嵌套的决策和动作，纯文本日志难以快速理解
- **调试效率低下**：在长达数千行的日志中定位问题需要耗费大量时间
- **框架差异大**：不同Agent框架（LangChain、AutoGen、CrewAI等）的日志格式各异，缺乏统一的分析工具

## 核心功能

- 🔍 **智能日志解析**：支持多种Agent框架（LangChain、AutoGen、CrewAI等）的日志格式
- 🌳 **层级流程可视化**：将复杂的嵌套执行链自动转换为可交互的树状流程图
- 🎨 **多布局切换**：支持Dagre、Cose-Bilkent等多种图布局算法，适应不同分析场景
- 🏷️ **节点类型识别**：自动识别不同类型的执行节点（开始、动作、决策、结果、错误等）
- 📊 **交互式探索**：点击节点查看详细信息，支持缩放、拖拽和多种布局切换
- 📁 **多种输入方式**：支持文件上传和文本粘贴

## 技术栈

- **后端**：Python + FastAPI (运行在端口 8765)
- **前端**：React + TypeScript + Cytoscape.js (运行在端口 3456)
- **UI框架**：Ant Design
- **包管理**：uv (Python) + npm (Node.js)
- **可视化引擎**：Cytoscape.js, with support for Dagre and Cose-Bilkent layouts

### 🔧 端口配置

- **后端API端口**：`8765` (默认8000已修改为避免冲突)
- **前端开发端口**：`3456` (默认3000已修改为避免冲突)
- **API文档**：`http://localhost:8765/docs`

## 快速开始

### 🚀 Ubuntu/Linux 一键启动

```bash
# 安装依赖（仅首次需要）
sudo ./install-ubuntu.sh

# 启动所有服务
./start-ubuntu.sh

# 服务将在以下地址运行：
# - 前端界面：http://localhost:3456
# - 后端API：http://localhost:8765
# - API文档：http://localhost:8765/docs
```

## 详细安装步骤

### 后端服务

1. 进入后端目录：
```bash
cd agent-flow-visualizer/backend
```

2. 安装依赖（使用uv）：
```bash
uv sync
```

3. 启动后端服务：
```bash
uv run python main.py
```

后端服务将在 http://localhost:8765 启动

### 前端应用

1. 进入前端目录：
```bash
cd agent-flow-visualizer/frontend
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm start
```

前端应用将在 http://localhost:3456 启动

## 使用说明

1. **上传日志文件**：
   - 点击"选择日志文件"按钮
   - 选择.txt或.log格式的Agent日志文件
   - 系统会自动解析并生成流程图

2. **输入日志文本**：
   - 切换到"输入日志文本"标签
   - 可以点击"加载示例日志"查看示例
   - 粘贴您的Agent日志内容
   - 点击"解析日志"按钮

3. **查看流程图**：
   - 流程图会自动进行层级布局显示
   - 可以使用控制面板中的下拉菜单切换不同的图表布局（如Dagre、Cose-Bilkent）
   - 不同类型的节点用不同颜色和形状表示
   - 点击节点可查看详细信息
   - 支持缩放和拖拽操作

## 支持的日志格式

### 通用格式
```
[START] 任务开始
[ACTION] 执行动作
[RESULT] 执行结果
[ERROR] 错误信息
[END] 任务结束
```

### LangChain格式
```
> Entering new chain...
Thought: 思考过程
Action: tool_name[参数]
Observation: 观察结果
> Finished chain.
```

### AutoGen格式
```
Agent1 (to Agent2):
消息内容
EXECUTING CODE BLOCK:
代码内容
exitcode: 0
```

## 🎨 节点类型说明

流程图中的节点使用不同的颜色和形状来表示不同类型的执行步骤：

| 图标 | 类型 | 形状 | 说明 |
|------|------|------|------|
| 🟢 | **开始节点** | 绿色椭圆 | 表示Agent任务的起始点 |
| 🔵 | **动作节点** | 蓝色矩形 | 表示具体的执行动作（如API调用、文件操作等） |
| 🟠 | **决策节点** | 橙色菱形 | 表示思考、分析或决策过程 |
| 🟣 | **结果节点** | 紫色矩形 | 表示动作的执行结果或输出 |
| 🔴 | **错误节点** | 红色八边形 | 表示执行中遇到的错误或异常 |
| 🔴 | **结束节点** | 红色椭圆 | 表示Agent任务的结束点 |
| 🔷 | **工具节点** | 青色六边形 | 表示调用外部工具或函数 |
| 📊 | **数据节点** | 棕色矩形 | 表示数据输入或输出 |
| ⚡ | **性能节点** | 青绿色椭圆 | 表示性能指标或监控数据 |

## API文档

后端API文档可通过 http://localhost:8765/docs 访问

## 🛠️ 故障排除

### 端口冲突问题
如果默认端口被占用，可以手动修改：
- 后端端口：编辑 `backend/main.py` 中的 `port=8765`
- 前端端口：编辑 `frontend/package.json` 中的 `PORT=3456`

### 服务管理命令
```bash
# 查看服务状态
./start-ubuntu.sh status

# 停止所有服务
./start-ubuntu.sh stop

# 重启服务
./start-ubuntu.sh restart

# 查看日志
./start-ubuntu.sh logs
```

### 常见问题
- **Q**: 前端编译错误怎么办？
  - **A**: 运行 `cd frontend && npm install` 重新安装依赖

- **Q**: 后端无法启动？
  - **A**: 检查Python版本是否≥3.8，运行 `cd backend && uv sync` 重新安装依赖

- **Q**: 日志解析不准确？
  - **A**: 确保日志格式符合支持的模式，可以参考 `test_cases/` 目录中的示例

## 注意事项

- 确保日志格式规范，以获得最佳解析效果
- 大型日志文件（>10MB）可能需要较长解析时间
- 建议使用Chrome或Firefox浏览器以获得最佳体验
- 端口已设置为非常用端口（8765/3456）以避免与其他服务冲突

## 📁 项目结构

```
agent-flow-visualizer/
├── backend/                    # 后端服务
│   ├── main.py               # FastAPI主应用
│   ├── log_patterns.py       # 日志模式配置
│   ├── requirements.txt      # Python依赖
│   └── test_api.py          # API测试脚本
├── frontend/                  # 前端应用
│   ├── src/
│   │   ├── App.tsx          # 主应用组件
│   │   ├── components/      # React组件
│   │   └── types/          # TypeScript类型定义
│   └── package.json        # Node依赖
├── test_cases/               # 测试用例
│   ├── complex_agent_flow.log
│   ├── langchain_research.log
│   ├── autogen_collaboration.log
│   └── performance_monitoring.log
├── logs/                     # 运行日志（自动生成）
├── start-ubuntu.sh          # Ubuntu启动脚本
├── install-ubuntu.sh        # 安装脚本
├── test-flow.sh            # 测试脚本
├── README.md               # 项目文档
├── UBUNTU_GUIDE.md         # Ubuntu使用指南
└── demo_usage.md           # 使用演示

```

## 🤝 贡献指南

欢迎贡献代码和建议！请遵循以下步骤：

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 开发建议

- 新增日志格式支持：编辑 `backend/log_patterns.py`
- 改进可视化效果：修改 `frontend/src/components/FlowVisualizer.tsx`
- 添加新的节点类型：更新 `NODE_TYPE_MAPPING` 和相应的样式

## 📄 许可证

本项目采用 MIT 许可证 - 查看 LICENSE 文件了解详情

## 🙏 致谢

- [Cytoscape.js](https://js.cytoscape.org/) - 强大的图形可视化库
- [FastAPI](https://fastapi.tiangolo.com/) - 现代化的Python Web框架
- [Ant Design](https://ant.design/) - 优秀的React UI组件库 