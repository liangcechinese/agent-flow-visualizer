#!/bin/bash

# Agent执行流可视化工具 - 测试脚本
echo "🧪 测试Agent执行流可视化工具"
echo "================================"

# API地址
API_URL="http://localhost:8765"

# 检查后端服务是否运行
echo -n "检查后端服务... "
if curl -s $API_URL/ > /dev/null 2>&1; then
    echo "✅ 运行中"
else
    echo "❌ 未运行"
    echo "请先运行: ./start-ubuntu.sh"
    exit 1
fi

# 测试不同的日志格式
echo -e "\n📝 测试日志解析功能："

# 1. 测试简单日志
echo -e "\n1. 测试简单工作流日志"
curl -s -X POST "$API_URL/parse-text" \
  -G --data-urlencode "text=[START] 开始数据分析任务
[ACTION] load_data: 加载用户数据
[RESULT] 成功加载10000条记录
[ACTION] clean_data: 清洗数据
[RESULT] 移除了500条无效记录
[ACTION] analyze_patterns: 分析用户行为模式
[RESULT] 发现3个主要用户群体
[END] 分析完成" | jq '.metadata'

# 2. 测试包含错误的日志
echo -e "\n2. 测试错误处理流程"
curl -s -X POST "$API_URL/parse-text" \
  -G --data-urlencode "text=[START] 部署新版本
[ACTION] run_tests: 运行测试套件
[RESULT] 测试通过率: 98%
[ACTION] deploy_staging: 部署到预发布环境
[ERROR] 部署失败: 磁盘空间不足
[ACTION] cleanup_disk: 清理磁盘空间
[RESULT] 释放了50GB空间
[ACTION] retry_deploy: 重试部署
[RESULT] 部署成功
[END] 版本发布完成" | jq '.metadata'

# 3. 测试LangChain格式
echo -e "\n3. 测试LangChain格式日志"
if [ -f "test_cases/langchain_research.log" ]; then
    curl -s -X POST "$API_URL/parse-text" \
      -G --data-urlencode "text@test_cases/langchain_research.log" | \
      jq '{nodes: .nodes | length, edges: .edges | length, framework: .metadata.detected_framework}'
fi

# 4. 测试复杂工作流
echo -e "\n4. 测试复杂决策流程"
if [ -f "test_cases/complex_agent_flow.log" ]; then
    echo "解析复杂Agent流（30个节点）..."
    RESULT=$(curl -s -X POST "$API_URL/parse-text" \
      -G --data-urlencode "text@test_cases/complex_agent_flow.log")
    
    echo "节点数: $(echo $RESULT | jq '.nodes | length')"
    echo "边数: $(echo $RESULT | jq '.edges | length')"
    echo "检测框架: $(echo $RESULT | jq -r '.metadata.detected_framework')"
    
    # 显示前3个节点
    echo -e "\n前3个节点:"
    echo $RESULT | jq '.nodes[:3] | .[] | {id, type, label}'
fi

echo -e "\n✅ 测试完成！"
echo -e "\n💡 提示："
echo "- 访问 http://localhost:3456 查看可视化界面"
echo "- 访问 http://localhost:8765/docs 查看API文档"
echo "- 可以上传自己的日志文件进行测试" 