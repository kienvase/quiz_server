
const express = require('express');
const app = express();

   // Import MW for parsing POST params in BODY

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

   // Import MW supporting Method Override with express

var methodOverride = require('method-override');
app.use(methodOverride('_method'));


   // MODEL

const Sequelize = require('sequelize');

const options = { logging: false, operatorsAliases: false};
const sequelize = new Sequelize("sqlite:db.sqlite", options);

const quizzes = sequelize.define(  // define table quizzes
    'quizzes',     
    {   question: Sequelize.STRING,
        answer: Sequelize.STRING
    }
);

sequelize.sync() // Syncronize DB and seed if needed
.then(() => quizzes.count())
.then((count) => {
    if (count===0) {
        return ( 
            quizzes.bulkCreate([
                { id: 1, question: "Capital of Italy",    answer: "Rome" },
                { id: 2, question: "Capital of France",   answer: "Paris" },
                { id: 3, question: "Capital of Spain",    answer: "Madrid" },
                { id: 4, question: "Capital of Portugal", answer: "Lisbon" }
            ])
            .then( c => console.log(`  DB created with ${c.length} elems`))
        )
    } else {
        return console.log(`  DB exists & has ${count} elems`);
    }
})
.catch( err => console.log(`   ${err}`));


   // VIEWs

const index = (quizzes) => `<!-- HTML view -->
<html>
    <head>
        <title>MVC Example</title><meta charset="utf-8">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
        <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
        <script type="text/javascript">
            function deleteQuizz(id, question){
                var conf = confirm('Delete: ' + question);
                if (conf){
                    $.ajax( {
                        type: 'delete',
                        url: '/quizzes/' + id,
                        success: function (response){
                            location.href=("/quizzes");
                        }
                    } )
                }
            }
        </script>
    </head>

    <body> 
    <div class="container">
        <div class="row">
            <div class="col-4 mx-auto">
                <div class="card border-primary">
                    <div class="card-header">
                        <h1>MVC: Quizzes</h1>
                    </div>
                    <div class="card-body mx-auto">
                        <table>`
                        + quizzes.reduce(
                            (ac, quiz) => ac += 
                    `       <tr>
                                <td><a href="/quizzes/${quiz.id}/play">${quiz.question}</a></td>
                                <td><a href="/quizzes/${quiz.id}/edit"><button class="btn btn-sm btn-outline-primary">Edit</button></a></td>
                                <td><button  class="btn btn-sm btn-outline-danger" onClick="deleteQuizz('${quiz.id}','${quiz.question}')">Delete</button></td>
                            </tr>\n`, 
                        ""
                    )
                + `     <p/>
                        </table>
                    </div>
                    <div class="card-footer">
                        <a href="/quizzes/new"><button class="btn btn-outline-success">New Quiz</button></a>
                    </div>
                </div>
            </div>
        </div>
    </div>
        
    </body>
</html>`;

const play = (id, question, response) => `<!-- HTML view -->
<html>
    <head>
        <title>MVC Example</title><meta charset="utf-8">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
        <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
        <script type="text/javascript">
            $(function(){
                $('#check').on('click', function(){
                    $.ajax( {
                        type: 'get',
                        url: '/quizzes/${id}/check',
                        data: {
                            'response' : $('#answer')[0].value,
                            'msg' : ""
                        },
                        success: function (response){
                            $('#msg').html('<h4>' + response + '</h4>');
                        }
                    } )
                });
            });
        </script>
    </head> 
    <body>
    <div class="container">
        <div class="row">
            <div class="col-4 mx-auto">
                <div class="card border-primary">
                    <div class="card-header">
                        <h1>MVC: Quizzes</h1>
                    </div>
                    <div class="card-body">
                        <form method="get"   action="/quizzes/${id}/check">
                            <div class="form-group">
                                <label for="answer">${question}</label>
                                <input class="form-control" type="text" id="answer" value="${response}" placeholder="Answer" />
                            </div>
                            <input class="btn btn-outline-success" type="button" id="check" value="Check"/>
                        </form>
                    </div>
                    <div class="card-footer">
                        <div id="msg"></div>
                        <a href="/quizzes"><button class="btn btn-outline-default">Go back</button></a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </body>
</html>`;

const quizForm =(msg, method, action, question, answer) => `<!-- HTML view -->
<html>
    <head>
        <title>MVC Example</title><meta charset="utf-8">
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">
        <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
        <script type="text/javascript">
            $(function(){
                $('#create').on('click', function(e){
                    e.preventDefault();
                    $.ajax( {
                        type: '${method}',
                        url: '${action}',
                        data: {
                            'question' : $('#question')[0].value,
                            'answer' : $('#answer')[0].value
                        },
                        success: function(response){
                            $('#msg').html(response +' Volviendo al inicio...');
                            setTimeout(function(){
                                location.href="http://localhost:8000/quizzes"
                            }, 2000);
                        }
                    } )
                });
            });
        </script>
    </head> 
    <body>
    <div class="container green">
        <div class="row">
            <div class="col-4 mx-auto">
                <div class="card border-primary">
                    <div class="card-header">
                        <h1>MVC:Quizzes</h1>
                    </div>
                    <div class="card-body">
                        <h4>${msg}: </h4>
                        <form>
                            <div class="form-group">
                                <input  class="form-control" type="text"  name="question" id="question" value="${question}" placeholder="Question" />
                            </div>
                            <div class="form-group">
                                <input  class="form-control"  type="text"  name="answer" id="answer" value="${answer}"   placeholder="Answer" />
                            </div>
                                <input  class="btn btn-outline-success"  type="submit" id="create" value="Create"/> <br>
                        </form>
                    </div>
                    <div class="card-footer">
                        <div id="msg"></div>
                        <a href="/quizzes"><button  class="btn btn-outine-default">Go back</button></a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </body>
</html>`;


   // CONTROLLER

// GET /, GET /quizzes
const indexController = (req, res, next) => {
 
    quizzes.findAll()
    .then((quizzes) => res.send(index(quizzes)))
    .catch((error) => `DB Error:\n${error}`);
}

//  GET  /quizzes/1/play
const playController = (req, res, next) => {
    let id = Number(req.params.id);
    let response = req.query.response || "";

    quizzes.findByPk(id)
    .then((quiz) => res.send(play(id, quiz.question, response)))
    .catch((error) => `A DB Error has occurred:\n${error}`);
 };

//  GET  /quizzes/1/check
const checkController = (req, res, next) => {
    let response = req.query.response, msg;
    let id = Number(req.params.id);

    quizzes.findByPk(id)
    .then((quiz) => {
        msg = (quiz.answer===response) ?
              `Yes, "${response}" is the ${quiz.question}` 
            : `No, "${response}" is not the ${quiz.question}. Try Again!!`;
        return res.send(msg);
    })
    .catch((error) => `A DB Error has occurred:\n${error}`);
};

//  GET /quizzes/1/edit
const editController = (req, res, next) => {
    let id = Number(req.params.id);
    quizzes.findByPk(id)
    .then((quiz) => {
        return res.send(quizForm("Edit new Quiz", "put", `/quizzes/${id}`, quiz.question, quiz.answer));
    })
    .catch((error) => `A DB Error has occurred:\n${error}`);
};

//  PUT /quizzes/1
const updateController = (req, res, next) => {
    let {question, answer} = req.body;
    let id = req.params.id;
    let msg = "";

    quizzes.findByPk(id)
    .then((quiz) => {
        quiz.update({question, answer})
            .then((quiz) => {
                msg = 'Edited.';
                res.send(msg);
            })
            .catch((error) => `Quiz not updated:\n${error}`);
    })
    .catch((error) => `Quiz not find:\n${error}`);
};

// GET /quizzes/new
const newController = (req, res, next) => {

    res.send(quizForm("Create new Quiz", "post", "/quizzes", "", ""));
 };

// POST /quizzes
const createController = (req, res, next) => {
    let {question, answer} = req.body;
    let msg = "";

    quizzes.build({question, answer})
    .save()
    .then((quiz) => {
        msg = 'Created.';
        res.send(msg);
    })
    .catch((error) => {
        `Quiz not created:\n${error}`;
    })
 };

// DELETE /quizzes/1
const destroyController = (req, res, next) => {
    let id = req.params.id;
    let msg = "";

    quizzes.findByPk(id)
    .then((quiz) => {
        quiz.destroy()
            .then((quiz) => {
                msg = 'Destroyed.';
                res.send(msg);
            })
            .catch((error) => `Quiz not destroyed:\n${error}`);
    })
    .catch((error) => `Quiz not find:\n${error}`);

 };



   // ROUTER

app.get(['/', '/quizzes'],    indexController);
app.get('/quizzes/:id/play',  playController);
app.get('/quizzes/:id/check', checkController);
app.get('/quizzes/new',       newController);
app.post('/quizzes',          createController);
app.get('/quizzes/:id/edit', editController);
app.put('/quizzes/:id', updateController);
app.delete('/quizzes/:id', destroyController);

    // ..... instalar los MWs asociados a
    //   GET  /quizzes/:id/edit,   PUT  /quizzes/:id y  DELETE  /quizzes/:id


app.all('*', (req, res) =>
    res.send("Error: resource not found or method not supported")
);        


   // Server started at port 8000

app.listen(8000);

