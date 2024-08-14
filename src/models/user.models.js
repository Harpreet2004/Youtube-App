import mongoose,{Schema} from "mongoose";

const userSchema = new Schema({
    userName:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        index:true,
        lowercase:true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase:true
    },
    fullName:{
        type: String,
        required: true,
        trim: true,
        index:true
    },
    avatar: {
        type: String, //cloudinary URL
        required: true
    },
    coverImage: {
        type: String, //cloudinary URL
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password:{
        type: String,
        required: [true,"Password is required"]
    },
    refreshToken:{
        type: String
    }
}, {timestamps: true})

export const User = mongoose.model("User",userSchema);