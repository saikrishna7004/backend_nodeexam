const mongoose = require('mongoose')
require('dotenv').config()

const connectMongo = async () => mongoose.connect(process.env.MONGO_URI);

module.exports = connectMongo