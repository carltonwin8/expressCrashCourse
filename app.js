#!/usr/bin/env node

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { check, validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');
const mongojs = require('mongojs');
const mongodb = require('mongodb');
const ObjectId = mongojs.ObjectId;
const ObjectID = require('mongodb').ObjectID;

const app = express();
const db = mongojs('172.17.0.2/customerapp',['users']);
const mongoClient = mongodb.MongoClient;
const url = 'mongodb://172.17.0.2/customerapp';

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

let users = [
  { _id:1 , first_name: 'Carlton', last_name: 'Joseph', email: 'cj@gmail.com', title: 'dude' },
  { _id:2 , first_name: 'Sam', last_name: 'Brown', email: 'sb@gmail.com', title: 'music' },
  { _id:3 , first_name: 'Diva', last_name: 'Woman', email: 'dv@gmail.com', title: 'goddes'}
];

app.get('/', (req, res) => {
  res.render('index', {users: users, action: "/users/add", del_action: "/users/delete"});
});

app.get('/db', (req, res) => {
  db.users.find((err,docs) => {
    res.render('index', {users: docs, action: "/users/adddb", del_action: "/users/deletedb"});
  });
});

app.get('/db2', (req, res) => {
  mongoClient.connect(url, (err, db) => {
    if (err) {
      console.log('Unable to connect to server', err);
    } else {
      const users = db.collection('users');
      users.find().toArray((err, result) => {
         if (err) {
           console.log(err);
           return res.send(err);
         } else if (result.length > 0) {
            return res.render('index', {users: result, action: "/users/adddb2", del_action: "/users/deletedb2"});
         } else {
           return res.send('No documents found');
         }
      });
      db.close();
    }
  });
});


app.post('/users/add(db)?(2)?', [
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
    const del_url =
      ('/usr/add' === req.url)
        ? '/users/delete'
        : ('/usr/adddb' === req.url)
          ? '/users/deletedb'
          : '/users/deletedb2';
    return res.render('index',{users: users, errors: errors, action: req.url, del_action: del_url});
  }

  const newUser = {
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    age: req.body.age,
  }
  const id = users[users.length - 1].id + 1;
  if (req.url === "/users/adddb") {
    db.users.insert(newUser, (err, result) => {
      if (err) {
        console.log("Error! db insert failed.");
        console.log(err);
      } else {
        res.redirect('/db');
      }
    });
  } else if (req.url === "/users/adddb2") {
    mongoClient.connect(url, (err, db) => {
      if (err) {
        console.log('Unable to connect to server', err);
      } else {
        const users = db.collection('users');
        users.insert(newUser, (err, result) => {
           if (err) {
             console.log(err);
             return res.send(err);
           } else {
             res.redirect('/db2');
           }
        });
        db.close();
      }
    });
  } else {
    users.push({ id: id, ...newUser});
    res.redirect('/');
  }
});

app.delete('/users/delete(db)?(2)?/:id', (req, res) => {
  if (req.url === '/users/delete/' + req.params.id) {
      users = users.filter(user => user._id !== parseInt(req.params.id));
      res.send(JSON.stringify({ status: 'OK' }));
  } else if (req.url === '/users/deletedb/' + req.params.id) {
    db.users.remove({_id: ObjectId(req.params.id)}, (err, result) => {
    res.setHeader('Content-Type', 'application/json');
      if (err) {
        console.log(err);
        res.send(JSON.stringify({ status: 'DB delete error.' }));
      } else {
        res.send(JSON.stringify({ status: 'OK' }));
      }
    });
  } else {
    mongoClient.connect(url, (err, db) => {
      if (err) {
        console.log('Unable to connect to server', err);
      } else {
        const users = db.collection('users');
        users.deleteOne({_id: new ObjectID(req.params.id) }, (err, result) => {
           if (err) {
             console.log(err);
             return res.send(err);
           } else {
             res.redirect('/db2');
           }
        });
        db.close();
      }
    });
  }
});

app.listen(port, () => {
  console.log(`server started on port ${port}`);
})
