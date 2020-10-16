const express = require("express");
const exphbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const redis = require('redis');
const { response } = require("express");
let client = redis.createClient()
client.on('connect', () => {
    console.log('connect to redis')
})
const port = 3000;
const app = express();

app.engine('handlebars', exphbs({defaultLayout:'main'}));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

app.use(methodOverride('_method'));

app.get('/', (req, res, next) => {
    res.render('searchusers');
});

app.get('/user', function(req, res, next){
    let return_dataset = []

    client.keys('*', (err, id) => {
        let multi = client.multi()
        let keys = Object.keys(id)
        let i = 0

        keys.forEach( (l) => {
            client.hgetall(id[l], (err, obj) => {
                i++
                if (err) {console.log(err)} else {
                    temp_data = {'id':id[l],'data':obj}
                    return_dataset.push(temp_data)
                }

                if (i == keys.length) {
                    res.send({user:return_dataset})
                }
            })
        })
    })
})

app.get('/user/:id', (req, res, next) => {
    let id = req.params.id
    client.hgetall(id, function(err, obj){
        if(!obj) {
            res.send()
        } else {            
            obj.id = id
            res.send({
                user: obj
            })
        }
    });
})

app.get('/user/add', (req, res, next) => {
    res.render('addsusers');
});

app.post('/user/add', (req, res, next) => {
    let {id} = req.body
    let {first_name} = req.body
    let {last_name} = req.body
    let {email} = req.body
    let {phone} = req.body
    
    client.hmset(id, [
        'first_name', first_name,
        'last_name', last_name,
        'email', email,
        'phone', phone
    ], function(err, reply) {
        if (err) {
            console.log(err)
        }
        response = client.hgetall(id)
        console.log(reply)
        res.json(response)
    })
});

app.delete('/user/delete/:id', function(res, req ,next){
    client.del(req.params.id)
    res.redirect('/')
})

app.listen(port, function() {
    console.log('Server start on port '+ port)
})