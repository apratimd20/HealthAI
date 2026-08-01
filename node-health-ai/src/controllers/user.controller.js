
import User from "../models/user.models.js"
import jwt from 'jsonwebtoken'


const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role || 'user' }, process.env.JWT_SECRET, {
    expiresIn: "2d",
  });
};

export const registerUser = async (req, res) => {
    console.log(req.body)
    try {
        const { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are require"
            })
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "user already exist "
            })
        }

        const user = await User.create({
            name,
            email, password
        })



        const token = generateToken(user._id);



        return res.status(201).json({
            success: true,
            message: "User Created Successfully",
            token
        })


    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })

    }
}


export const loginUser = async (req, res) => {
    try {
        const {
            email, password
        } = req.body


        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are require"
            })
        }

        const isExist = await User.findOne({ email })

        if (!isExist) {
            return res.status(404).json(
                {
                    success: false,
                    message: "User not exist"
                }
            )
        }


        const isMatch = await isExist.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid Credentials"
            })

        }
       const token = generateToken(isExist);

        return res.status(200).json(
            {
             success:true,
             token,
             message:"User Login Success",
             user: {
                id: isExist._id,
                name: isExist.name,
                email: isExist.email,
                role: isExist.role,
             }
            }
        )

    } catch (error) {

    }
}



export const userProfile = async (req, res) => {
    try {
        console.log('👤 User from middleware:', req.user); 
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            data: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role || 'user',
            },
        });
    } catch (error) {
        console.error('Profile error:', error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
