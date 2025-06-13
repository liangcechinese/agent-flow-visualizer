#!/bin/bash

# Agent执行流可视化工具 - Ubuntu安装脚本
# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    Agent执行流可视化工具 - Ubuntu 安装程序${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"

# 检查是否为root或使用sudo
if [ "$EUID" -ne 0 ] && [ -z "$SUDO_USER" ]; then 
    echo -e "${YELLOW}此脚本需要管理员权限来安装系统依赖${NC}"
    echo -e "${YELLOW}请使用: sudo $0${NC}"
    exit 1
fi

# 更新系统包列表
echo -e "${YELLOW}更新系统包列表...${NC}"
apt-get update

# 安装基础依赖
echo -e "\n${YELLOW}安装基础依赖...${NC}"

# Python相关
echo -e "${GREEN}安装 Python 3 和 pip...${NC}"
apt-get install -y python3 python3-pip python3-venv

# Node.js和npm（使用NodeSource仓库获取最新版本）
echo -e "${GREEN}安装 Node.js 和 npm...${NC}"
# 检查是否已安装较新版本的Node.js
NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 16 ]; then
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
    apt-get install -y nodejs
else
    echo -e "${GREEN}Node.js 已安装 (版本 $NODE_VERSION)${NC}"
fi

# 其他工具
echo -e "${GREEN}安装其他必要工具...${NC}"
apt-get install -y curl git build-essential lsof

# 可选：安装uv（Python包管理器）
echo -e "\n${YELLOW}是否安装 uv (更快的Python包管理器)? [y/N]${NC}"
read -r install_uv
if [[ "$install_uv" =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}安装 uv...${NC}"
    curl -LsSf https://astral.sh/uv/install.sh | sh
    echo -e "${GREEN}请运行 'source $HOME/.cargo/env' 来激活 uv${NC}"
fi

# 创建快捷命令
echo -e "\n${YELLOW}创建系统快捷命令...${NC}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 创建软链接
ln -sf "$SCRIPT_DIR/start-ubuntu.sh" /usr/local/bin/agent-flow-viz

echo -e "${GREEN}✓ 快捷命令已创建${NC}"
echo -e "  您可以在任何地方使用 ${YELLOW}agent-flow-viz${NC} 命令来管理服务"

# 检查Python版本
PYTHON_VERSION=$(python3 -V 2>&1 | grep -Po '(?<=Python )(.+)')
echo -e "\n${GREEN}Python 版本: $PYTHON_VERSION${NC}"

# 检查Node版本
NODE_VERSION=$(node -v 2>&1)
NPM_VERSION=$(npm -v 2>&1)
echo -e "${GREEN}Node.js 版本: $NODE_VERSION${NC}"
echo -e "${GREEN}npm 版本: $NPM_VERSION${NC}"

# 设置权限
echo -e "\n${YELLOW}设置脚本权限...${NC}"
chmod +x "$SCRIPT_DIR/start-ubuntu.sh"
chmod +x "$SCRIPT_DIR/install-ubuntu.sh"

# 完成安装
echo -e "\n${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ 安装完成！${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}下一步操作：${NC}"
echo -e "1. 启动服务: ${GREEN}./start-ubuntu.sh${NC}"
echo -e "   或使用快捷命令: ${GREEN}agent-flow-viz start${NC}"
echo -e "\n2. 可用的命令:${NC}"
echo -e "   - ${GREEN}agent-flow-viz start${NC}   # 启动所有服务"
echo -e "   - ${GREEN}agent-flow-viz stop${NC}    # 停止所有服务"
echo -e "   - ${GREEN}agent-flow-viz restart${NC} # 重启所有服务"
echo -e "   - ${GREEN}agent-flow-viz status${NC}  # 查看服务状态"
echo -e "   - ${GREEN}agent-flow-viz logs${NC}    # 查看服务日志"

# 如果是通过sudo运行的，提醒用户
if [ ! -z "$SUDO_USER" ]; then
    echo -e "\n${YELLOW}注意：${NC}"
    echo -e "由于使用了sudo安装，启动服务时请使用普通用户权限："
    echo -e "${GREEN}su - $SUDO_USER -c '$SCRIPT_DIR/start-ubuntu.sh'${NC}"
fi 