const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    password: "postgres",
    host: 'localhost',
    port: 5432,
    database: 'tests'
});

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(express.json({limit: '1mb'}));
app.use(bodyParser.urlencoded({ extended: false, limit: '1mb' }));
 
app.use(cors());
 
pool.connect((err, client, release) => {
    if (err) {
        return console.error(
            'Error acquiring client', err.stack)
    }
    client.query('SELECT NOW()', (err, result) => {
        release()
        if (err) {
            return console.error(
                'Error executing query', err.stack)
        }
        console.log("Connected to Database!");
    });
});





//SHOULD BE IN SEPARATE FILE RESPONSE

function success(message, result, statusCode){
    return {
        message,
        error: false,
        code: statusCode,
        result
    };
};

function error(message, statusCode){
    // List of common HTTP request code
    const codes = [200, 201, 400, 401, 404, 403, 422, 500];
  
    // Get matched code
    const findCode = codes.find((code) => code == statusCode);
  
    if (!findCode) statusCode = 500;
    else statusCode = findCode;
  
    return {
        message,
        code: statusCode,
        error: true
    };
};

//END SHOULD BE IN SEPARATE FILE RESPONSE






app.post('/CreateTodo', (req, res) => {
    if (!req.body.title || !req.body.description) {
        res.send("Missing title or description in request!");
        return console.error("Missing title or description in request!");
    }

    let query = 'INSERT INTO app_todos (id, title, description, username) VALUES (default, $1, $2, $3) returning id';
    let values = [req.body.title, req.body.description, req.body.username];

    if (req.body.image) {
        query = 'INSERT INTO app_todos (id, title, description, username, image) VALUES (default, $1, $2, $3, $4) returning id';
        values.push(req.body.image);
    }

    try {
        pool.query(query, values)
            .then(testData => {
                return res.status(res.statusCode)
                    .json(success("OK", testData.rows[0].id, res.statusCode));
            })
            .catch(err =>{
                return res.status(res.statusCode)
                    .json(error(err.message, res.statusCode));
            })
    } catch (error) {
        res.status(400).send(error);
    }
});

app.patch('/UpdateTodo', (req, res) => {
    if (!req.body.id || !req.body.title || !req.body.description) {
        res.send("Missing id, title or description in request!");
        console.error("Missing id, title or description in request!");
    }

    try {
        pool.query('Update app_todos set title=$2, description=$3, username=$4, image=$5 where id=$1 returning id', [req.body.id, req.body.title, req.body.description, req.body.username, req.body.image])
            .then(result => {
                return res.status(res.statusCode)
                    .json(success("OK", result.rows, res.statusCode));
            })
            .catch(err =>{
                return res.status(res.statusCode)
                    .json(error(err.message, res.statusCode));
            })
    } catch (error) {
        res.status(400).send(error);
    }
    
});

app.get('/ReadTodo', (req, res) => {
    if (!req.query.id) {
        res.send("Missing id in request");
        return console.error("Missing id in request");
    }

    try {
        pool.query('Select * from app_todos where id=$1', [req.query.id])
        .then(result => {
            return res.status(res.statusCode)
                .json(success("OK", result.rows[0], res.statusCode));
        });
    } catch (error) {
        return res.status(res.statusCode)
            .json(error(err.message, res.statusCode));
    }
    
});

app.get('/ReadAllTodos', (req, res) => {
    try {
        pool.query('Select id from app_todos')
            .then(testData => {
                //console.log(testData);

                const ids= [];

                testData.rows.forEach(row => {
                    ids.push(row.id);
                });

                return res.status(res.statusCode)
                    .json(success("OK", ids, res.statusCode));
            })
            .catch(err =>{
                return res.status(res.statusCode)
                    .json(error(err.message, res.statusCode));
            })
    } catch (error) {
        res.status(400).send(error);
    }
});

app.delete('/DeleteTodo', (req, res) => {
    if (!req.body.id) {
        res.send("Missing id in request");
        console.error("Missing id in request");
        return ;
    }

    try {
        pool.query('Delete from app_todos where id=$1', [req.body.id])
            .then(result => {
                return res.status(res.statusCode)
                    .json(success("OK", [], res.statusCode));
            })
            .catch(err => {
                return res.status(res.statusCode)
                    .json(error(err.message, res.statusCode));
            });
    } catch (error) {
        res.status(400).send(error);
    }
});


const server = app.listen(port, function () {
    let host = server.address().address
    let port = server.address().port
    console.log(`Server running on port ${port}`)
});
