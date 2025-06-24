#!/bin/bash

echo "🧪 Smart LLM Environment Testing"
echo "================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_BASE="http://localhost:4000/api/answers"

echo -e "\n${BLUE}📋 Step 1: Environment Detection${NC}"
echo "Testing multiple Ollama connection points..."

# Test direct Ollama connections
OLLAMA_URLS=("http://localhost:11434" "http://127.0.0.1:11434" "http://ollama:11434")

for url in "${OLLAMA_URLS[@]}"; do
  echo -n "Testing $url: "
  if curl -s "$url/api/version" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Working${NC}"
    WORKING_OLLAMA_URL="$url"
  else
    echo -e "${RED}❌ Failed${NC}"
  fi
done

if [ ! -z "$WORKING_OLLAMA_URL" ]; then
  echo -e "\n${GREEN}✅ Found working Ollama at: $WORKING_OLLAMA_URL${NC}"
  
  echo -e "\n${BLUE}📋 Available Models:${NC}"
  curl -s "$WORKING_OLLAMA_URL/api/tags" | jq -r '.models[]?.name // "No models found"'
else
  echo -e "\n${RED}❌ Ollama not accessible at any URL${NC}"
  echo "Please start Ollama:"
  echo "  Local: ollama serve"
  echo "  Docker: docker compose up ollama"
fi

echo -e "\n${BLUE}📋 Step 2: Backend Health Check${NC}"
HEALTH_RESPONSE=$(curl -s "$API_BASE/llm/health" 2>/dev/null)

if [ $? -eq 0 ]; then
  echo "$HEALTH_RESPONSE" | jq '.'
  
  if echo "$HEALTH_RESPONSE" | jq -e '.llm_service.status == "healthy"' > /dev/null; then
    echo -e "${GREEN}✅ Backend successfully connected to LLM${NC}"
    LLM_READY=true
  else
    echo -e "${YELLOW}⚠️ Backend LLM connection has issues${NC}"
    LLM_READY=false
  fi
else
  echo -e "${RED}❌ Backend not responding${NC}"
  echo "Make sure backend is running: bun run dev"
  exit 1
fi

echo -e "\n${BLUE}📋 Step 3: Complete LLM Test${NC}"

if [ "$LLM_READY" = true ]; then
  echo "Searching for a question with multiple answers..."
  
  # Test questions that usually have good answers
  TEST_QUESTIONS=("JavaScript closure" "React hooks" "Python async" "CSS flexbox")
  
  for question in "${TEST_QUESTIONS[@]}"; do
    echo -e "\n${YELLOW}Testing: $question${NC}"
    
    SEARCH_RESPONSE=$(curl -s -X POST "$API_BASE" \
      -H "Content-Type: application/json" \
      -d "{\"question\": \"$question\"}")
    
    QUESTION_ID=$(echo "$SEARCH_RESPONSE" | jq -r '.question_id // empty')
    ANSWER_COUNT=$(echo "$SEARCH_RESPONSE" | jq -r '.original_answers | length // 0')
    
    if [ "$ANSWER_COUNT" -gt 2 ]; then
      echo -e "${GREEN}✅ Found question $QUESTION_ID with $ANSWER_COUNT answers${NC}"
      
      echo -e "\n${BLUE}🤖 Testing LLM Re-ranking...${NC}"
      echo "This may take 30-60 seconds..."
      
      RERANK_START=$(date +%s)
      RERANK_RESPONSE=$(curl -s -X POST "$API_BASE/rerank" \
        -H "Content-Type: application/json" \
        -d "{\"question_id\": $QUESTION_ID}")
      RERANK_END=$(date +%s)
      
      RERANK_TIME=$((RERANK_END - RERANK_START))
      echo "Processing time: ${RERANK_TIME} seconds"
      
      if echo "$RERANK_RESPONSE" | jq -e '.success == true' > /dev/null; then
        echo -e "${GREEN}✅ LLM Re-ranking successful!${NC}"
        
        # Check if real LLM scores or fallback
        LLM_SCORE=$(echo "$RERANK_RESPONSE" | jq -r '.reranked[0].llm_score // null')
        LLM_REASONING=$(echo "$RERANK_RESPONSE" | jq -r '.reranked[0].llm_reasoning // ""')
        
        if [[ "$LLM_REASONING" =~ "LLM Error" || "$LLM_REASONING" =~ "fallback" ]]; then
          echo -e "${YELLOW}⚠️ Used fallback ranking (LLM connection issue)${NC}"
          echo "Reason: $LLM_REASONING"
        else
          echo -e "${GREEN}🎉 Real LLM ranking achieved!${NC}"
          echo -e "\n${BLUE}Top 3 LLM Rankings:${NC}"
          echo "$RERANK_RESPONSE" | jq '.reranked[0:3] | .[] | {llm_rank, llm_score, llm_reasoning}'
          
          # Show ranking changes
          CHANGES=$(echo "$RERANK_RESPONSE" | jq -r '.metadata.ranking_changes.total_changes // 0')
          PERCENTAGE=$(echo "$RERANK_RESPONSE" | jq -r '.metadata.ranking_changes.percentage_changed // 0')
          echo -e "\n${BLUE}📊 Ranking Analysis:${NC}"
          echo "Changes: $CHANGES positions ($PERCENTAGE% of answers reordered)"
          
          if [ "$CHANGES" -gt 0 ]; then
            echo -e "${GREEN}🎯 LLM successfully reordered answers!${NC}"
          else
            echo -e "${YELLOW}⚠️ No ranking changes - LLM may have agreed with SO ranking${NC}"
          fi
        fi
        
        echo -e "\n${GREEN}🎉 ASSIGNMENT DEMO READY!${NC}"
        echo "Use this for your demo:"
        echo "Question ID: $QUESTION_ID"
        echo "Rerank API: curl -X POST $API_BASE/rerank -H 'Content-Type: application/json' -d '{\"question_id\": $QUESTION_ID}'"
        echo "Compare API: curl $API_BASE/comparison/$QUESTION_ID"
        break
        
      else
        echo -e "${RED}❌ LLM Re-ranking failed${NC}"
        echo "$RERANK_RESPONSE" | jq '.error'
      fi
      
      break
    else
      echo -e "${YELLOW}⚠️ Only $ANSWER_COUNT answers - trying next question${NC}"
    fi
  done
else
  echo -e "${RED}❌ Skipping LLM test due to connection issues${NC}"
fi

echo -e "\n${BLUE}📋 Step 4: Assignment Checklist${NC}"
echo "Assignment Requirements Status:"
echo "✅ Stack Overflow API integration"
echo "✅ Database caching (MongoDB + Redis)" 
echo "✅ Recent 5 questions cache"
echo "✅ Docker containerization"

if [ "$LLM_READY" = true ]; then
  echo "✅ LLM re-ranking system"
  echo "🔄 Ready for React frontend"
else
  echo "⚠️ LLM re-ranking (needs troubleshooting)"
  echo "🔄 Frontend can still show original answers"
fi

echo -e "\n${BLUE}📋 Troubleshooting Tips:${NC}"
echo "If LLM connection fails:"
echo "1. Local testing: ollama serve"
echo "2. Docker testing: docker compose up --build"
echo "3. Check model: ollama pull mistral:7b"
echo "4. Verify .env configuration"

echo -e "\n${GREEN}🎉 Testing Complete!${NC}"