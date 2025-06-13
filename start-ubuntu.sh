#!/bin/bash

# Agent执行流可视化工具 - Ubuntu启动脚本
# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# PID文件位置
PID_DIR="$SCRIPT_DIR/.pids"
BACKEND_PID_FILE="$PID_DIR/backend.pid"
FRONTEND_PID_FILE="$PID_DIR/frontend.pid"

# 日志文件位置
LOG_DIR="$SCRIPT_DIR/logs"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

# 创建必要的目录
mkdir -p "$PID_DIR" "$LOG_DIR"

echo -e "${GREEN}🚀 Agent执行流可视化工具 - Ubuntu启动脚本${NC}"
echo "================================================"

# 检查依赖函数
check_dependency() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ 错误: $1 未安装${NC}"
        echo -e "${YELLOW}请运行: $2${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ $1 已安装${NC}"
    return 0
}

# 停止已运行的服务
stop_services() {
    echo -e "\n${YELLOW}正在停止已运行的服务...${NC}"
    
    # 停止后端服务
    if [ -f "$BACKEND_PID_FILE" ]; then
        PID=$(cat "$BACKEND_PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            kill $PID
            echo -e "${GREEN}✓ 后端服务已停止 (PID: $PID)${NC}"
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    
    # 停止前端服务
    if [ -f "$FRONTEND_PID_FILE" ]; then
        PID=$(cat "$FRONTEND_PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            kill $PID
            echo -e "${GREEN}✓ 前端服务已停止 (PID: $PID)${NC}"
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi
    
    # 额外检查并终止占用端口的进程
    for port in 8765 3456; do
        PID=$(lsof -ti:$port 2>/dev/null)
        if [ ! -z "$PID" ]; then
            kill $PID 2>/dev/null
            echo -e "${GREEN}✓ 释放端口 $port${NC}"
        fi
    done
}

# 检查端口是否被占用
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}❌ 端口 $1 已被占用${NC}"
        return 1
    fi
    return 0
}

# 启动后端服务
start_backend() {
    echo -e "\n${YELLOW}启动后端服务...${NC}"
    
    # 检查端口
    if ! check_port 8765; then
        echo -e "${YELLOW}尝试释放端口 8765...${NC}"
        lsof -ti:8765 | xargs kill -9 2>/dev/null
        sleep 2
    fi
    
    cd "$BACKEND_DIR"
    
    # 检查虚拟环境
    if [ -d ".venv" ]; then
        echo -e "${GREEN}✓ 找到虚拟环境${NC}"
    else
        echo -e "${YELLOW}创建虚拟环境...${NC}"
        python3 -m venv .venv
    fi
    
    # 激活虚拟环境并启动服务
    (
        source .venv/bin/activate
        
        # 如果使用uv
        if command -v uv &> /dev/null; then
            echo -e "${GREEN}使用 uv 启动后端...${NC}"
            nohup uv run python main.py > "$BACKEND_LOG" 2>&1 &
        else
            # 检查依赖
            if [ ! -d ".venv/lib/python*/site-packages/fastapi" ]; then
                echo -e "${YELLOW}安装后端依赖...${NC}"
                pip install -r requirements.txt 2>/dev/null || pip install fastapi uvicorn pydantic python-multipart requests
            fi
            echo -e "${GREEN}使用 Python 启动后端...${NC}"
            nohup python main.py > "$BACKEND_LOG" 2>&1 &
        fi
        
        echo $! > "$BACKEND_PID_FILE"
    )
    
    echo -e "${GREEN}✓ 后端服务已启动 (PID: $(cat $BACKEND_PID_FILE))${NC}"
    echo -e "  日志文件: $BACKEND_LOG"
}

# 启动前端服务
start_frontend() {
    echo -e "\n${YELLOW}启动前端服务...${NC}"
    
    # 检查端口
    if ! check_port 3456; then
        echo -e "${YELLOW}尝试释放端口 3456...${NC}"
        lsof -ti:3456 | xargs kill -9 2>/dev/null
        sleep 2
    fi
    
    cd "$FRONTEND_DIR"
    
    # 检查node_modules
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}安装前端依赖...${NC}"
        npm install
    fi
    
    # 设置环境变量，禁用自动打开浏览器
    export BROWSER=none
    
    # 启动前端
    nohup npm start > "$FRONTEND_LOG" 2>&1 &
    echo $! > "$FRONTEND_PID_FILE"
    
    echo -e "${GREEN}✓ 前端服务已启动 (PID: $(cat $FRONTEND_PID_FILE))${NC}"
    echo -e "  日志文件: $FRONTEND_LOG"
}

# 检查服务状态
check_services() {
    echo -e "\n${YELLOW}检查服务状态...${NC}"
    
    # 等待服务启动
    sleep 5
    
    # 检查后端
    if curl -s http://localhost:8765/ > /dev/null; then
        echo -e "${GREEN}✓ 后端API运行正常${NC}"
    else
        echo -e "${RED}❌ 后端API无响应${NC}"
        echo -e "${YELLOW}查看日志: tail -f $BACKEND_LOG${NC}"
    fi
    
    # 检查前端
    sleep 5
    if curl -s http://localhost:3456/ > /dev/null; then
        echo -e "${GREEN}✓ 前端界面运行正常${NC}"
    else
        echo -e "${YELLOW}⏳ 前端正在启动中...${NC}"
    fi
}

# 显示使用说明
show_usage() {
    echo -e "\n${GREEN}═══════════════════════════════════════════${NC}"
    echo -e "${GREEN}🎉 服务启动完成！${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
    echo -e "📡 后端API地址: ${YELLOW}http://localhost:8765${NC}"
    echo -e "🌐 前端界面地址: ${YELLOW}http://localhost:3456${NC}"
    echo -e "📚 API文档地址: ${YELLOW}http://localhost:8765/docs${NC}"
    echo -e "\n${YELLOW}管理命令:${NC}"
    echo -e "  查看后端日志: ${GREEN}tail -f $BACKEND_LOG${NC}"
    echo -e "  查看前端日志: ${GREEN}tail -f $FRONTEND_LOG${NC}"
    echo -e "  停止所有服务: ${GREEN}$0 stop${NC}"
    echo -e "  查看服务状态: ${GREEN}$0 status${NC}"
    echo -e "  重启所有服务: ${GREEN}$0 restart${NC}"
}

# 显示服务状态
show_status() {
    echo -e "\n${YELLOW}服务状态:${NC}"
    
    # 检查后端
    if [ -f "$BACKEND_PID_FILE" ] && ps -p $(cat "$BACKEND_PID_FILE") > /dev/null 2>&1; then
        echo -e "后端服务: ${GREEN}运行中${NC} (PID: $(cat $BACKEND_PID_FILE))"
    else
        echo -e "后端服务: ${RED}未运行${NC}"
    fi
    
    # 检查前端
    if [ -f "$FRONTEND_PID_FILE" ] && ps -p $(cat "$FRONTEND_PID_FILE") > /dev/null 2>&1; then
        echo -e "前端服务: ${GREEN}运行中${NC} (PID: $(cat $FRONTEND_PID_FILE))"
    else
        echo -e "前端服务: ${RED}未运行${NC}"
    fi
    
    # 检查端口
    echo -e "\n${YELLOW}端口状态:${NC}"
    for port in 8765 3456; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "端口 $port: ${GREEN}已占用${NC}"
        else
            echo -e "端口 $port: ${YELLOW}空闲${NC}"
        fi
    done
}

# 主函数
main() {
    case "${1:-start}" in
        start)
            echo -e "\n${YELLOW}检查系统依赖...${NC}"
            
            # 检查必要的依赖
            all_deps_ok=true
            check_dependency "python3" "sudo apt-get install python3" || all_deps_ok=false
            check_dependency "pip3" "sudo apt-get install python3-pip" || all_deps_ok=false
            check_dependency "node" "sudo apt-get install nodejs" || all_deps_ok=false
            check_dependency "npm" "sudo apt-get install npm" || all_deps_ok=false
            
            # 检查可选依赖
            if ! command -v uv &> /dev/null; then
                echo -e "${YELLOW}提示: uv 未安装，将使用 pip 管理Python依赖${NC}"
                echo -e "${YELLOW}安装 uv: curl -LsSf https://astral.sh/uv/install.sh | sh${NC}"
            fi
            
            if [ "$all_deps_ok" = false ]; then
                echo -e "\n${RED}请先安装缺少的依赖${NC}"
                exit 1
            fi
            
            # 停止已有服务
            stop_services
            
            # 启动服务
            start_backend
            start_frontend
            
            # 检查服务
            check_services
            
            # 显示使用说明
            show_usage
            ;;
            
        stop)
            stop_services
            echo -e "\n${GREEN}✓ 所有服务已停止${NC}"
            ;;
            
        restart)
            echo -e "${YELLOW}重启服务...${NC}"
            stop_services
            sleep 2
            $0 start
            ;;
            
        status)
            show_status
            ;;
            
        logs)
            echo -e "${YELLOW}显示最新日志...${NC}"
            echo -e "\n${GREEN}=== 后端日志 ===${NC}"
            tail -n 20 "$BACKEND_LOG" 2>/dev/null || echo "暂无日志"
            echo -e "\n${GREEN}=== 前端日志 ===${NC}"
            tail -n 20 "$FRONTEND_LOG" 2>/dev/null || echo "暂无日志"
            ;;
            
        *)
            echo "用法: $0 {start|stop|restart|status|logs}"
            exit 1
            ;;
    esac
}

# 捕获 Ctrl+C
trap 'echo -e "\n${YELLOW}正在停止服务...${NC}"; stop_services; exit' INT

# 执行主函数
main "$@" 