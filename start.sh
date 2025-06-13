#!/bin/bash

echo "🚀 启动Agent执行流可视化工具..."

# 启动后端服务
echo "📦 启动后端服务..."
cd backend
uv run python main.py &
BACKEND_PID=$!
echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"

# 等待后端启动
sleep 3

# 启动前端服务
echo "🎨 启动前端服务..."
cd ../frontend
npm start &
FRONTEND_PID=$!
echo "✅ 前端服务已启动 (PID: $FRONTEND_PID)"

echo ""
echo "🎉 服务启动完成！"
echo "📡 后端API地址: http://localhost:8000"
echo "🌐 前端界面地址: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait 