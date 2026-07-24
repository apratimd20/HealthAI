
import fs from "fs"
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";


export const analyseFoodImageStream = async (imagePath, res) => {
    try {

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });


        // get the image to prepare 

        const imageData = fs.readFileSync(imagePath);
        const base64image = imageData.toString('base64');

        // set sse header 

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('cache-control', 'no-cache');
        res.setHeader('connection', 'keep-alive');

        //initial status send krna h yha 

        res.write(`event: status\ndata: ${JSON.stringify({ message: 'Analyse food with NutriAI...' })}\n\n`);

        // here we write the prompt which send to the ai with the image 

        const prompt = `Analyze this food image and return ONLY valid JSON (no other text):
        {
            "foodName": "name of the food",
            "calories": 0,
            "protein": 0,
            "carbohydrates": 0,
            "fat": 0,   
            "healthyScore": 0,
            "description": "In this anaylysis of the food as nutriton expert health related stuff"
        }`;

        // call openai with stream data 

        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            message: [
                {
                    role: "User",
                    content: [
                        {
                            type: "text",
                            text: prompt,
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64image}`
                            }
                        }

                    ]
                }
            ],
            stream: true


        });
        // send the chunk 

        let fullResponse = '';

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                fullResponse += content;
                //here we send the chunk 
                res.write(`event: chunk\ndata : ${JSON.stringify({ chunk: content })}\n\n`)
            }
        }

        // send complete response
        try {
            const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const data = JSON.stringify(jsonMatch[0]);
                res.write(`event: complete\ndata: ${JSON.stringify({ success: true, data })}\n\n`)
            }
        } catch (error) {
            res.write(`event:error\ndata: ${JSON.stringify({ message: "Failed to parse the response" })}\n\n`)
        }

        res.write(`event: done\ndata: ${JSON.stringify({ message: 'Analysis complete' })}\n\n`)
        res.end();

    } catch (error) {
        console.error('Error:', error);
        res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
        res.end();
    }
}


// openai 

// export const analyseFoodImage = async (imagePath) => {
//     try {
//         const openai = new OpenAI({
//             apiKey: process.env.OPENAI_API_KEY
//         });

//         // Read image
//         const imageData = fs.readFileSync(imagePath);
//         const base64image = imageData.toString('base64');

//        const prompt = `Analyze this food image and return ONLY valid JSON (no other text):
//         {
//             "foodName": "name of the food",
//             "calories": 0,
//             "protein": 0,
//             "carbohydrates": 0,
//             "fat": 0,   
//             "healthyScore": 0,
//             "description": "In this anaylysis of the food as nutriton expert health related stuff"
//         }`
//         const response = await openai.chat.completions.create({
//             model: "gpt-4o-mini",
//             messages: [
//                 {
//                     role: "user",
//                     content: [
//                         {
//                             type: "text",
//                             text: prompt,
//                         },
//                         {
//                             type: "image_url",
//                             image_url: {
//                                 url: `data:image/jpeg;base64,${base64image}`
//                             }
//                         }
//                     ]
//                 }
//             ],
//             stream: false, 
//             max_tokens: 200 
//         });

//         // Get the response
//         const fullResponse = response.choices[0].message.content;
        
//         // Extract JSON
//         const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
//         if (jsonMatch) {
//             const data = JSON.parse(jsonMatch[0]);
//             return {
//                 success: true,
//                 data: data
//             };
//         }

//         return {
//             success: false,
//             message: "Could not parse response"
//         };

//     } catch (error) {
//         console.error('Error:', error);
//         return {
//             success: false,
//             message: error.message
//         };
//     }
// };


//gemini



export const analyseFoodImage = async (imagePath) => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const imageData = fs.readFileSync(imagePath);
        const base64image = imageData.toString('base64');

        const prompt = `Analyze this food image. Return ONLY JSON with these facts:
        {
            "foodName": "",
            "calories": 0,
            "protein": 0,
            "carbohydrates": 0,
            "fat": 0
        }`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType: "image/jpeg",
                    data: base64image
                }
            }
        ]);

        const response = result.response;
        const fullResponse = response.text();
        
        const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            return {
                success: true,
                data: data
            };
        }

        return {
            success: false,
            message: "Could not parse response"
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            success: false,
            message: error.message
        };
    }
};