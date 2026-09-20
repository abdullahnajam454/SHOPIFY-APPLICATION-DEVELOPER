const mongoose = require("mongoose")

const connectDB = async ()=> {
    try{
        const url = process.env.MONGO_URI

        if (!url) {
            throw new Error("MongoDB URL is not coming from dotenv");
        }
        
        await mongoose.connect(url)

        console.log("MongoDB connected")
    }
    catch(error){
        console.error("Error connecting to MongoDB:", error)
        process.exit(1) // Exit the process with failure
    }
}

module.exports = connectDB