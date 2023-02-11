const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ExamSchema = new Schema({
    title: {
        type: String
    },
    start_time: {
        type: String
    },
    end_time: {
        type: String
    },
    total_time: {
        type: String
    },
    exam_id: {
        type: Number,
        unique: true
    },
    type: {
        type: String
    },
    date: {
        type: Date
    },
    status: {
        type: Boolean,
        default: false
    },
    subjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }]
});

module.exports = mongoose.model("Exam", ExamSchema);
