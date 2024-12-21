const express = require("express");
const { getFbVideoInfo , getTiktokVideoInfo } = require("./index");
const bodyParser = require("body-parser");
const path = require("path");
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000; // You can change this to any port you prefer
const mongoURL = process.env.mongoURL || 'mongodb+srv://imeshsan2008:Imeshsandeepa018@cluster0.sirdt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster'; 
const { MongoClient } = require('mongodb');
const bcrypt = require("bcrypt");
const crypto = require('crypto');

const nodemailer = require('nodemailer');

// MongoDB Configuration
// const mongoURL = ''
const sendmail =  process.env.sendmail || 'imeshbota0@gmail.com';
const sendmailpass =  process.env.sendmailpass || 'erih xxkb jomi hlkz';

const dbName = process.env.DB_NAME || 'apisite';
let db;

// MongoDB Connection
const mongoClient = new MongoClient(mongoURL);
const currentTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Colombo"
});

const connectToMongoDB = async () => {
  if (!db) {
    await mongoClient.connect();
    db = mongoClient.db(dbName);
    console.log('Connected to MongoDB');
  }
  return db;
};
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public/include')));
// connect mongo db 
connectToMongoDB();
// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email provider
    auth: {
        user: sendmail, // Replace with your email
        pass: sendmailpass, // Replace with your email password or app password
    },
});
app.get('/verification-true', async (req, res) => {
    const { email } = req.query;
    // console.lo0g(email);
    
    try {
        

    const result = await db.collection('users').updateOne(
        { email: email }, // Find the user with the specified email
        { $set: { verification: true } } // Set verification to true
    );

    if (result.matchedCount === 0) {
        return res.status(400).json({ error: "No user found with the provided email." });

    } else if (result.modifiedCount > 0) {
        return res.status(200).json({ success: "User verification updated successfully." });

    } else {
        return res.status(200).json({ success: "User verification was already true." });

    }
    } catch (error) {
        return res.status(400).json({ error: "Error updating user verification:", error });
    }
});

// Route to handle user signup
app.post("/signup", async (req, res) => {
    const { full_name, email, password } = req.body;

    function isGmail(email) {
        if (email.includes("@gmail.com")) {
            return true;
        }
        return false;
    }
    
    if (isGmail(email)) {
        

    } else {
        res.redirect(`/signup.html?email=${email}&password=${password}&full_name=${full_name}&mes=Only access accounts with the '@gmail.com' domain&icon=error`);
        return
       }    
    // if (!full_name || !email || !password) {
    //     return res.status(400).json({ error: "All fields are required" });
    // }

    try {
        

        // Check if user already exists
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            
              res.redirect(`/signup.html?email=${email}&password=${password}&full_name=${full_name}&mes=Email already registered&icon=info`);
            
              return

        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        const currentDate = new Date();

        // Generate a random API key
        const apiKey = Math.random().toString(36).substr(2, 12);

        // Insert user into the database
        await db.collection('users').insertOne({
            full_name,
            email,
            password: hashedPassword,
            apikey: apiKey,
            total_request_count: 0,
            tdy_request_count: 0, // Initialize request count to 0
            verification:false,
            last_reset_date:currentDate,
            plan : 'free'
        });

        // Use either redirect or JSON response, not both
        res.redirect("/send-verification?email=" + email+'&fullname='+full_name);
        // Alternatively: res.json({ message: "User registered successfully", apikey: apiKey });
    } catch (error) {
        console.error("Error during signup:", error.message);
        // res.status(500).json({ error: "Internal server error" });
    }
});


app.post("/signin", async (req, res) => {
    const { email, password } = req.body;

    // Check if all fields are provided
    if (!email || !password) {
        res.redirect(`/sing.html?email=${email}&mes=Invalid password&icon=warning`);
return
    }

    try {
        

        // Check if the user exists
        const user = await db.collection('users').findOne({ email });

        if (!user) {
            res.redirect(`/sing.html?email=${email}&password=${password}&mes=Incorrect email adderss. Please check again&icon=warning`);
            return

        }

        // Compare the password with the stored hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            res.redirect(`/sing.html?email=${email}&mes=Invalid password&icon=warning`);
            return
            

        }

        // Check if the account is verified
        if (user.verification === false) {
            res.redirect(`/send-verification?email=${email}`);
        } else {
            // User is verified, redirect to home page
            res.redirect(`/home.html?email=${email}&password=${password}&mes=Login successful&icon=success`);
            return
        }

    } catch (error) {
        console.error("Error during signin:", error.message);
        res.redirect(`/sing.html?email=${email}&mes=Internal server error&icon=error`);
            return
    }
});

// Function to encrypt the verification code
function encryptCode(code) {
    const algorithm = 'aes-256-cbc'; // Encryption algorithm
    const secretKey = crypto.createHash('sha256').update('sa').digest('hex'); // Ensure 32-byte key
    const iv = crypto.randomBytes(16); // Initialization vector

    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
    let encrypted = cipher.update(code.toString());
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

// Function to decrypt the verification code
function decryptCode(encryptedCode) {
    const algorithm = 'aes-256-cbc'; // Encryption algorithm
    const secretKey = crypto.createHash('sha256').update('sa').digest('hex'); // Ensure 32-byte key

    // Split the encrypted code into IV and encrypted data
    const [ivHex, encryptedHex] = encryptedCode.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
}

// Now your other routes and functions can follow...
app.get('/de', async (req, res) => {
    const decryptedCode = decryptCode(req.query.code);
    res.json({ message: "User registered successfully", code: decryptedCode });
});

function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000); // 6-digit random code
}

// Route to send verification code and redirect
app.get('/send-verification', async (req, res) => {
    const { email } = req.query;
    const { fullname } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const verificationCode = generateVerificationCode();

    // Email options
    const mailOptions = {
        from: sendmail,
        to: email,
        subject: 'Your Verification Code',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
                <!-- Logo Section -->
                <div style="text-align: center; margin-bottom: 20px;">
                    <img src="public\vendors\images\weblite_logo.png" alt="Venom Devil's API" style="max-width: 150px; border-radius: 8px;">
                </div>
                <!-- Header Section -->
                <h2 style="color: #CC0066; text-align: center;">Welcome to Venom Devil's API</h2>
                <p style="font-size: 16px; color: #555; text-align: center;">
                    Your trusted API service for developers.
                </p>
                <!-- Message Section -->
                <div style="background-color: #fff; padding: 15px; border-radius: 8px; border: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 16px; color: #555;">
                        Dear ${fullname},
                    </p>
                    <p style="font-size: 16px; color: #555;">
                        Thank you for choosing Venom Devil's API! Please use the following verification code to complete your registration:
                    </p>
                    <div style="font-family: Arial, sans-serif;  margin: 0 auto; padding: 10px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
                    <p style="font-size: 24px; color: #CC0066; text-align: center; font-weight: bold; margin: 10px 0;">
                        ${verificationCode}
                    </p></div>
                    <p style="font-size: 16px; color: #555;">
                        If you did not request this code, please ignore this email or contact our support team.
                    </p>
                </div>
                <!-- Footer Section -->
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="font-size: 14px; color: #aaa; text-align: center;">
                    This is an automated message from <strong style="color: #CC0066;">Venom Devil's API</strong>. Please do not reply.
                </p>
            </div>
        `,
    };
    

    try {
        await transporter.sendMail(mailOptions);

        // Encrypt the verification code
        const encryptedCode = encryptCode(verificationCode);

        // Redirect to verification.html with the encrypted code as a query parameter
        res.redirect(`/verification.html?code=${encodeURIComponent(encryptedCode)}&email=${email}`);
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});
// Route to resend verification code and redirect
app.get('/resend-verification', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const verificationCode = generateVerificationCode();

    // Email options
// Email options
const mailOptions = {
    from: sendmail,
    to: email,
    subject: 'Your Verification Code',
    html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
            <!-- Logo Section -->
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="public\vendors\images\weblite_logo.png" alt="Venom Devil's API" style="max-width: 150px; border-radius: 8px;">
            </div>
            <!-- Header Section -->
            <h2 style="color: #CC0066; text-align: center;">Welcome to Venom Devil's API</h2>
            <p style="font-size: 16px; color: #555; text-align: center;">
                Your trusted API service for developers.
            </p>
            <!-- Message Section -->
            <div style="background-color: #fff; padding: 15px; border-radius: 8px; border: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 16px; color: #555;">
                    Dear ${fullname},
                </p>
                <p style="font-size: 16px; color: #555;">
                    Thank you for choosing Venom Devil's API! Please use the following verification code to complete your registration:
                </p>
                <div style="font-family: Arial, sans-serif;  margin: 0 auto; padding: 10px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
                <p style="font-size: 24px; color: #CC0066; text-align: center; font-weight: bold; margin: 10px 0;">
                    ${verificationCode}
                </p></div>
                <p style="font-size: 16px; color: #555;">
                    If you did not request this code, please ignore this email or contact our support team.
                </p>
            </div>
            <!-- Footer Section -->
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="font-size: 14px; color: #aaa; text-align: center;">
                This is an automated message from <strong style="color: #CC0066;">Venom Devil's API</strong>. Please do not reply.
            </p>
        </div>
    `,
};


    try {
        await transporter.sendMail(mailOptions);

        // Encrypt the verification code
        const encryptedCode = encryptCode(verificationCode);

        // Redirect to verification.html with the encrypted code as a query parameter
        return res.json({
            message: 'Verification code sent successfully',
            redirectUrl: `/verification.html?code=${encodeURIComponent(encryptedCode)}&email=${email}&icon=success`,
        });
    } catch (error) {
        console.error('Error sending email:', error);
        return res.json({
            redirectUrl: `/verification.html?code=${encodeURIComponent(encryptedCode)}&email=${email}&icon=error`,
        });
    }
});


// Function to validate API key and enforce limits
const validateApiKey = async (apikey) => {
    try {
        const user = await db.collection('users').findOne({ apikey });

        if (!user) {
            return { isValid: false, error: 'Invalid API key' };
        }


        return { isValid: true, user };
    } catch (err) {
        console.error('Error validating API key:', err.message);
        throw err;
    }
};

app.get("/userinfo", async (req, res) => {
    const { email } = req.query; // Get the email from query parameters
  
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
  
    try {
            
      // Find the user in the database based on the email
      const user = await db.collection('users').findOne({ email });
  

      // Return user info (full name and apikey)
      return res.status(200).json({
        email: user.email,
        full_name: user.full_name,
        apikey: user.apikey,
        total_request_count: user.total_request_count,
        
        tdy_request_count: user.tdy_request_count,
        last_reset_date : user.last_reset_date,
        plan: user.plan,


      });
      
    } catch (err) {
      return res.status(500).json({ error: "Server error" });
    }
  });
// Updated route handler
app.get("/download/fb", async (req, res) => {
    const apikey = req.query.apikey;
    const videoUrl = req.query.url;

    if (!apikey) {
        return res.status(400).json({ error: "API key is required" });
    }

    try {
        
        const { isValid, error, user } = await validateApiKey(apikey);

        if (!isValid) {
            return res.status(400).json({ error });
        }

        if (!videoUrl || !videoUrl.trim()) {
            return res.status(400).json({ error: "URL query parameter is required" });
        }

        if (!["facebook.com", "fb.watch"].some((domain) => videoUrl.includes(domain))) {
            return res.status(400).json({ error: "Please enter a valid Facebook URL" });
        }

        const result = await getFbVideoInfo(videoUrl);

        // Construct user info
        const userInfo = {
            email: user.email,
            plan: user.plan,
        };

        // Increment the request count
        await incrementRequestCount(apikey);

        // Send the response
        res.json({
            userInfo,
            videoInfo: result,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});// Updated route handler
app.get("/download/fb/guest", async (req, res) => {
    const videoUrl = req.query.url;

    try {
        const userInfo = {
            email: "Guest",
            link: "https://venom-devils-api.koyeb.app/signup.html"
        };

        // Check if video URL is provided
        if (!videoUrl || !videoUrl.trim()) {
            return res.status(400).json({
                ...userInfo,
                error: "URL query parameter is required"
            });
        }

        // Validate if the URL is from a supported Facebook domain
        if (!["https://web.facebook.com/reel/1785899365480917"].some((domain) => videoUrl.includes(domain))) {
            return res.status(400).json({
                ...userInfo,
                error: "You are accessing guest mode. Please sign up or sign in. Can you use any Facebook URL?"
            });
        }

        // Get video info (assuming getFbVideoInfo is defined and works)
        const result = await getFbVideoInfo(videoUrl);

        // Send the response with user info and video info
        res.json({
            userInfo,
            videoInfo: result,
        });

    } catch (error) {
        const userInfo2 = {
            email: "Guest",
            link: "https://venom-devils-api.koyeb.app/signup.html"
        };

        // Send error response
        res.status(500).json({
            ...userInfo2,
            error: error.message
        });
    }
});



// Function to reset daily request counts
const resetDailyRequestCount = async (email = null) => {
    try {
        // Ensure MongoDB connection
        if (!db) {
            await connectToMongoDB();
        }

        if (!email) {
            console.log("Email is required.");
            return { success: false, message: "Email is required." };
        }

        // Fetch the user by email
        const user = await db.collection('users').findOne({ email });
        if (!user) {
            console.log("User not found.");
            return { success: false, message: "User not found." };
        }

        const givetime = user.last_reset_date || null;
        if (!givetime) {
            console.log("Last reset date not available.");
            return { success: false, message: "Last reset date not available." };
        }

        // Get current time in Asia/Colombo timezone
        const currentTime = new Date().toLocaleString("en-US", {
            timeZone: "Asia/Colombo"
        });

        console.log("Given Time:", givetime);
        console.log("Current Time in Asia/Colombo:", currentTime);

        // Parse givetime and currentTime to Date objects
        const givenDate = new Date(givetime);
        const currentDate = new Date(currentTime);

        // Calculate the difference in milliseconds
        const timeDifference = currentDate - givenDate;

        // Convert milliseconds to hours
        const hoursDifference = timeDifference / (1000 * 60 * 60);

        console.log(`Time Difference in hours: ${hoursDifference}`);

        // Check if more than 24 hours have passed
        if (hoursDifference > 24) {
            const query = { email };
            const update = {
                $set: {
                    tdy_request_count: 0,
                    last_reset_date: currentTime
                }
            };

            // Update the user document
            const result = await db.collection('users').updateOne(query, update);

            if (result.modifiedCount > 0) {
                // console.log(`${result.modifiedCount} document(s) updated.`);
                return { status: true, message: "Daily request count statusfully reset." };
            } else {
                // console.log("No documents were updated.");
                return { status: false, message: "No documents were updated." };
            }
        } else {
            // console.log("Less than 24 hours have passed since the given time.");
            return { status: false, message: "Less than 24 hours have passed since the last reset." };
        }
    } catch (err) {
        // console.error("Error resetting daily request counts:", err.message);
        return { status: false, message: `Error: ${err.message}` };
    }
};

// Schedule task to reset daily request counts at midnight Colombo time
// cron.schedule('0 0 * * *', async () => {
//     console.log("Running daily reset task...");
//     await resetDailyRequestCount();
// });

// Function to increment request count
const incrementRequestCount = async (apikey) => {
    try {
        if (!db) {
            await connectToMongoDB();
        }

        const currentTime = new Date().toLocaleString("en-US", {
            timeZone: "Asia/Colombo"
        });
        const currentDate = new Date(currentTime);
console.log(currentDate);

        const result = await db.collection('users').updateOne(
            { apikey },
            { 
                $inc: { 
                    total_request_count: 1, 
                    tdy_request_count: 1 
                },
                $set: { 
                    last_reset_date: currentDate 
                }
            },
            { upsert: true } // Ensure a document is created if it doesn't exist
        );

        console.log("Increment result:", result.modifiedCount || result.upsertedCount);
    } catch (err) {
        console.error("Error incrementing request count:", err.message);
        throw err;
    }
};

// Example route to manually reset a user's daily request count
app.get("/reset", async (req, res) => {
    
        const email = req.query.email;
        if (!email) {
            return res.status(400).send("Email is required.");
        }
  
     resetDailyRequestCount(email)
    .then(response => res.status(200).json({ response: response }))
    .catch(err => res.status(500).json({ err }));

//  res.status(200).json({ success: "true", message: "Daily request count reset successfully" });
// return
   
});

app.get("/download/tiktok", async (req, res) => {
    const apikey = req.query.apikey;
    const videoUrl = req.query.url;

    if (!apikey) {
        return res.status(400).json({ error: "API key is required" });
    }

    try {
        
        const { isValid, error, user } = await validateApiKey(apikey);
        if (!db) {
            await connectToMongoDB();
        }
        if (!isValid) {
            return res.status(400).json({ error });
        }

        if (!videoUrl || !videoUrl.trim()) {
            return res.status(400).json({ error: "URL query parameter is required" });
        }

        if (!["tiktok.com", "fb.watch"].some((domain) => videoUrl.includes(domain))) {
            return res.status(400).json({ error: "Please enter a valid Facebook URL" });
        }

        const result = await getTiktokVideoInfo(videoUrl);

        // Construct user info
        const userInfo = {
            email: user.email,
            plan: user.plan,
        };

        // Increment the request count
        await incrementRequestCount(apikey);

        // Send the response
        res.json({
            userInfo,
            videoInfo: result,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.use((req, res) => {
    res.redirect(`/404.html`);

});








// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});