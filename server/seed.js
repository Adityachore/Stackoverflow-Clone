import mongoose from "mongoose";
import Question from "./models/question.js";
import User from "./models/auth.js";
import dotenv from "dotenv";

dotenv.config();

const sampleQuestions = [
    {
        questiontitle: "Mouse Cursor in 16-bit Assembly (NASM) Overwrites Screen Content in VGA Mode 0x12",
        questionbody: "I'm developing a PS/2 mouse driver in 16-bit assembly (NASM) for a custom operating system running in VGA mode 0x12 (640x480, 16 colors). The driver initializes the mouse, handles mouse events, and draws a cursor on the screen. However, I'm facing an issue where the mouse cursor overwrites the screen content underneath it, and when the cursor moves, it leaves a trail of black pixels (or whatever color the cursor is). \n\nI'm using direct video memory access (A000:0000) to draw to the screen. How can I implement a mechanism to save the background before drawing the cursor and restore it when the cursor moves?",
        questiontags: ["assembly", "operating-system", "driver", "osdev"],
        userposted: "PR0X",
    },
    {
        questiontitle: "Template specialization inside a template class using class template parameters",
        questionbody: "I have a template class `MyClass<TypA, TypX>` and I want to specialize a member structure based on `TypA`. \n\n```cpp\ntemplate<typename TypA, typename TypX> \nstruct MyClass { \n    using TypAlias = TypA<TypX>; // error: 'TypA' is not a template \n};\n```\n\nMyClass is very often specialized like `MyClass<std::vector, int>`. How can I correct this syntax to allow passing a template template parameter or specialize correctly?",
        questiontags: ["c++", "templates"],
        userposted: "Felix.leg",
    },
    {
        questiontitle: "How can i block user with middleware?",
        questionbody: "The problem I am trying to create a complete user login form in NextJS and I want to block the user to go to other pages without a login process before. So online i found that one of the most complete solutions is using Middleware. \n\nI tried implementing `middleware.ts` but it seems to run on every route perfectly except it doesn't redirect non-authenticated users. Here is my code: \n\n```javascript\nexport function middleware(request) {\n  if (!request.cookies.get('token')) {\n    return NextResponse.redirect(new URL('/login', request.url))\n  }\n}\n```\nWhat am i missing?",
        questiontags: ["node.js", "forms", "authentication", "next.js", "middleware"],
        userposted: "Aledi5",
    },
    {
        questiontitle: "call:fail action: private-web3-wallet-v2-o pen-wallet-connect, error: Pairing error: Subscribe error: Timed out waiting for 60000 ms",
        questionbody: "Can't connect my web3 wallet with a dApp. A message pops: Accounts must be CAIP-10 compliant. \n\nThe error message reads: `call:fail action: private-web3-wallet-v2-o pen-wallet-connect, error: Pairing error: Subscribe error: Timed out waiting for 60000 ms`\n\nI am using WalletConnect V2. Has anyone encountered this timeouts recently?",
        questiontags: ["web3", "wallet", "blockchain"],
        userposted: "CryptoUser",
    },
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL || "mongodb://localhost:27017/stackoverflow-clone");
        console.log("Connected to DB for seeding...");

        // Find a default user to assign these to, or create one
        let defaultUser = await User.findOne();
        if (!defaultUser) {
            console.log("No users found. Creating a seed user...");
            defaultUser = await User.create({
                name: "Seed User",
                email: "seed@example.com",
                password: "hashedpassword123", // Dummy hash
            });
        }

        console.log(`Assigning questions to user: ${defaultUser.name} (${defaultUser._id})`);

        const questionsWithUser = sampleQuestions.map(q => ({
            ...q,
            userid: defaultUser._id,
            // If the original sample had a specific author name, we keep it in 'userposted' for display
            // but link it to a real ID for logic validity.
        }));

        await Question.insertMany(questionsWithUser);
        console.log("Successfully seeded 4 sample questions!");

        mongoose.connection.close();
    } catch (error) {
        console.error("Error seeding DB:", error);
        process.exit(1);
    }
};

seedDB();
