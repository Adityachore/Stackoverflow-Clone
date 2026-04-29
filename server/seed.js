import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Import all models
import User from "./models/auth.js";
import Question from "./models/question.js";
import Post from "./models/post.js";
import Tag from "./models/tag.js";

dotenv.config();

// ============ SAMPLE DATA ============

// 3 Sample Users
const sampleUsers = [
    {
        name: "John Developer",
        email: "john@example.com",
        password: "password123",
        isVerified: true,
        reputation: 150,
        about: "Full-stack developer with 5 years of experience",
        tags: ["javascript", "react", "nodejs"],
        location: "San Francisco, CA",
        avatar: "",
        questionsCount: 3,
        answersCount: 5
    },
    {
        name: "Sarah Coder",
        email: "sarah@example.com",
        password: "password123",
        isVerified: true,
        reputation: 75,
        about: "Python enthusiast and data science learner",
        tags: ["python", "mongodb", "git"],
        location: "New York, NY",
        avatar: "",
        questionsCount: 2,
        answersCount: 8
    },
    {
        name: "Mike Engineer",
        email: "mike@example.com",
        password: "password123",
        isVerified: true,
        reputation: 200,
        about: "Backend developer specializing in Java and microservices",
        tags: ["java", "typescript", "mongodb"],
        location: "Austin, TX",
        avatar: "",
        questionsCount: 5,
        answersCount: 12
    }
];

// 10 Common Programming Tags
const sampleTags = [
    {
        name: "javascript",
        displayName: "JavaScript",
        description: "JavaScript is a high-level, interpreted programming language that conforms to the ECMAScript specification.",
        category: "language",
        questionCount: 0,
        wiki: "JavaScript (JS) is a lightweight, interpreted, or just-in-time compiled programming language with first-class functions."
    },
    {
        name: "python",
        displayName: "Python",
        description: "Python is a multi-paradigm programming language with a design philosophy that emphasizes code readability.",
        category: "language",
        questionCount: 0,
        wiki: "Python is an interpreted, high-level, general-purpose programming language."
    },
    {
        name: "react",
        displayName: "React",
        description: "React is a JavaScript library for building user interfaces, maintained by Facebook.",
        category: "framework",
        questionCount: 0,
        wiki: "React makes it painless to create interactive UIs with its component-based architecture."
    },
    {
        name: "nodejs",
        displayName: "Node.js",
        description: "Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine for server-side development.",
        category: "platform",
        questionCount: 0,
        wiki: "Node.js is designed to build scalable network applications."
    },
    {
        name: "mongodb",
        displayName: "MongoDB",
        description: "MongoDB is a cross-platform document-oriented NoSQL database program.",
        category: "database",
        questionCount: 0,
        wiki: "MongoDB uses JSON-like documents with optional schemas."
    },
    {
        name: "css",
        displayName: "CSS",
        description: "CSS (Cascading Style Sheets) is a style sheet language used for describing the presentation of a document.",
        category: "language",
        questionCount: 0,
        wiki: "CSS describes how HTML elements should be displayed on screen, paper, or in other media."
    },
    {
        name: "html",
        displayName: "HTML",
        description: "HTML (HyperText Markup Language) is the standard markup language for documents designed for web browsers.",
        category: "language",
        questionCount: 0,
        wiki: "HTML elements are the building blocks of HTML pages."
    },
    {
        name: "java",
        displayName: "Java",
        description: "Java is a class-based, object-oriented programming language designed to have few implementation dependencies.",
        category: "language",
        questionCount: 0,
        wiki: "Java applications are typically compiled to bytecode that can run on any JVM."
    },
    {
        name: "typescript",
        displayName: "TypeScript",
        description: "TypeScript is a strict syntactical superset of JavaScript that adds optional static typing.",
        category: "language",
        questionCount: 0,
        wiki: "TypeScript is developed and maintained by Microsoft."
    },
    {
        name: "git",
        displayName: "Git",
        description: "Git is a distributed version-control system for tracking changes in source code during development.",
        category: "tool",
        questionCount: 0,
        wiki: "Git was created by Linus Torvalds in 2005 for Linux kernel development."
    }
];

// 3 Sample Questions (will be linked to user 1)
const sampleQuestions = [
    {
        questiontitle: "How do I center a div vertically and horizontally in CSS?",
        questionbody: "I've been trying to center a div both vertically and horizontally inside its parent container. I've tried using margin: auto but it only centers horizontally.\n\nHere's my current CSS:\n```css\n.container {\n  width: 100%;\n  height: 100vh;\n}\n.box {\n  width: 200px;\n  height: 200px;\n  margin: auto;\n}\n```\n\nWhat's the best modern approach to achieve this? I've heard about Flexbox and Grid but not sure which one to use.",
        questiontags: ["css", "html", "javascript"],
        userposted: "John Developer",
        views: 125,
        upvote: [],
        downvote: []
    },
    {
        questiontitle: "Why is my async/await function returning undefined in Node.js?",
        questionbody: "I'm working on a Node.js application and my async function keeps returning undefined instead of the expected data.\n\n```javascript\nasync function fetchData() {\n  const response = await fetch('https://api.example.com/data');\n  const data = response.json();\n  return data;\n}\n\nconst result = fetchData();\nconsole.log(result); // Promise { <pending> }\n```\n\nI expected to get the JSON data but I'm getting a pending Promise. What am I doing wrong?",
        questiontags: ["javascript", "nodejs", "react"],
        userposted: "John Developer",
        views: 89,
        upvote: [],
        downvote: []
    },
    {
        questiontitle: "Best practices for connecting to MongoDB in a production Node.js app?",
        questionbody: "I'm building a production-ready Node.js application with MongoDB as the database. Currently, I'm connecting to MongoDB in each route handler, which seems inefficient.\n\nQuestions:\n1. Should I use a connection pool?\n2. Where should I establish the connection - in app.js or a separate db.js file?\n3. How do I handle connection errors gracefully?\n4. What indexes should I create for better performance?\n\nAny best practices or patterns that experienced developers follow would be really helpful!",
        questiontags: ["mongodb", "nodejs", "javascript"],
        userposted: "John Developer",
        views: 234,
        upvote: [],
        downvote: []
    }
];

// 2 Sample Posts (linked to user 1 and user 2)
const samplePosts = [
    {
        name: "John Developer",
        description: "Just finished building my first full-stack application with React and Node.js! 🚀 It's a task management app with real-time updates using Socket.io. Learned so much about state management and API design. Happy to share the GitHub repo if anyone's interested in the code!",
        mediaUrl: "",
        mediaType: "",
        likes: [],
        comments: [],
        sharedCount: 0
    },
    {
        name: "Sarah Coder",
        description: "TIL: You can use Python's enumerate() function to get both index and value when looping through a list. No more manual counter variables! 🐍\n\nInstead of:\nfor i in range(len(my_list)):\n    print(i, my_list[i])\n\nUse:\nfor i, val in enumerate(my_list):\n    print(i, val)\n\n#Python #CodingTips",
        mediaUrl: "",
        mediaType: "",
        likes: [],
        comments: [],
        sharedCount: 0
    }
];

// ============ SEED FUNCTION ============

const seedDB = async () => {
    try {
        // Connect to MongoDB
        const dbUrl = process.env.MONGODB_URI || process.env.MONGODB_URL || "mongodb://localhost:27017/stackoverflow-clone";
        await mongoose.connect(dbUrl);
        console.log("✅ Connected to MongoDB for seeding...\n");

        // Ask for confirmation before clearing
        console.log("⚠️  This will clear existing data in: users, questions, posts, tags");
        console.log("📝 Seeding with sample data...\n");

        // Clear existing data
        await User.deleteMany({});
        await Question.deleteMany({});
        await Post.deleteMany({});
        await Tag.deleteMany({});
        console.log("🗑️  Cleared existing data\n");

        // ---- SEED USERS ----
        console.log("👤 Seeding Users...");
        const hashedUsers = await Promise.all(
            sampleUsers.map(async (user) => ({
                ...user,
                password: await bcrypt.hash(user.password, 12)
            }))
        );
        const createdUsers = await User.insertMany(hashedUsers);
        console.log(`   ✓ Created ${createdUsers.length} users`);
        
        // Get user IDs for linking
        const user1 = createdUsers[0];
        const user2 = createdUsers[1];

        // ---- SEED TAGS ----
        console.log("🏷️  Seeding Tags...");
        const createdTags = await Tag.insertMany(sampleTags);
        console.log(`   ✓ Created ${createdTags.length} tags`);

        // ---- SEED QUESTIONS ----
        console.log("❓ Seeding Questions...");
        const questionsWithUser = sampleQuestions.map(q => ({
            ...q,
            userid: user1._id.toString()
        }));
        const createdQuestions = await Question.insertMany(questionsWithUser);
        console.log(`   ✓ Created ${createdQuestions.length} questions`);

        // Update tag question counts
        for (const question of createdQuestions) {
            await Tag.updateMany(
                { name: { $in: question.questiontags } },
                { $inc: { questionCount: 1 } }
            );
        }
        console.log("   ✓ Updated tag question counts");

        // ---- SEED POSTS ----
        console.log("📝 Seeding Posts...");
        const postsWithUser = [
            { ...samplePosts[0], userId: user1._id.toString() },
            { ...samplePosts[1], userId: user2._id.toString() }
        ];
        const createdPosts = await Post.insertMany(postsWithUser);
        console.log(`   ✓ Created ${createdPosts.length} posts`);

        // ---- SUMMARY ----
        console.log("\n" + "=".repeat(50));
        console.log("🎉 DATABASE SEEDED SUCCESSFULLY!");
        console.log("=".repeat(50));
        console.log("\n📊 Summary:");
        console.log(`   • Users: ${createdUsers.length}`);
        console.log(`   • Tags: ${createdTags.length}`);
        console.log(`   • Questions: ${createdQuestions.length}`);
        console.log(`   • Posts: ${createdPosts.length}`);
        console.log("\n🔐 Test Login Credentials:");
        console.log("   Email: john@example.com");
        console.log("   Password: password123");
        console.log("\n");

        await mongoose.connection.close();
        console.log("📤 Database connection closed.");
        process.exit(0);

    } catch (error) {
        console.error("\n❌ Error seeding database:", error.message);
        console.error(error);
        process.exit(1);
    }
};

// Run seeder
seedDB();
