const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const User = require('./models/user')
const connectMongo = require('./utils/connectMongo')
const jwt = require('jsonwebtoken')
const cors = require('cors');
const multer = require('multer');
const Question = require('./models/question');
const choice = require('./models/choice');
const performance = require('perf_hooks').performance;

const SECRET = 'yoursecretkey';

async function connect() {
    await connectMongo();
    console.log('CONNECTED TO MONGO');
}
connect();

// storage 
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(bodyParser.json());
app.use(cors())

app.get('/', (req, res) => {
    res.send('Received your GET request');
});

app.post('/', (req, res) => {
    console.log(req.body);
    res.send('Received your POST request');
});

app.post('/api/login', async (req, res) => {
    console.log(req.body);
    if (req.method !== 'POST') {
        return res.status(402).json({ message: 'Invalid Method' });
    }
    try {
        console.log(req.body)
        const { username, password } = req.body;
        // Verify user credentials with your database
        const user = await User.findOne({ username, password });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        // Create JWT token
        const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '1h' });
        return res.json({ token });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/api/user', async (req, res) => {
    console.log(req.body);
    if (req.method !== 'POST') {
        return res.status(402).json({ message: 'Invalid Method' });
    }
    try {
        const { email, username, password, name } = req.body;
        const userNew = new User({ email, username, password, name });
        await userNew.save();
        res.status(200).json({ message: "User registered successfully!" });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/verify', async (req, res) => {
    console.log(req.body);
    if (req.method !== 'POST') {
        return res.status(402).json({ message: 'Invalid Method' });
    }
    try {
        const { token } = req.body;
        let v = jwt.verify(token, SECRET)
        let r = await User.findOne({ _id: v.userId })
        console.log(r)
        if (r._id)
            res.status(200).json({ message: "User validated successfully!", success: true });
        else
            res.status(401).json({ message: "User invalid!", success: false });
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: error.message, success: false });
    }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
    // console.log(req.body, req.file.buffer.toString());
    if (req.method !== 'POST') {
        return res.status(402).json({ message: 'Invalid Method' });
    }
    try {
        const file = req.file;

        if (!file) {
            res.status(400).json({ message: 'No file uploaded. Please upload a file.' });
        }

        let start = performance.now();

        // read the file content and decode
        const question_paper = file.buffer.toString('utf-8');
        const question_set = question_paper.split('\r\n__________\r\n');

        var exam_id = req.body.examId;
        var choice_id_inc = parseInt(exam_id + "000");
        var question_id_inc = parseInt(exam_id + "000");

        for (var x = 0; x < question_set.length; x++) {
            question_id_inc++;
            var queset = question_set[x].split("\n");
            var newQuestion = new Question({
                exam_id: exam_id,
                question_id: question_id_inc,
                question_text: queset[0],
                answer_id: parseInt(exam_id + "000") + x * 4 + parseInt(queset[5])
            });
            await newQuestion.save(async function (err, ques) {
                if (err) throw err;
                for (var y = 1; y < 5; y++) {
                    choice_id_inc++;
                    var newChoice = new choice({
                        question: ques._id,
                        choice_text: queset[y],
                        choice_id: choice_id_inc
                    });
                    await newChoice.save(function (err, choi) {
                        if (err) throw err;
                        Question.findOneAndUpdate({ _id: ques._id }, { $push: { choices: choi } }, function (err, question) {
                            if (err) throw err;
                        });
                    });
                }
            });
        }

        let end = performance.now();
        console.log("Time taken: " + (end - start) + "ms");

        res.status(200).json({ message: "Time taken: " + (end - start) + "ms" });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/uploadQuestions', upload.single('file'), async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(402).json({ message: 'Invalid Method' });
    }
    try {
        const questions = req.body.questions;
        const examId = req.body.examId;

        let start = performance.now();

        var choice_id_inc = parseInt(examId + "000");
        var question_id_inc = parseInt(examId + "000");
        var ans_count = parseInt(examId + "000");

        for (let x = 0; x < questions.length; x++) {
            const question = questions[x];
            question_id_inc++;
            var newQuestion = new Question({
                exam_id: examId,
                question_id: question_id_inc,
                question_text: question.question,
                marks: question.marks,
                question_type: question.type
            });
            if (question.type === "mcq" || question.type === "maq") {
                let temp = question.answers.map((ans, index) => ans==true ? (ans_count + (index + 1)) : null);
                newQuestion.answer_id = []
                for (const choi_id of temp) {
                    if (choi_id!==null) {
                        newQuestion.answer_id.push(choi_id)
                    }
                }
                ans_count += question.answers.length
                console.log(newQuestion.answer_id)
            } 
            else if (question.type === "dec" || question.type === "int") {
                newQuestion.answer = question.answer;
            }
            await newQuestion.save(async function (err, ques) {
                if (err) throw err;
                if (ques.question_type == 'dec' || ques.question_type == 'int' || ques.question_type == 'desc') return;
                else{console.log(ques.question_type)
                for (let y = 0; y < question.options.length; y++) {
                    const option = question.options[y]
                    choice_id_inc++;
                    var newChoice = new choice({
                        question: ques._id,
                        choice_text: option,
                        choice_id: choice_id_inc
                    });
                    await newChoice.save(function (err, choi) {
                        if (err) throw err;
                        Question.findOneAndUpdate({ _id: ques._id }, { $push: { choices: choi } }, function (err, question) {
                            if (err) throw err;
                        });
                    });
                }}
            });
        }

        let end = performance.now();
        console.log("Time taken: " + (end - start) + "ms");

        res.status(200).json({ message: "Time taken: " + (end - start) + "ms" });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/test', upload.single('file'), async (req, res) => {
    try {
        Question.find({ question_id: 5056001 }).populate('choices').exec((err, res) => {
            console.log(res[0].choices)
        })
        res.status(200).json({ message: "Hello" });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
    }
});

app.listen(5000, () => {
    console.log('Server running on port 5000');
});
