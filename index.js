const express = require("express");
const mongodb = require("mongodb");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
let nodemailer = require("nodemailer");

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT || 3000;
const dbUrl = process.env.DBURL || "mongodb+srv://rcmk:Hm6hGfpOyzIqq6Gm@cluster0.pyaww.mongodb.net/<dbname>?retryWrites=true&w=majority";
const frontEnd = process.env.FRONTEND || "http://127.0.0.1:5500/";
var SendMail = (emailId, message) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        port: 8000,
        secure: false,
        auth: {
            user: "madhannode@gmail.com",
            pass: "NodeMadhan123"
        }
    });

    let mailOptions = {
        from: "madhannode@gmail.com",
        to: emailId,
        subject: "Password Reset Request",
        html: message
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            return false;
        } else {
            return resetText;
        }
    });
};

var generateMessage = (emailId) => {
    let result = "";
    let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let charactersLength = characters.length;
    for (let i = 0; i < charactersLength; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    let additionalUrl = "FrontEnd/Validate.html";
    randomString = frontEnd + additionalUrl + "?token=" + result + "&email=" + emailId;
    message = "<p style='color:black;font-weight:bold'> Please click the below url </p> <br>" + "<a href='" + randomString + "'>" + randomString + "</a>";
    return [message, result];
};

app.listen(port, () => console.log("App is running in port ", port));

app.get("/users/resetPassword/:emailId", async (req, res) => {
    try {
        let client = await mongodb.connect(dbUrl);
        let db = client.db("PasswordResetFlowDB");
        let data = req.body;
        let emailId = req.params.emailId;
        let result = await db.collection("users").findOne({EmailId: emailId});

        if (! result) {
            res.status(400).json({result: false, message: "User Not Found!"});
            return;
        }
        let [message, randomString] = generateMessage(emailId);

        await db.collection("users").findOneAndUpdate({
            EmailId: emailId
        }, {
            $set: {
                PasswordReset: [randomString, new Date()]
            }
        });

        result = await db.collection("users").findOne({EmailId: emailId});
        SendMail(emailId, message);
        res.status(200).json({result: true, body: result});
    } catch (err) { 
        res.status(500).json({message: "Internal Server error", result: false});
    }
});

app.post("/users/resetPassword/url/:randomString", async (req, res) => {
    try {
        let client = await mongodb.connect(dbUrl);
        let db = client.db("PasswordResetFlowDB");
        let emailId = req.body.EmailId;
        let token = req.params.randomString;

        let result = await db.collection("users").findOne({EmailId: emailId});

        if (! result) {
            res.status(400).json({result: false, message: "User Not Found!"});
            return;
        }

        if (token !== result["PasswordReset"][0]) {
            res.status(404).json({result: false, message: "Invalid Url, Please click valid URL or Create New URL"});
            return;
        }
        let curDate = new Date();
        let diffMs = curDate - result["PasswordReset"][1];
        let diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
        

        if (diffMins > 10) {
            res.status(408).json({result: false, message: "URL timed out, Please creat a new reset URL"});
            return;
        }

        res.status(200).json({message: "Authentication Successful", result: true});
    } catch (err) {
        res.status(500).json({message: "Internal Server error", result: false});
    }
});

app.post("/users", async (req, res) => {
    try {
        let client = await mongodb.connect(dbUrl);
        let db = client.db("PasswordResetFlowDB");
        req.body.password = "testpassword";
        let salt = await bcrypt.genSalt(8);
        let hash = await bcrypt.hash(req.body.password, salt);
        req.body.password = hash;
        req.body.PasswordReset = [];
        let data = req.body;
        let result = await db.collection("users").insertOne(data);
        res.status(200).json({message: "User added successfully", result: true});
    } catch (err) {
        res.status(500).json({message: "Internal Server error", result: false});
    }
});

app.put("/users/:emailId", async (req, res) => {
    try {
        let client = await mongodb.connect(dbUrl);
        let db = client.db("PasswordResetFlowDB");
        let data = req.body;
        let emailId = req.params.emailId;
        let salt = await bcrypt.genSalt(8);
        let hash = await bcrypt.hash(req.body.password, salt);
        req.body.password = hash;
        let result = await db.collection("users").findOneAndUpdate({
            EmailId: emailId
        }, {
            $set: {
                password: req.body.password,
                PasswordReset: []
            }
        });

        res.status(200).json({message: "Password updated Successfully", result: true});
    } catch (err) {
        res.status(500).json({message: "Internal Server error", result: false});
    }
});
