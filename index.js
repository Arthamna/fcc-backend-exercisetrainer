const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true }));
const mongoose =  require('mongoose');
const {Schema}  =  mongoose; //remember to initialize correctly
mongoose.connect(process.env.MONGODB_URI);
console.log(process.env);

app.use(cors());
const NewUserSchema = new Schema({
  username: String,
});


const ExerciseSchema = new Schema({
  user_id: {type: String, required: true},
  description: String,
  duration: Number,
  date: Date,
})

const Exercise = mongoose.model("Exercise", ExerciseSchema);
const User = mongoose.model("User", NewUserSchema);

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//3
app.get('/api/users', async (req, res) => {
  const users = await User.find({}).select("_id username");
  if(!users){
    res.send("No Users");
  }else{
    res.json(users);
  }
})

//2
app.post('/api/users', async (req, res) => {
  console.log(req.body);
  const userObj = new User({
    username: req.body.username
  })
  try{
    const user = await userObj.save()
    console.log(user);
    res.json(user)
  }catch(err){
    console.log(err)
  }

//7
app.post("/api/users/:_id/exercises", async (req, res) => {
  const id = req.params._id;
  const { description, duration, date } = req.body

  try{
    const user = await User.findById(id)
    if(!user){
      res.send("Couldn't find user")
    }else{
      const excerciseObj = new Exercise({
        user_id: id,
        description,
        duration,
        date: date? new Date(date) : new Date()
      })
      const exercise = await excerciseObj.save()
      res.json({
        _id: user.id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString(),
      })
    }

  }catch(err){
    console.log(err);
    res.send("Error saving exercise")
  }
})
});

//9
app.get('/api/users/:_id/logs', async (req, res) => {
  const{ from, to, limit } = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  try{

    if(!user){
      res.send("No Users");
      return;
    }
    let dateObj = {}
    if (from){
      dateObj["$gte"] = new Date(from)
    }
    if (to){
      dateObj["$lte"] = new Date(to)
    }
    let filter = {
      user_id: id
    }
    if(from||to){
      filter.date = dateObj;
    }
    const excercises = await Exercise.find(filter).limit(+limit ?? 500)
    
    const log = excercises.map(e =>({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString()
    }));
    
    res.json({
      username: user.username,
      count: excercises.length,
      _id: user._id,
      log   
    });
  }catch (err){
    console.error(err);
    res.status(500).send("Error fetching logs");
  }
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
