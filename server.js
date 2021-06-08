require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require("body-parser");
const mongoose = require('mongoose');


const port = process.env.PORT || 3000;


app.use(cors())
app.use(express.static('public'))


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });


const USER_SCHEMA = new mongoose.Schema({
    username: {type: String, required: true},
    log: [{
      description: String,
      duration: Number,
      date: Date
    }]
  });


const User = mongoose.model("User", USER_SCHEMA);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// POST request to create new user.
app.post('/api/users', (req,res) => {

   let username = req.body['username'];

   User.findOne({username: username}, (err, data) => {

     if(err) return console.log(err);
      
     if(data == null){

        var newUser = new User({
          username: username
        })


        newUser.save((err, data) => {

          if (err) return console.error(err);
          
          return res.json({
            username: username,
            _id: data.id
          })

        })
      }
      else {
        return res.send("User already exists")
      }
    })
})


app.get("/api/users", (req, res) => {

  User.find({}, "username _id", (err, data) => {

    res.json(data);
  });
});


app.post('/api/users/:_id/exercises', (req, res) => {
  
  let date = new Date().toDateString();

  if(req.body.date){
    date = new Date(req.body.date).toDateString()
  }



  let id = req.params._id;

  User.findOne({_id: id}, (err, data) => {
    if(err) return console.log(err);

    if(data == null) {
      return res.send("Invalid ID");
    }
    else{

      let desc = req.body.description;
      let dur = Number(req.body.duration);

      let newLog = {
        description: desc,
        duration: dur,
        date: date
      }
      
      data.log.push(newLog);
      
      data.save();

      res.json({
        username: data.username,
        _id: data._id,
        description: desc,
        duration: dur,
        date: date
      })
    }
  })
})



app.get("/api/users/:_id/logs", (req, res, done) => {
  User.findById(req.params._id, (err, data) => {
    if (err) {
      return console.log(err)
    } else {
      let log

      // CHECKS if there is any query 
      if (req.query.from == undefined || req.query.to == undefined) {
        log = data.log
        
        // CHECKS for limit in query
        if (req.query.limit != undefined) {
          log = log.slice(0, req.query.limit)
        }  
      } 
      
      else {

        let fromQuery = new Date(req.query.from)
        let toQuery = new Date(req.query.to)
   
        log = data.log
        .filter((item) => {
          if (item.date >= fromQuery && item.date <= toQuery) {
            return true
          } else {
            return false
          }
        })

        if (req.query.limit != undefined) {
          log = log.slice(0, req.query.limit)
        }
      }

      res.send({
        "username": data.username,
        "_id": data._id,
        "count": data.log.length,
        "log": log
      })
    done(null, data)
    }
  })
})




const listener = app.listen(port, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})