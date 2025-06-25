# 🚀 Stack Overflow Clone with AI Reranking

A full-stack application that lets you ask programming questions and get answers from Stack Overflow, but with a twist - an AI reranks the answers based on technical quality instead of just popularity!

## 🎯 What Does This Do?

- **Ask any programming question** (like "how to reverse a string in JavaScript")
- **Get real answers** from Stack Overflow API
- **See two different rankings**:
  - 📊 **Original**: Sorted by votes (popularity)
  - 🤖 **AI Reranked**: Sorted by technical accuracy and quality
- **Compare them side by side** using simple tab buttons
- **Caches your last 5 questions** so they load super fast

Perfect for when you want to find the *best* answer, not just the *most popular* one!

## 🛠️ What's Inside?

- **Frontend**: React app with simple, clean interface
- **Backend**: Node.js API that talks to Stack Overflow
- **AI Brain**: Local LLM (Ollama with Mistral) that reranks answers
- **Database**: MongoDB to store questions and answers
- **Cache**: Redis for lightning-fast repeat searches
- **Everything runs in Docker** - no complex setup needed!

## 🏃‍♂️ Quick Start (5 Minutes)

### Step 1: Get the Code
```bash
git clone <https://github.com/hrusikesh8280/Stackoverflow-demo>
cd stackoverflow-clone
```

### Step 2: Start Everything with Docker
```bash
docker-compose up --build
```

That's it! Docker will automatically:
- Download and start MongoDB
- Download and start Redis  
- Download and start Ollama (the AI)
- Build and start the backend
- Build and start the frontend

### Step 3: Wait a Moment
The first time takes 2-3 minutes because Docker needs to:
- Download the AI model (Mistral 7B - about 4GB)
- Install all dependencies
- Build everything

You'll see lots of logs - that's normal! Look for these success messages:
```
✅ Backend API on :4000
✅ Frontend on :5173  
✅ MongoDB connected
✅ Redis connected
✅ Ollama model loaded
```

### Step 4: Open the App
Go to **http://localhost:5173** in your browser

## 🎮 How to Use It

### 1. Ask a Question
Type any programming question like:
- "how to reverse a string in javascript"
- "python list comprehension examples"
- "what is async await in nodejs"

### 2. See Stack Overflow Results
You'll immediately see real answers from Stack Overflow (usually takes 2-3 seconds)

### 3. Wait for AI Magic ✨
The AI works in the background (takes 20-30 seconds). You'll see:
- 🤖 **AI Ranking (3) [Processing...]** 

### 4. Compare Rankings
Click between the two tabs:
- **📊 Stack Overflow Ranking**: Original order by votes
- **🤖 AI Ranking**: Reordered by technical quality

### 5. See the Difference!
The AI often puts different answers first because it focuses on:
- Code quality and best practices
- Clear explanations
- Technical accuracy
- Modern approaches (not just popular old answers)

## 🔧 What's Running Where?

| Service | URL | What It Does |
|---------|-----|--------------|
| **Frontend** | http://localhost:5173 | The web interface you use |
| **Backend API** | http://localhost:4000 | Handles requests and talks to Stack Overflow |
| **MongoDB** | localhost:27017 | Stores questions and answers |
| **Redis** | localhost:6379 | Caches data for speed |
| **Ollama AI** | http://localhost:11434 | The AI that reranks answers |

## 📁 Project Structure

```
stackoverflow-clone/
├── frontend/          # React app (what you see)
├── backend/           # Node.js API (handles requests)
├── docker-compose.yml # Starts everything together
└── README.md         # This file!
```

## 🔍 Testing It Works

### Quick Health Check
Visit http://localhost:4000/api/answers/health - you should see:
```json
{
  "success": true,
  "service": "stackoverflow-clone-api",
  "stack_overflow_api": { "status": "healthy" },
  "llm_service": { "status": "healthy" }
}
```

### Try These Test Questions
These work really well to show the difference:
- "how to reverse a string in javascript"
- "best way to handle errors in python"
- "difference between var let const javascript"

## 🐛 Troubleshooting

### "Connection refused" or "Can't reach backend"
```bash
# Check if all containers are running
docker-compose ps

# Should show all services as "Up"
```

### "AI is stuck on Processing..."
```bash
# Check Ollama logs
docker-compose logs ollama

# Restart just Ollama if needed
docker-compose restart ollama
```

### "No answers found"
- Make sure your question is at least 3 characters
- Try simpler terms like "javascript arrays" instead of very specific questions
- Check if Stack Overflow API is working: http://localhost:4000/api/answers/health

### "Frontend won't load"
```bash
# Rebuild frontend container
docker-compose up --build frontend
```

### "Everything is broken!"
```bash
# Nuclear option - restart everything
docker-compose down
docker-compose up --build
```

## 🔧 Configuration

### Backend Environment (.env in backend folder)
```bash
PORT=4000
MONGO_URI=mongodb://mongo:27017/so
REDIS_URL=redis://redis:6379
LLM_BASE_URL=http://ollama:11434
LLM_MODEL=mistral:7b
```

### Frontend Environment (.env in frontend folder) 
```bash
VITE_API_BASE_URL=http://localhost:4000/api
```

## 🛑 Stopping Everything

When you're done:
```bash
# Stop all containers
docker-compose down

# Stop and remove all data (fresh start next time)
docker-compose down -v
```

## 🧠 How the AI Works

The AI (Ollama with Mistral 7B model) looks at each answer and considers:

1. **Technical Accuracy** (40%) - Is the solution correct?
2. **Code Quality** (25%) - Best practices, readability
3. **Explanation Quality** (20%) - Does it teach you why?
4. **Practical Value** (10%) - Real-world usefulness
5. **Modern Approach** (5%) - Up-to-date methods

This often leads to very different rankings than just popularity votes!

## 📊 Example: See the Difference

**Question**: "how to reverse a string in javascript"

**Stack Overflow Order** (by votes):
1. ✅ Most upvoted answer (might be old but popular)
2. Simple one-liner solution  
3. Complex but complete explanation

**AI Reranked Order** (by quality):
1. 🤖 Best explanation with modern syntax + why it works
2. ✅ Most upvoted (if it's actually good)
3. Simple solution with caveats explained

## 🎯 Assignment Requirements Met

- ✅ User can type questions
- ✅ Fetches real Stack Overflow data  
- ✅ React UI with clean interface
- ✅ Local LLM (Ollama) reranks answers
- ✅ Tab/button switch between rankings
- ✅ Cosmetically similar to Stack Overflow
- ✅ Caches recent 5 questions in MongoDB
- ✅ Complete Docker setup for easy deployment

## 🤝 Contributing

This is an assignment project, but if you want to improve it:

1. Fork the repo
2. Make your changes  
3. Test with `docker-compose up --build`
4. Submit a pull request

## 📝 Notes

- **First run takes longer** - Docker downloads the 4GB AI model
- **AI processing takes 10-30 seconds** - it's doing real analysis
- **Requires internet** - fetches from Stack Overflow API
- **Uses real Stack Overflow data** - subject to their API limits

## 🎉 That's It!

You now have a fully working Stack Overflow clone with AI superpowers! 

The coolest part is seeing how the AI often promotes "hidden gem" answers that have great explanations but low votes, and sometimes ranks the accepted answer lower if there's a better modern solution.

Happy coding! 🚀

---

**Built with**: React + Node.js + MongoDB + Redis + Ollama + Docker + Stack Overflow API
