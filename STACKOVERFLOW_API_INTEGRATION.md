# StackOverflow API Integration Guide

## Overview
Your StackOverflow Clone is now integrated with the real StackOverflow API, providing access to real question data, tags, and user information.

---

## 🎯 Feature 1: Real Question/Answer Data (Database Seeding)

### What It Does
Seeds your database with real StackOverflow questions, answers, and tags so your app looks populated during demos instead of starting with an empty database.

### How to Use

```bash
# From server directory
node seedStackOverflow.js
```

### What Gets Seeded
- **50 trending questions** from StackOverflow with:
  - Title, description, tags
  - View count, answer count, score
  - Direct link to the original SO question
  - Source attribution

- **100 popular tags** with:
  - Tag name
  - Question count for each tag
  - Source attribution

### Database Fields Added
Questions will include:
```javascript
{
  questiontitle: "...",
  questionbody: "...",
  questiontags: ["javascript", "react", ...],
  userid: ObjectId,
  username: "StackOverflow",
  views: 1500,
  upvote: [],
  downvote: [],
  source: "stackoverflow",
  externalLink: "https://stackoverflow.com/questions/...",
  soId: 12345
}
```

---

## 🏷️ Feature 2: Tags Autocomplete

### What It Does
When users ask a question, they get real-time suggestions of popular StackOverflow tags as they type. This helps with tag discovery and ensures consistency with SO's tag ecosystem.

### Endpoints

#### `/stackoverflow/autocomplete-tags`
Returns up to 15 matching tags for autocomplete

**Query Parameters:**
- `q` (required): Partial tag name to search

**Example:**
```
GET /stackoverflow/autocomplete-tags?q=java
```

**Response:**
```json
{
  "success": true,
  "query": "java",
  "data": [
    {
      "name": "java",
      "count": 1700000,
      "label": "java (1700000)"
    },
    {
      "name": "javascript",
      "count": 2100000,
      "label": "javascript (2100000)"
    }
  ],
  "count": 2
}
```

### Frontend Integration
The "Ask a Question" page (`/ask`) now includes:
- Real-time tag suggestions as you type
- Shows question count for each tag
- Click to add suggestions to your tags
- Already implemented with autocomplete dropdown

---

## 🔍 Feature 3: Search Enhancement with Fallback

### What It Does
When users search for something:
1. First, search your local database
2. If local results are insufficient (< 5 results), automatically fallback to StackOverflow API
3. Seamlessly blend results from both sources

### Endpoints

#### `/stackoverflow/enhanced-search`
Unified search with SO API fallback

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Number of results (default: 30)

**Example:**
```
GET /stackoverflow/enhanced-search?q=how+to+center+a+div&limit=20
```

**Response:**
```json
{
  "success": true,
  "query": "how to center a div",
  "source": "stackoverflow",
  "data": [
    {
      "id": 269789,
      "title": "How do I center a div horizontally and vertically?",
      "score": 1200,
      "answers": 35,
      "views": 450000,
      "tags": ["css", "html", "flexbox"],
      "link": "https://stackoverflow.com/questions/269789/...",
      "author": "User123",
      "created": "2023-01-15T10:30:00Z"
    }
  ],
  "count": 1,
  "message": "Results from StackOverflow API"
}
```

### How Search Works
```
User searches "React hooks example"
         ↓
Try local database search
         ↓
Found 2 local results (< 5 threshold)
         ↓
Fallback to StackOverflow API
         ↓
Get 20 results from SO API
         ↓
Return combined results to user
```

---

## 📡 All Available StackOverflow Endpoints

### 1. **Trending Questions**
```
GET /stackoverflow/trending?limit=30
```
Fetches trending questions sorted by views

### 2. **Hot/Featured Questions**
```
GET /stackoverflow/hot
```
Fetches currently hot questions

### 3. **Top Answered Questions**
```
GET /stackoverflow/top-answered?limit=30
```
Fetches questions with most answers

### 4. **Search Questions**
```
GET /stackoverflow/search?q=keyword&limit=30
```
Fulltext search on StackOverflow

### 5. **Questions by Tag**
```
GET /stackoverflow/tags/javascript;react?limit=30
```
Search by multiple tags separated by semicolon

### 6. **Popular Tags**
```
GET /stackoverflow/popular-tags?limit=50
```
Get list of most popular tags

### 7. **User Information**
```
GET /stackoverflow/user/:userId
```
Fetch user profile and stats

### 8. **User's Questions**
```
GET /stackoverflow/user/:userId/questions?limit=30
```
Get all questions from a specific user

### 9. **API Status**
```
GET /stackoverflow/status
```
Check API configuration and quota

---

## 🔧 Configuration

### Environment Variables (in `.env`)
```
STACKOVERFLOW_CLONE_API=rl_2C3edakYY4Vs89XUYM1qThzto
```

This API key is already configured to access:
- Trending questions
- Popular tags
- Search functionality
- User information
- All 6+ features mentioned above

### Adding Your Own Key
If you want your own API key:
1. Go to https://stackapps.com/apps/register
2. Register your application
3. Copy your API key
4. Replace `STACKOVERFLOW_CLONE_API` in `.env`

---

## 💡 Use Cases

### Demo/Presentation
Run seeding script to populate with real questions:
```bash
node seedStackOverflow.js
```
Now your app looks complete without manual data entry!

### User Experience
- **Tag autocomplete** → Users find relevant tags while asking questions
- **Search fallback** → Users never get "no results" - SO API as safety net
- **Real data** → Fresh questions and trending content from SO

### Content Rich
- Trending questions appear on homepage
- Popular tags shown in tag listing
- Real user profiles and statistics

---

## 🚀 Integration Examples

### Example 1: Display Trending Questions on Homepage
```typescript
import axiosInstance from '@/lib/axiosinstance';

async function getTrendingQuestions() {
  const response = await axiosInstance.get('/stackoverflow/trending?limit=20');
  return response.data.data;
}
```

### Example 2: Autocomplete in Form
```typescript
const [suggestions, setSuggestions] = useState([]);

async function fetchTagSuggestions(query) {
  const response = await axiosInstance.get(
    `/stackoverflow/autocomplete-tags?q=${query}`
  );
  setSuggestions(response.data.data);
}
```

### Example 3: Enhanced Search
```typescript
async function searchWithFallback(query) {
  const response = await axiosInstance.get(
    `/stackoverflow/enhanced-search?q=${query}&limit=30`
  );
  return response.data; // Includes source: 'local' or 'stackoverflow'
}
```

---

## 📊 What You Get

| Feature | Benefit |
|---------|---------|
| **Real Questions** | App doesn't look empty during demos |
| **Tag Autocomplete** | Users easily find & use popular tags |
| **Search Fallback** | No more "no results" - always have content |
| **Live Updates** | Fresh trending questions constantly |
| **User Profiles** | Bring in real SO user data |
| **Consistent Tags** | Align with SO ecosystem |

---

## 🔐 API Rate Limits

The StackOverflow API allows:
- **10,000 requests per day** (30 requests/IP/second)
- Quota resets daily
- Check remaining quota with `/stackoverflow/status`

---

## 📱 Pages Using StackOverflow Integration

1. **Ask Question** (`/ask`)
   - ✅ Tag autocomplete enabled
   
2. **StackOverflow Explorer** (`/stackoverflow`)
   - ✅ All features available
   - ✅ Search, trending, hot, popular tags

3. **Home/Questions** (`/`)
   - Can be enhanced to show trending SO questions

---

## 🆘 Troubleshooting

### "No suggestions appearing"
- Check API key in `.env`
- Verify `/stackoverflow/autocomplete-tags` endpoint is working
- Check browser console for errors

### "Search returns empty"
- This is expected if query has no results locally AND on SO
- Check query spelling
- Try broader search terms

### "API Status shows offline"
- Verify `STACKOVERFLOW_CLONE_API` key in `.env`
- Check internet connection
- StackOverflow API might be temporarily down

---

## 🎓 Learning More

- **StackOverflow API Docs**: https://api.stackexchange.com/docs
- **Rate Limits & Quotas**: https://api.stackexchange.com/docs/rate-limit
- **Your App Routes**: `/api/stackoverflow/*`

---

## ✨ Next Steps

1. ✅ API is configured and ready
2. ✅ Seeding script created (`seedStackOverflow.js`)
3. ✅ Tag autocomplete implemented in `/ask` page
4. ✅ Search with fallback ready
5. **→ Run seeding to populate your database**
6. **→ Test tag autocomplete on Ask Question page**
7. **→ Explore `/stackoverflow` page for all features**

