# Ubuntu 系统使用指南

## 快速开始

### 1. 安装系统依赖（仅首次需要）

```bash
# 需要管理员权限
sudo ./install-ubuntu.sh
```

这个脚本会自动安装：
- Python 3 和 pip
- Node.js 和 npm
- 其他必要工具（curl, git, build-essential, lsof）

### 2. 启动服务

```bash
# 方式一：使用启动脚本
./start-ubuntu.sh

# 方式二：如果已安装快捷命令
agent-flow-viz start
```

### 3. 访问应用

- 前端界面：http://localhost:3456
- 后端API：http://localhost:8765
- API文档：http://localhost:8765/docs

## 服务管理命令

### 启动服务
```bash
./start-ubuntu.sh start
# 或
agent-flow-viz start
```

### 停止服务
```bash
./start-ubuntu.sh stop
# 或
agent-flow-viz stop
```

### 重启服务
```bash
./start-ubuntu.sh restart
# 或
agent-flow-viz restart
```

### 查看服务状态
```bash
./start-ubuntu.sh status
# 或
agent-flow-viz status
```

### 查看日志
```bash
./start-ubuntu.sh logs
# 或
agent-flow-viz logs

# 实时查看后端日志
tail -f logs/backend.log

# 实时查看前端日志
tail -f logs/frontend.log
```

## 目录结构

```
agent-flow-visualizer/
├── backend/              # 后端服务
│   ├── .venv/          # Python虚拟环境（自动创建）
│   ├── main.py         # FastAPI应用
│   └── requirements.txt # Python依赖
├── frontend/            # 前端应用
│   ├── node_modules/   # npm包（自动安装）
│   └── src/           # React源代码
├── logs/               # 日志目录（自动创建）
│   ├── backend.log    # 后端日志
│   └── frontend.log   # 前端日志
├── .pids/             # PID文件（自动创建）
├── start-ubuntu.sh    # Ubuntu启动脚本
└── install-ubuntu.sh  # Ubuntu安装脚本
```

## 故障排除

### 1. 端口被占用

如果看到端口被占用的错误，脚本会自动尝试释放端口。如果仍有问题：

```bash
# 手动查找占用端口的进程
sudo lsof -i:8765
sudo lsof -i:3456

# 手动终止进程
sudo kill -9 <PID>
```

### 2. 权限问题

如果遇到权限错误：

```bash
# 确保脚本有执行权限
chmod +x start-ubuntu.sh
chmod +x install-ubuntu.sh
```

### 3. 依赖安装失败

如果npm或pip安装失败：

```bash
# 清理npm缓存
npm cache clean --force

# 使用国内镜像（如果在中国）
npm config set registry https://registry.npmmirror.com
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

### 4. 服务无法启动

检查日志文件以获取详细错误信息：

```bash
# 查看最新的错误日志
tail -n 50 logs/backend.log
tail -n 50 logs/frontend.log
```

## 性能优化建议

### 1. 使用 uv 加速 Python 包管理

```bash
# 安装 uv
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.cargo/env
```

### 2. 使用 PM2 管理进程（可选）

```bash
# 安装 PM2
sudo npm install -g pm2

# 使用 PM2 启动服务
pm2 start backend/main.py --name agent-backend --interpreter python3
pm2 start frontend/package.json --name agent-frontend
```

## 开发模式

如果您想修改代码并实时查看更改：

### 后端开发
```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8765
```

### 前端开发
```bash
cd frontend
npm start
```

## 生产部署建议

1. **使用反向代理**（如 Nginx）
2. **配置 HTTPS**
3. **使用进程管理器**（如 systemd 或 PM2）
4. **设置防火墙规则**
5. **定期备份日志**

## 常见问题

**Q: 如何更改默认端口？**
A: 编辑 `start-ubuntu.sh`，修改相应的端口号，并更新前端的 API 地址配置。

**Q: 如何添加新的日志格式支持？**
A: 编辑 `backend/log_patterns.py`，添加新的正则表达式模式。

**Q: 服务启动很慢怎么办？**
A: 首次启动需要安装依赖，之后会快很多。可以查看日志了解进度。

**Q: 如何卸载？**
A: 运行 `./start-ubuntu.sh stop` 停止服务，然后删除整个目录即可。 