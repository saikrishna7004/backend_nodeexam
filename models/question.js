const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question_id: {
        type: Number,
        unique: true
    },
    question_text: String,
    answer_id: [Number],
    exam_id: Number,
    choices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Choice' }],
    marks: Number,
    question_type: {
        type: String,
        enum: ['mcq', 'maq', 'int', 'dec', 'desc']
    },
    answer: Number
}, {
    timestamps: true,
});

function truncateWords(text, maxWords) {
    let truncatedText = text.split(" ").slice(0, maxWords).join(" ");
    if (text.split(" ").length > maxWords) {
        truncatedText += "...";
    }
    return truncatedText;
}

questionSchema.virtual('short_question_text').get(function () {
    return truncateWords(this.question_text, 6);
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;