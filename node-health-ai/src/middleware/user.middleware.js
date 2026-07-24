// middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/user.models.js';

export const authUser = async (req, res, next) => {
    try {
        // ✅ Debug: Log all headers
        console.log('📋 All headers:', req.headers);
        
        let token;

        // ✅ Check custom 'token' header (what your frontend sends)
        if (req.headers.token) {
            token = req.headers.token;
            console.log('✅ Found token in headers.token');
        }
        // ✅ Check Authorization header (Bearer)
        else if (req.headers.authorization?.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
            console.log('✅ Found token in Authorization header');
        }
        // ✅ Check cookies
        else if (req.cookies?.token) {
            token = req.cookies.token;
            console.log('✅ Found token in cookies');
        }

        if (!token) {
            console.log('❌ No token found in any source');
            return res.status(401).json({
                success: false,
                message: "Unauthorized. No token provided.",
            });
        }

        console.log('🔑 Token received:', token.substring(0, 20) + '...');

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token decoded:', decoded);

        // Get user from database
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            console.log('❌ User not found in database');
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        console.log('👤 User authenticated:', user.email);
        
        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('❌ Auth error:', error.message);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};