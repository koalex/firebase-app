'use strict';

// TODO: err MW

global.__DEV__ = process.env.NODE_ENV == 'development';

process
    .on('unhandledRejection', err => {
        console.error(err.stack);
        process.exit(1);
    })
    .on('uncaughtException', err => {
        console.error(err.stack);
        process.exit(1);
    });

const express        = require('express');
const bodyParser     = require('body-parser');
const viewEngines    = require('consolidate');
const firebase       = require('firebase-admin');
const co             = require('co');
const app            = express();
const mysql          = require('./lib/mysql');
const firebaseApp    = firebase.initializeApp({
    credential: firebase.credential.cert(require('./carry-demo-firebase-adminsdk.json')),
    databaseURL: 'https://carry-demo.firebaseio.com'
});

app.engine('hbs', viewEngines.handlebars);
app.set('views', './views');
app.set('view engine', 'hbs');

const urlencodedParser = bodyParser.urlencoded({ extended: false });

// Read all orders
app.get('/', (req, res) => {
    let from  = /^\+?(0|[1-9]\d*)$/.test(req.query.from)? Number(req.query.from) : undefined;
    let limit = /^\+?(0|[1-9]\d*)$/.test(req.query.limit) && Number(req.query.limit) <= 500 ? Number(req.query.limit) : undefined;

    co(function* () {
        try {
            let orders = yield getAllOrders({ limit, from });

            res.render('index', {
                orders: orders || []
            });
        } catch (err) {
            if (__DEV__) console.error(err.stack);
            return res.sendStatus(500).end(err.message);
        }
    });
});

app.get('/api/v1/orders', (req, res) => {
    let from  = req.query && /^\+?(0|[1-9]\d*)$/.test(req.query.from)? Number(req.query.from) : undefined;
    let limit = req.query && /^\+?(0|[1-9]\d*)$/.test(req.query.limit) && Number(req.query.limit) <= 500 ? Number(req.query.limit) : undefined;

    co(function* () {
        try {
            let orders = yield getAllOrders({ limit, from });

            res.json(orders || []);
        } catch (err) {
            if (__DEV__) console.error(err.stack);
            return res.sendStatus(500).end(err.message);
        }
    });
});

// Read one order
app.get('/orders/:id', (req, res) => {
    co(function* () {
        try {
            let order = yield getOrderById(req.params.id);

            res.render('order', { order });
        } catch (err) {
            return res.sendStatus(500).end(err.message);
        }
    });
});

app.get('/api/v1/orders/:id', (req, res) => {
    co(function* () {
        try {
            let order = yield getOrderById(req.params.id);

            if (!order) return res.sendStatus(404);

            res.json(order);
        } catch (err) {
            if (__DEV__) console.error(err.stack);
            return res.sendStatus(500).end(err.message);
        }
    })
});

// Create order
app.post('/api/v1/orders', urlencodedParser, (req, res) => {
    if (!req.body) return res.sendStatus(400);

    let {
        name,
        lastname,
        phone,
        delivery_address,
        city,
        zip,
        details
    } = req.body;

    co(function* () {
        try {
            let result = yield new Promise((resolve, reject) => {
                mysql.beginTransaction(err => {
                    if (err) return reject(err);

                    let orderQuery = "INSERT INTO orders (name, lastname, phone, delivery_address, city, zip, details) "
                        +
                        `VALUES ('${name}', '${lastname}', '${phone}', '${delivery_address}', '${city}', '${zip}', '${details}')`;

                    mysql.query(orderQuery, (err, result) => {
                        if (err) mysql.rollback(() => {
                            return reject(err);
                        });

                        createOrder({
                            ...req.body,
                            id: result.insertId,
                            dt: Date.now()
                        })
                        .then(() => {
                            mysql.commit(err => {
                                if (err) mysql.rollback(() => reject(err));

                                resolve(result);
                            });
                        }, err => {
                            mysql.rollback(() => {
                                return reject(err);
                            });
                        });
                    });
                });
            });

            let orderId = result.insertId;

            res.redirect('/orders/' + orderId);
        } catch (err) {
            if (__DEV__) console.error(err.stack);
            return res.sendStatus(500).end(err.message);
        }
    });
});

// Update order
app.put('/api/v1/orders/:id', urlencodedParser, (req, res) => {
    if (!req.body) return res.sendStatus(400);

    let {
        name,
        lastname,
        phone,
        delivery_address,
        city,
        zip,
        details
    } = req.body;

    co(function* () {
        try {
            yield new Promise((resolve, reject) => {
                mysql.beginTransaction(err => {
                    if (err) return reject(err);

                    let updateQuery = "UPDATE orders SET "
                        +
                        `name='${name}', lastname='${lastname}', phone='${phone}', delivery_address='${delivery_address}', city='${city}', zip='${zip}', details='${details}'`
                        +
                        " WHERE id = " + req.params.id;

                    mysql.query(updateQuery, (err, result) => {
                        if (err) mysql.rollback(() => reject(err));

                        updateOrder({ id: req.params.id, data: {
                                id: req.params.id,
                                name,
                                lastname,
                                phone,
                                delivery_address,
                                city,
                                zip,
                                details
                            } })
                            .then(() => {
                                mysql.commit(err => {
                                    if (err) mysql.rollback(() => reject(err));

                                    resolve(result);
                                });
                            }, err => {
                                mysql.rollback(() => {
                                    return reject(err);
                                });
                            });
                    });
                });
            });

            res.end();
        } catch (err) {
            if (__DEV__) console.error(err.stack);
            return res.sendStatus(500).end(err.message);
        }
    });
});

// Delete single order
app.delete('/api/v1/orders/:id', (req, res) => {
    co(function* () {

        try {
            yield new Promise((resolve, reject) => {
                let deleteQuery = "DELETE FROM orders WHERE ID = " + req.params.id;

                mysql.query(deleteQuery, (err, result) => {
                    if (err) mysql.rollback(() => reject(err));

                    removeSingleOrder(req.params.id)
                        .then(() => {
                            mysql.commit(err => {
                                if (err) mysql.rollback(() => reject(err));

                                resolve(result);
                            });
                        }, err => {
                            mysql.rollback(() => {
                                return reject(err);
                            });
                        });
                });
            });

            res.end();
        } catch (err) {
            if (__DEV__) console.error(err.stack);
            return res.sendStatus(500).end(err.message);
        }
    });
});

const db  = firebaseApp.database();
const ref = db.ref('orders');

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

function getOrderById (orderId) {
    return db.ref('orders/' + orderId).once('value').then(snap => snap.val());
}

function getAllOrders ({ limit = 500, from = 1 }) {
    return ref.orderByChild('id').startAt(from).limitToFirst(limit).once('value').then(snap => {
        let val = snap.val();

        if (!val) return;

        return Object.keys(val).map(k => val[k]);
    });
}

function createOrder (order) {
    return db.ref('orders/' + order.id).set(order);
    // return ref.push(order);
}

function updateOrder ({ id, data }) {
    return ref.child(id).update(data);
}

function removeSingleOrder (key) {
    return ref.child(key).remove();
}

app.listen(3000);
