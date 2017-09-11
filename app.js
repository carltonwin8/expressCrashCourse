#!/usr/bin/env node

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { check, validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');
const mongojs = require('mongojs');
const ObjectId = mongojs.ObjectId;

const app = express();
const db = mongojs('172.17.0.2/customerapp',['users']);

const port = process.env.PORT || 3000;

/*
// custome middle ware example
const logger = (req, res, next) => {
  console.log('Logging ... ');
  next();
};

app.use(logger);
*/

// Global variables
app.use((req, res, next) => {
  res.locals.errors = null;
  next();
});

app.get('/hi', (req, res) => {
  res.send('hi');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(express.static(path.join(__dirname, 'public')));

const person = [
  { name: "Carlton", age: 51 },
  { name: "Jeffrey", age: 52 },
  { name: "Cheryl", age: 49 }
];

app.get('/person', (req, res) => {
  res.json(person);
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/customer', (req, res) => {
  res.render('customer', { title: 'Customer'});
});

const users = [
  { id:1 , first_name: 'Carlton', last_name: 'Joseph', email: 'cj@gmail.com', title: 'dude' },
  { id:2 , first_name: 'Sam', last_name: 'Brown', email: 'sb@gmail.com', title: 'music' },
  { id:3 , first_name: 'Diva', last_name: 'Woman', email: 'dv@gmail.com', title: 'goddes'}
];

app.get('/', (req, res) => {
  res.render('index', {users: users, action: "/users/add"});
});

app.get('/db', (req, res) => {
  db.users.find((err,docs) => {
    res.render('index', {users: docs, action: "/users/adddb"});
  });
});

app.post('/users/add(db)?', [
    check('first_name').exists().isLength({min: 1}).withMessage('First name is required'),
    check('last_name').exists().isLength({min: 1}).withMessage('Last name is required'),
    check('email').isEmail().withMessage('Email is required'),
    check('age').isInt().withMessage('Age is required'),
  ],
  (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) {
    //return res.status(422).json({ errors: errs.mapped() });
    const errors = errs.mapped();
    return res.render('index',{users: users, errors: errors, action: "/users/add"});
  }

  const newUser = {
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    age: req.body.age,
  }
  const id = users[users.length - 1].id + 1;
  if(req.url === "/users/adddb") {
    db.users.insert(newUser, (err, result) => {
      if (err) {
        console.log("Error! db insert failed.");
        console.log(err);
      } else {
        res.redirect('/db');
      }
    });
  } else {
    users.push({ id: id, ...newUser});
    res.redirect('/');
  }
});

app.delete('/users/delete/:id', (req, res) => {
  console.log('delete request received');
  console.log(req.params.id);
  db.users.remove({_id: ObjectId(req.params.id)}, (err, result) => {
  res.setHeader('Content-Type', 'application/json');
    if (err) {
      console.log(err);
      res.send(JSON.stringify({ status: 'DB delete error.' }));
    } else {
      console.log('delete completed.');
      console.log(result);
      res.send(JSON.stringify({ status: 'OK' }));
    }
  });
});

app.listen(port, () => {
  console.log(`server started on port ${port}`);
})
