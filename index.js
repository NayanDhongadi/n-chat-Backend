const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy
const cors = require("cors")
const jwt = require("jsonwebtoken")


const app = express();
const port = 8000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());



mongoose.connect(
    "mongodb+srv://nayan:nayan@cluster0.1qmtt.mongodb.net/",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
).then(() => {
    console.log("Connected to MongoDB")
}).catch((err) => {
    console.log("Error connected to mongodb", err)
})




app.listen(port, () => {
    console.log("server is running on port ------------------------------------------->", port)
})



const User = require("./models/user");
const Message = require("./models/messege");
const multer = require("multer");


// endpoint for user register

app.post('/register', (req, res) => {
    const { name, email, password, image } = req.body;


    const newUser = new User({ name, email, password, image })

    newUser.save().then(() => {
        res.status(200).json({ message: "User Register Successfully" })
    }).catch((err) => {
        console.log('Error registering user', err);
        res.status(500).json({ message: "Error registering user" })
    })
})



const createToken = (userId) => {
    const payload = {
        userId: userId,
    };

    const token = jwt.sign(payload, "Nayan@1212", { expiresIn: "1h" });

    return token
};


// endpoint for user Login

app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email && !password) {
        return res.status(404).json({ messagae: "Email and password are required!!!" })
    }

    User.findOne({ email }).then((user) => {
        if (!user) {
            return res.status(404).json({ message: "User Not Found" })
        }

        if (user.password !== password) {
            return res.status(404).json({ message: "Invalid Password!" })
        }

        const token = createToken(user._id);
        res.status(200).json({ token })

    }).catch((err) => {
        console.log("error", err);
        res.status(500).json({ message: "Internal server Err!" })
    })
})




// endpoint for access all user except the logged in user
app.get("/users/:userId", (req, res) => {
    const loggedInUserId = req.params.userId;

    User.find({ _id: { $ne: loggedInUserId } }).then((user) => {
        res.status(200).json(user)
    }).catch((err) => {
        console.log("Error", err)
        res.status(500).json({ message: "Internal server Err!!!" })
    })
})




// endpoint to send a request to user

app.post("/friend-request", async (req, res) => {
    const { currentUserId, selectedUserId } = req.body;

    try {
        //update the recipents friend req array

        await User.findByIdAndUpdate(selectedUserId, {
            $push: { friendRequests: currentUserId },
        });


        // update the senders sentRequest Array
        await User.findByIdAndUpdate(currentUserId, {
            $push: { sentFriendRequests: selectedUserId }
        });

        res.status(200)

    } catch (error) {
        console.log("errpr---->", error)
        res.status(500).json({ massege: "Internal server Err" })
    }
})


// endpoint to show all the friend-request of a perticular user
app.get("/friend-request/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        // fetch the user document based on the user ID
        const user = await User.findById(userId).populate("friendRequests", "name email image").lean();

        const friendRequests = user.friendRequests;

        res.json(friendRequests);

    } catch (error) {
        console.log("Error", error);
        res.status(500).json({ massege: "Internal Server Err!!!" })
    }
})


// endpoint to accept a friend request of a pertucular person
app.post("/friend-request/accept", async (req, res) => {
    try {
        const { senderId, recepientId } = req.body;

        // Validate request
        if (!senderId || !recepientId) {
            return res.status(400).json({ message: "senderId and recipientId are required" });
        }

        // Retrieve the sender and recipient documents
        const sender = await User.findById(senderId);
        const recipent = await User.findById(recepientId);

        // Check if both users exist
        if (!sender || !recipent) {
            console.log(`Sender or recipient not found. senderId: ${senderId}, recipentId: ${recepientId}`);
            return res.status(404).json({ message: "Sender or recipient not found" });
        }

        // Add each other to the `friends` array
        sender.friends.push(recepientId);
        recipent.friends.push(senderId);

        // Remove the sender from the recipient's `friendRequests`
        recipent.friendRequests = recipent.friendRequests.filter(
            (request) => request.toString() !== senderId.toString()
        );

        // Remove the recipient from the sender's `sentFriendRequests`
        sender.sentFriendRequests = sender.sentFriendRequests.filter(
            (request) => request.toString() !== recepientId.toString()
        );

        // Save the updated documents
        await sender.save();
        await recipent.save();

        res.status(200).json({ message: "Friend request accepted successfully" });
    } catch (error) {
        console.log("Error is ----->", error);
        res.status(500).json({ message: "Internal server error" });
    }
});




// endpoint to access all the friends of the logged in user

app.get("/accepted-friends/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).populate(
            'friends',
            "name email image"
        )
        const acceptedFriends = user.friends;
        res.json(acceptedFriends)

    } catch (error) {
        console.log("Erorr,,,", error)
        res.status(500).json({ messege: "Internal server Error" })

    }
})



// endpoint to post Message and store it in backend

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'files/'); // Set the upload directory
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
    },
});

const upload = multer({ storage: storage });

// app.post("/messages", upload.single("imageFile"), async (req, res) => {

//     try {
//         console.log("req body ---->",req.body)
//         const { senderId, recepientId, messageType, messageText } = req.body;

//         const newMessage = new Message({
//             senderId,
//             recepientId,
//             message: messageText,
//             messageType,
//             // messageText,
//             timestamp: new Date(),
//             imageUrl: messageType === "image "
//         })

//         await newMessage.save();
//         res.status(200).json({ message: "Message Sent successfully!" })

//     } catch (error) {
//         console.log("Error----->", error)
//         res.status(500).json({ messege: "Error", error })
//     }


// })












app.post("/messages", upload.single("imageFile"), async (req, res) => {
    try {
        console.log("req body ---->", req.body);
        console.log("req file ---->", req.file);

        const { senderId, recepientId, messageType, messageText } = req.body;

        const newMessage = new Message({
            senderId,
            recepientId,
            messageType,
            messageText,
            imageUrl: messageType === "image" ? req.file?.path : null,
            timestamp: new Date(),
        });

        await newMessage.save();
        res.status(200).json({ message: "Message sent successfully!", newMessage });
    } catch (error) {
        console.error("Error----->", error);
        res.status(500).json({ message: "Error", error });
    }
});










// endpoint to get the userDetails to dsign the chat room header

app.get("/user/:userId", async (req, res) => {

    try {
        const { userId } = req.params;

        const recepientId = await User.findById(userId);
        res.json(recepientId)
    } catch (error) {
        console.log("Error----->", error);
        res.status(500).json({ error: "Internal serevr error" });
    }


})




// endpoint to fetch the message between two user in the chatroom

app.get("/messages/:senderId/:recepientId", async (req, res) => {
    try {
        const { senderId, recepientId } = req.params;


        const messages = await Message.find({
            $or: [
                { senderId: senderId, recepientId: recepientId },
                { senderId: recepientId, recepientId: senderId },
            ],
        }).populate("senderId", "_id name");

        res.json(messages)




    } catch (error) {
        console.log("error", error);
        res.status(500).json({ error: "Internal server error" });
    }
})




// endpoint to delte te message!

app.post("/deleteMessages", async (req, res) => {
    try {
        const { messages } = req.body;

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ message: "Invalid req body" });
        }

        await Message.deleteMany({ _id: { $in: messages } });

        res.json({message:"Messages delete successfully"})

    } catch (error) {
        console.log("Error--".error)
        res.status(500).json({ error: "Internal server error" })
    }
})



app.get("/friend-requests/sent/:userId",async(req,res)=>{

    try {
        const {userId} = req.params;
        const user = await User.findById(userId).populate("sentFriendRequests","name email image").lean();
        
        const sentFriendRequests = user.sentFriendRequests;
        
        res.json(sentFriendRequests);
        
        
    } catch (error) {
        console.log("Error:::::",error)
        res.status(500).json({message:"Internal server error"})
    }
    
})  





app.get("/friends/:userId",(req,res)=>{
    try {
        const {userId} = req.params;
        User.findById(userId).populate("friends").then((user)=>{
            if(!user){
                return res.status(404).json({message:"User Not Found"});
            }

            const friendsId = user.friends.map((friend) =>friend._id)
            res.status(200).json(friendsId)
        })

        
    } catch (error) {
        console.log("Error:::::",error)
        res.status(500).json({message:"Internal server error"})
    }
})



// endpoint t=to delete freiend req....

app.delete('/friend-request', async (req, res) => {
    try {
      const { currentUserId, selectedUserId } = req.body;
  
      if (!currentUserId || !selectedUserId) {
        return res.status(400).json({ error: 'Both user IDs are required.' });
      }
  
      // Remove the friend request from both users
      const currentUser = await User.findById(currentUserId);
      const selectedUser = await User.findById(selectedUserId);
  
      if (!currentUser || !selectedUser) {
        return res.status(404).json({ error: 'One or both users not found.' });
      }
  
      // Remove from `friendRequests` for the selected user
      selectedUser.friendRequests = selectedUser.friendRequests.filter(
        (requestId) => requestId.toString() !== currentUserId
      );
  
      // Remove from `sentFriendRequests` for the current user
      currentUser.sentFriendRequests = currentUser.sentFriendRequests.filter(
        (requestId) => requestId.toString() !== selectedUserId
      );
  
      // Save the updated users
      await currentUser.save();
      await selectedUser.save();
  
      res.status(200).json({ message: 'Friend request successfully removed.' });
    } catch (error) {
      console.error('Error removing friend request:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });