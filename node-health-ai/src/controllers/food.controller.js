import {  analyseFoodImage, analyseFoodImageStream } from "../services/ai.service.js"

export const analyseFood = async (req,res) => {
   try {
    const imagePath = req.file.path
    const result = await analyseFoodImage(imagePath)
    console.log(result)
    return res.status(201).json({
            success :true,
            data:result 
    })
    
   } catch (error) {
        res.status(500).json({
            success:false,
            message: error.message
        })
    
   }

}

export const analyseFoodStream = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file uploaded"
            });
        }

        const imagePath = req.file.path;
        
      
        await analyseFoodImageStream(imagePath, res);
        
    } catch (error) {
        console.error('Stream analysis error:', error);
        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to analyze food image"
            });
        }
    }
};