const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SubjectSchema = new Schema({
    exam: { type: Schema.Types.ObjectId, ref: 'Exam' },
    name: { type: String },
    length: { type: Number },
    start: { type: Number },
    end: { type: Number },
});

module.exports = mongoose.model('Subject', SubjectSchema)
