const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChoiceSchema = new Schema({
    question: {
        type: Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    },
    choice_text: {
        type: String,
        required: true
    },
    choice_id: {
        type: Number,
        unique: true,
        required: true
    }
});

module.exports = mongoose.models.Choice || mongoose.model('Choice', ChoiceSchema);