# Stack Overflow Clone - Setup Guide

## 🎯 Project Overview
A full-stack Stack Overflow clone built with:
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS v4

---

## 📋 Prerequisites

Before running this project, make sure you have:

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **MongoDB** - Choose one option:
   - **Option A**: Local MongoDB - [Download](https://www.mongodb.com/try/download/community)
   - **Option B**: MongoDB Atlas (Cloud) - [Sign up free](https://www.mongodb.com/cloud/atlas/register)
3. **npm** or **yarn** package manager

---

## 🚀 Installation Steps

### Step 1: Install Dependencies

Both server and frontend dependencies are already installed! ✅

If you need to reinstall:

```bash
# Install server dependencies
cd server
npm install

# Install frontend dependencies
cd ../stack
npm install
```

### Step 2: Configure Environment Variables

The `.env` file has been created in the `server/` directory with default values.

**Important**: Update the following in `server/.env`:

```env
# For Local MongoDB (default):
MONGODB_URL=mongodb://localhost:27017/stackoverflow-clone

# For MongoDB Atlas (cloud):
# MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/stackoverflow-clone

# Change this secret key for production!
JWT_SECRET=stackoverflow_clone_secret_key_2025
```

### Step 3: Start MongoDB (if using local)

**Windows:**
```bash
# MongoDB should start automatically as a service
# Or manually start it:
mongod
```

**Mac/Linux:**
```bash
brew services start mongodb-community
# Or:
sudo systemctl start mongod
```

### Step 4: Start the Backend Server

```bash
cd server
npm start
```

You should see:
```
✅ Connected to MongoDB
🚀 Server running on port 5000
```

The API will be available at: `https://stackoverflow-clone-6cll.onrender.com`

### Step 5: Start the Frontend

Open a **new terminal** and run:

```bash
cd stack
npm run dev
```

The application will be available at: `http://localhost:3000`

---

## 🔗 API Endpoints

### Authentication
- `POST /user/signup` - Register new user
- `POST /user/login` - User login

### Questions
- `GET /question/get` - Get all questions
- `POST /question/add` - Create new question
- `GET /question/:id` - Get question by ID
- `PATCH /question/vote/:id` - Vote on question
- `DELETE /question/delete/:id` - Delete question

### Answers
- `POST /answer/post/:id` - Post answer to question
- `PATCH /answer/vote/:id` - Vote on answer
- `DELETE /answer/delete/:id` - Delete answer

---

## 📁 Project Structure

```
stackoverflow-clone-main/
├── server/                    # Backend (Node.js + Express)
│   ├── controller/           # Business logic
│   │   ├── auth.js          # Authentication logic
│   │   ├── question.js      # Question operations
│   │   └── answer.js        # Answer operations
│   ├── models/              # MongoDB schemas
│   │   ├── auth.js          # User model
│   │   └── question.js      # Question model
│   ├── routes/              # API routes
│   │   ├── auth.js          # /user/* routes
│   │   ├── question.js      # /question/* routes
│   │   └── answer.js        # /answer/* routes
│   ├── middleware/          # Auth middleware
│   ├── index.js            # Server entry point
│   ├── .env                # Environment variables
│   └── package.json        # Dependencies
│
└── stack/                   # Frontend (Next.js + React)
    ├── src/
    │   ├── pages/          # Next.js pages
    │   │   ├── index.tsx   # Home page
    │   │   ├── auth/       # Login page
    │   │   ├── signup/     # Registration
    │   │   ├── ask/        # Ask question
    │   │   ├── questions/  # Question details
    │   │   └── users/      # User profiles
    │   ├── components/     # React components
    │   │   ├── Navbar.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── RightSideBar.tsx
    │   │   ├── QuestionDetail.tsx
    │   │   └── ui/         # Shadcn UI components
    │   ├── lib/           # Utilities
    │   └── styles/        # Global styles
    └── package.json       # Dependencies
```

---

## 🛠️ Development Commands

### Server
```bash
npm start          # Start with nodemon (auto-reload)
```

### Frontend
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

---

## ✅ Verification Checklist

- [x] Dependencies installed (server)
- [x] Dependencies installed (frontend)
- [x] Security vulnerabilities fixed
- [x] Environment variables configured
- [ ] MongoDB running (local or Atlas)
- [ ] Backend server running on port 5000
- [ ] Frontend running on port 3000
- [ ] Can access http://localhost:3000

---

## 🔧 Troubleshooting

### MongoDB Connection Error
**Error**: `❌ MongoDB connection error`

**Solutions**:
1. Make sure MongoDB is running
2. Check your `MONGODB_URL` in `.env`
3. For local MongoDB, ensure it's installed and started
4. For Atlas, verify your connection string and network access

### Port Already in Use
**Error**: `Port 5000 is already in use`

**Solution**: Change the port in `.env`:
```env
PORT=5001
```

### Frontend Can't Connect to Backend
**Error**: Network errors when making API calls

**Solutions**:
1. Verify backend is running on port 5000
2. Check CORS configuration in `server/index.js`
3. Update API base URL in frontend if needed

---

## 🎨 Features

- ✅ User authentication (signup/login)
- ✅ Ask questions
- ✅ Answer questions
- ✅ Vote on questions and answers
- ✅ User profiles
- ✅ Search functionality
- ✅ Tags system
- ✅ Responsive design
- ✅ Modern UI with Tailwind CSS

---

## 📝 Notes

- **Default MongoDB Database**: `stackoverflow-clone`
- **JWT Token Expiration**: 7 days
- **Frontend Port**: 3000
- **Backend Port**: 5000

---

## 🚀 Next Steps

1. Start MongoDB
2. Run the backend server
3. Run the frontend
4. Open http://localhost:3000
5. Create an account and start asking questions!

---

## 📞 Need Help?

If you encounter any issues:
1. Check the console for error messages
2. Verify all services are running
3. Check the `.env` configuration
4. Ensure MongoDB is accessible

Happy coding! 🎉
