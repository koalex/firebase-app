'use strict';

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

process
    .on('unhandledRejection', err => {
        console.error(err);
        process.exit(1);
    }).on('uncaughtException', err => {
        console.error(err);
        process.exit(1);
    });

const express     = require('express');
const bodyParser  = require('body-parser');
const viewEngines = require('consolidate');
const firebase    = require('firebase-admin');
const functions   = require('firebase-functions');
const co          = require('co');
const uuidv1      = require('uuid/v1');
const app         = express();
const firebaseApp = firebase.initializeApp(functions.config().firebase);
const mysql       = require('../lib/mysql');

app.engine('hbs', viewEngines.handlebars);
app.set('views', './views');
app.set('view engine', 'hbs');

const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Read all orders
app.get('/', (req, res) => {
    co(function* () {
        let orders = yield getAllOrders();

        new Promise((resolve, reject) => {

        });
        mysql.query('SELECT * from oreders LIMIT 100', function (err, rows, fields) {
            if (!err) {
                console.log('The solution is: ', rows);
            } else {
                console.log('Error while performing Query.');
            }
        });

        res.render('index', {
            orders
        });
    });
});

// Create order (client)
app.get('/create-order', (req, res) => {
    res.render('createOrder', {});
});

// Create order
app.post('/orders', urlencodedParser, (req, res) => {
    if (!req.body) return res.sendStatus(400);

    let {
        name,
        lastname,
        phone,
        delivery_address,
        city,
        zip
    } = req.body;

    co(function* () {
        yield createOrder(decodeURIComponent(req.params.order));

        res.redirect('/');
    });
});

// Update order
app.put('/orders/:id', (req, res) => {
    co(function* () {
        yield updateOrder({ id: req.params.id, data: req.query.data });

        res.redirect('/');
    });
});

// Delete all orders
app.delete('/orders', (req, res) => {
    co(function* () {
        yield removeOrders();

        res.redirect('/');
    });
});

// Delete single order
app.delete('/orders/:id', (req, res) => {
    co(function* () {
        yield removeSingleOrder(req.params.id);

        res.redirect('/');
    });
});

const ref = firebaseApp.database().ref('orders');

ref.on('child_added', function (childSnapshot, prevChildKey) {
    console.log('childSnapshot.val() =', childSnapshot.val());
});

ref.on('child_removed', function (oldChildSnapshot) {
    console.log('oldChildSnapshot.val() =', oldChildSnapshot.val());
});

ref.on('child_changed', function (childSnapshot, prevChildKey) {
    console.log('childSnapshot.val() =', childSnapshot.val());
});

ref.on('child_moved', function (childSnapshot, prevChildKey) {
    console.log('childSnapshot.val() =', childSnapshot.val());
});

/*function getOrderById (orderId) { // TODO
    return ref.once('value').then(snap => snap.val());
}*/

function getAllOrders () { // FIXME: how to get all orders ?
    return ref.once('value').then(snap => snap.val());
}

function createOrder (order) {
    return ref.set({
        id: uuidv1(),
        date: Date.now(),
        name: order
    });
}

function updateOrder ({ id, data }) {
    return ref.update({
        id: id,
        date: Date.now(),
        name: data
    });
}

function removeOrders () {
    return ref.remove();
}

function removeSingleOrder (key) {
    return ref.child(key).remove();
}

exports.app = functions.https.onRequest(app);
