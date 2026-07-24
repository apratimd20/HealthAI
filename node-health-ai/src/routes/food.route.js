import express from 'express'

import multer from 'multer'
import {  analyseFood, analyseFoodStream } from '../controllers/food.controller.js';

export const foodRouter = express.Router();

const upload = multer({
    dest:'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 }
})


foodRouter.post('/analyse',upload.single("image"),analyseFood)
// foodRouter.post('/analyse',upload.single("image"),analyseFoodStream)