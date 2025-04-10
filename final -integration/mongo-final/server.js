const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require("cors");
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();
const axios= require('axios');

const port = 3018;

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

const app = express();
app.use(express.static(__dirname));
app.use(express.urlencoded({extended:true}));
app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb+srv://richajoshi66:yYdqgq2N3ma0IZ3v@quizappcluster.3pxn3.mongodb.net/student');

const db = mongoose.connection;
db.once('open', ()=> {
    console.log("Mongodb connection successful");
});

const userSchema = new mongoose.Schema({
    bank: String,
    givenName: String,
    dob: String,
    emailID: String,
    loginID: String,
    password: String,
    createdAt: { type: Date, default: Date.now },
    documents: {
        idProof: String,
        addressProof: String,
        photo: String
    }
});

const Users = mongoose.model("data", userSchema);

// Route to serve the main page
app.get('/', (req, res) => { 
    res.sendFile(path.join(__dirname,'kyc.html'));
});

// Route to redirect to React app
app.get('/file-upload-bc/*', (req, res) => {
    res.redirect('http://localhost:3000'); 
});

// Route to serve registration page
app.get('/user reg', (req, res) => { 
    res.sendFile(path.join(__dirname,'user reg.html'));
});

// Route to serve login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Route to serve track status page
app.get('/track', (req, res) => {
    res.sendFile(path.join(__dirname, 'track.html'));
});

// Route to serve upload page
app.get('/upload_docs', (req, res) => { 
    res.sendFile(path.join(__dirname,'upload_docs.html'));
});

// Route to serve submission page
app.get('/submission', (req, res) => { 
    res.sendFile(path.join(__dirname,'submission.html'));
});

// Route to serve FAQ page
app.get('/faq', (req, res) => {
    res.sendFile(path.join(__dirname, 'faq.html'));
});

// Route to serve Contact page
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

// Route to serve Instructions page
app.get('/instructions', (req, res) => {
    res.sendFile(path.join(__dirname, 'instructions.html'));
});

// Legacy post route - consider removing or updating
app.post('/post', async (req, res)=> {
    const { bank, givenName, dateOfBirth, emailID, loginID, password } = req.body;    
    const user = new Users({
        bank,
        givenName,
        dateOfBirth,
        emailID,
        loginID,
        password
    });
    try {
        await user.save();
        console.log(user);
        res.redirect('/user reg');
    } catch (error) {
        console.error('error saving user:', error);
        res.status(500).send('error saving user data');
    }  
});

// Login route
app.post('/login', async (req, res) => {
    const { loginID, password } = req.body;
    try {
        const user = await Users.findOne({ loginID, password });
        if (user) {
            res.status(200).json({ 
                message: 'Login successful',
                userId: user._id 
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Track status endpoint
app.post('/track-status', async (req, res) => {
    const { loginID, password } = req.body;
    try {
        // Find user and include creation timestamp
        const user = await Users.findOne({ loginID, password });
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check documents in uploads folder
        const documents = {
            idProof: false,
            addressProof: false,
            photo: false
        };

        // Check if files exist in uploads folder
        try {
            const userFiles = fs.readdirSync('uploads').filter(file => 
                file.includes(user._id.toString())
            );
            
            userFiles.forEach(file => {
                if (file.includes('id')) documents.idProof = true;
                if (file.includes('address')) documents.addressProof = true;
                if (file.includes('photo')) documents.photo = true;
            });
        } catch (err) {
            console.error('Error reading uploads directory:', err);
        }
        
        // Combine user data with document status
        const responseData = {
            givenName: user.givenName,
            emailID: user.emailID,
            bank: user.bank,
            createdAt: user.createdAt || new Date(),
            documents: documents
        };

        res.status(200).json(responseData);
    } catch (error) {
        console.error('Track status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Registration route
app.post('/register', async (req, res) => {
    console.log("register", req.body);
    const { bank, givenName, dob, password, email, loginID } = req.body;
    const newUser = new Users({ 
        bank, 
        givenName, 
        dob, 
        emailID: email, 
        loginID, 
        password,
        createdAt: new Date()
    });
    try {
        const savedUser = await newUser.save();
        res.status(201).json({ userId: savedUser._id, message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Error registering user');
    }
});

// File upload endpoint
app.post('/upload-documents/:userId', upload.fields([
    { name: 'idProof', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
]), async (req, res) => {
    try {
        const userId = req.params.userId;
        const files = req.files;
        
        const user = await Users.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Update user document with file paths
        user.documents = {
            idProof: files.idProof ? files.idProof[0].path : null,
            addressProof: files.addressProof ? files.addressProof[0].path : null,
            photo: files.photo ? files.photo[0].path : null
        };

        await user.save();
        res.status(200).json({ message: 'Documents uploaded successfully' });
    } catch (error) {
        console.error('Error uploading documents:', error);
        res.status(500).send('Error uploading documents');
    }
});
app.post('/register', async (req, res) => {
    try {
    const { bank, givenName, dob, email, loginID, password } = req.body;
   
    // Validate name (2-20 characters, letters only)
    if (!givenName || !/^[A-Za-z ]{2,20}$/.test(givenName)) {
    return res.status(400).json({
    error: 'invalid_name',
    message: 'Name must be 2-20 characters long and contain only letters'
    });
    }
   
    // Validate age (18-100 years)
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
    }
    if (age < 18 || age > 100) {
    return res.status(400).json({
    error: 'invalid_age',
    message: 'Age must be between 18 and 100 years'
    });
    }
   
    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
    error: 'invalid_email',
    message: 'Please enter a valid email address'
    });
    }
   
    // Check if login ID already exists
    const existingUser = await Users.findOne({ loginID });
    if (existingUser) {
    return res.status(400).json({
    error: 'duplicate_login',
    message: 'Login ID already exists'
    });
    }
   
    // Validate password (5+ chars, uppercase, lowercase, special char)
    if (!password || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{5,}$/.test(password)) {
    return res.status(400).json({
    error: 'invalid_password',
    message: 'Password must be at least 5 characters and include uppercase, lowercase, and special character'
    });
    }
   
    // All validations passed, create new user
    const newUser = new Users({
    bank,
    givenName,
    dob,
    email,
    loginID,
    password
    });
   
    await newUser.save();
    res.status(201).json({
    success: true,
    message: 'Registration successful'
    });
   
    } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
    error: 'server_error',
    message: 'Registration failed'
    });
    }
   });
// Generate OTP function
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTPs temporarily
const otpStore = new Map();

// Send OTP endpoint
app.post('/send-otp', async (req, res) => {
    const { phone } = req.body;
   
    try {
        const otp = generateOTP();
       
        // Store OTP
        otpStore.set(phone, {
            otp,
            timestamp: Date.now(),
            attempts: 0
        });

        // Send OTP via 2Factor
        const response = await axios.get(
            `https://2factor.in/API/V1/${process.env.TWO_FACTOR_API_KEY}/SMS/${phone}/${otp}`
        );

        if (response.data.Status === 'Success') {
            setTimeout(() => {
                otpStore.delete(phone);
            }, 5 * 60 * 1000);

            res.json({ success: true, message: 'OTP sent successfully' });
        } else {
            throw new Error('Failed to send OTP');
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
});

// Verify OTP endpoint
app.post('/verify-otp', (req, res) => {
    const { phone, otp } = req.body;
    const storedData = otpStore.get(phone);
   
    if (!storedData) {
        return res.json({ success: false, message: 'OTP expired or not found' });
    }

    if (storedData.otp === otp) {
        otpStore.delete(phone);
        return res.json({ success: true, message: 'OTP verified successfully' });
    } else {
        storedData.attempts++;
        return res.json({ success: false, message: 'Invalid OTP' });
    }
});





// Track Status Route
app.post('/track', async (req, res) => {
 try {
 const { loginID, password } = req.body;

 // Find user by loginID and password
 const user = await Users.findOne({ loginID, password });

 if (!user) {
 return res.status(401).json({
 message: 'Invalid login credentials'
 });
 }

 // Return actual user data
 res.json({
 givenName: user.givenName,
 emailID: user.emailID,
 bank: user.bank,
 createdAt: user.createdAt
 });

 } catch (error) {
 console.error('Error:', error);
 res.status(500).json({
 message: 'Server error occurred'
 });
 }
});

 
const PORT = 3018;
app.listen(PORT, () => {
 console.log(`Server running on port ${PORT}`);
});
//app.listen(port, ()=> {
  //  console.log("server started");
//});