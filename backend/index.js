require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
const mailer = require('nodemailer');
const axios = require('axios');

const app = express();
app.use(cors()); // In production, configure this to your frontend URL
app.use(express.json());

// 1. Connect to Database
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("DB connected"))
  .catch(err => console.log(err));

// 2. Define the Database Schema
const subSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true }
});
const Sub = mongoose.model('Sub', subSchema);

// 3. Set up the Email Dispatcher
const tx = mailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 4. API Endpoint to take emails from React
app.post('/api/sub', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Strict Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ err: "Invalid email address format" });
        }

        const exists = await Sub.findOne({ email });
        if (exists) return res.status(400).json({ err: "Already on the list" });

        const newSub = new Sub({ email });
        await newSub.save();

        // Send Welcome Email instantly
        await tx.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Welcome to DevCompete Alerts! 🚀",
            html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; text-align: center;">
                <h2 style="color: #333;">Welcome to DevCompete!</h2>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 16px; color: #555;">You have successfully subscribed to daily coding contest alerts.</p>
                <p style="font-size: 16px; color: #555;">Every day at 8:00 AM, you will receive a curated list of upcoming contests on platforms like LeetCode, Codeforces, and CodeChef.</p>
                <br/>
                <p style="font-size: 18px; font-weight: bold; color: #4CAF50;">Happy coding!</p>
            </div>
            `
        });

        res.json({ msg: "Added to the alert list! Check your email." });
    } catch (err) {
        console.error("Subscription Error:", err);
        res.status(500).json({ err: "Server error" });
    }
});

// Helper function to fetch contests from Clist API
async function getContests(days = 1) {
    const username = process.env.CLIST_USERNAME;
    const api_key = process.env.CLIST_API_KEY;
    if (!username || !api_key) return [];

    const now = new Date();
    const end = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    // Fetch from Clist.by API
    const url = `https://clist.by/api/v4/contest/?username=${username}&api_key=${api_key}&start__gte=${now.toISOString()}&start__lte=${end.toISOString()}&order_by=start`;
    
    const res = await axios.get(url);
    
    // Filter for popular platforms to avoid spam/unknown contests
    const popularSites = [
        'codeforces.com',
        'codechef.com',
        'leetcode.com',
        'atcoder.jp',
        'hackerrank.com',
        'geeksforgeeks.org',
        'codingninjas.com'
    ];

    const filtered = res.data.objects.filter(c => 
        popularSites.some(site => c.host.includes(site))
    );

    // Map to our expected format
    return filtered.map(c => {
        // Ensure valid date string (clist often omits the 'Z' for UTC)
        const dateStr = c.start.endsWith('Z') ? c.start : c.start + 'Z';
        return {
            name: c.event,
            site: c.host,
            start_time: dateStr,
            url: c.href
        };
    });
}

// 4.5 API Endpoint for Frontend to get contests
app.get('/api/contests', async (req, res) => {
    try {
        // Fetch contests for the next 7 days to show on frontend
        const contests = await getContests(7);
        res.json(contests);
    } catch (err) {
        console.error("Failed to fetch contests for API:", err.message);
        res.status(500).json({ err: "Failed to fetch contests" });
    }
});

// 5. The Automation Engine
async function runTask() {
    try {
        // Get all emails from the database
        const users = await Sub.find();
        if (users.length === 0) {
            console.log("No subscribers found.");
            return;
        }
        const emails = users.map(u => u.email);

        // Fetch contest data for next 7 days
        const up = await getContests(7);

        // Send emails if there are contests
        if (up.length > 0) {
            let html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #333; text-align: center;">🔥 Upcoming Coding Contests (Next 7 Days)</h2>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <ul style="list-style-type: none; padding: 0;">
            `;
            
            up.forEach(c => {
                const startTime = new Date(c.start_time).toLocaleString();
                html += `
                <li style="background: #f9f9f9; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #4CAF50;">
                    <h3 style="margin: 0 0 5px 0; color: #222;">${c.name}</h3>
                    <p style="margin: 0 0 5px 0; color: #555;"><b>Platform:</b> ${c.site}</p>
                    <p style="margin: 0 0 10px 0; color: #555;"><b>Time:</b> ${startTime}</p>
                    <a href="${c.url}" style="display: inline-block; padding: 8px 15px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Register Now</a>
                </li>`;
            });
            html += `
                </ul>
                <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">You are receiving this because you subscribed to Daily Contest Alerts.</p>
            </div>`;

            await tx.sendMail({
                from: process.env.EMAIL_USER,
                bcc: emails.join(','), // Privacy fix: BCC instead of TO
                subject: "Your Daily Coding Contest Alert 🚀",
                html: html
            });
            console.log(`Alert blast sent to ${emails.length} subscribers.`);
        } else {
            console.log("No contests in the next 24 hours.");
        }
    } catch (err) {
        console.error("Task error:", err.message);
    }
}

// 6. Schedule the task (Runs daily at 8:00 AM)
cron.schedule('0 8 * * *', () => {
    console.log("Running scheduled contest check...");
    runTask();
}, {
    timezone: "Asia/Kolkata"
});

app.listen(process.env.PORT || 4000, () => {
    console.log(`Server running on port ${process.env.PORT || 4000}`);
    // runTask(); // Uncomment to test blast on startup
});
