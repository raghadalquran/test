// 'use strict';
// require('dotenv').config();
// const PORT = process.env.PORT || 4000;
// const express = require('express');
// const cors = require('cors');
// const pg = require('pg');
// const superagent = require('superagent');
// const methodOverRide = require('method-override');
// const app = express();
// const client = new pg.Client(process.env.DATABASE_URL);
// app.use(cors());
// app.use(express.json());
// app.use(express.static('./public'));
// app.use(express.urlencoded({extended: true}));
// app.set('view engine','ejs');
// app.use(methodOverRide('_method'));
///////////////////////Routs/////////////////////////////////////


// app.get('*',norFoundHandler());
////////////////////////Callback Functions/////////////////////////////////////////



////////////////////////Errors Function//////////////////////////
// function errorHandler(err,req,res){
// res.status(500).send(err);
// }
// function norFoundHandler(req,res){
// res.status(404).send('NOT FOUND');
// }
////////////////////////Connect the SERVER/////////////////////////
// client.connect()
// .then(()=>{
//     app.listen(PORT , ()=>{
//         console.log(`RAGHAD server up and runing on port ${PORT}`);
//     })
// })


'use strict';
require('dotenv').config();
const express = require('express');
const pg = require('pg');
const PORT = process.env.PORT || 3030;
const app = express();
const superagent = require('superagent');
app.use(express.static('./public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
const client = new pg.Client(process.env.DATABASE_URL);
const methodOverRide = require('method-override') //////////
app.use(methodOverRide('_method'))
////////////////
app.put('/update/:update_book', newUpdate);
function newUpdate (req , res){
  //collect
  let { author, title, isbn, image_url, description ,bookShelf} = req.body;
  //update
  let SQL = 'UPDATE books set author=$1,title=$2,isbn=$3,image_url=$4,description=$5,bookshelf=$6 WHERE id=$7 ;';
  //safevalues
  let idParam = req.params.update_book;
  let safeValues = [author,title,isbn,image_url, description,bookShelf,idParam];
  client.query(SQL,safeValues)
    .then(()=>{
      res.redirect(`/books/${idParam}`);
    })
}
//===============Routs=================\\
app.get('/', getDataFromDB);
app.get('/index',getDataFromDB);
app.get('/books/:bookID', detailsFun);
app.post('/books', saveToDB);
app.get('/searches/new', newSearch);
app.get('*', notFoundHandler);
//===============Callback Functions=================\\
function getDataFromDB(req, res) {
  const SQL = 'SELECT * FROM books;';
  return client.query(SQL)
    .then(result => {
      res.render('./pages/index', { data: result.rows })
    })
}
//////////////
app.delete('/delete/:deleted_book',deletBook);
function deletBook(req,res){
  let idParam = req.params.deleted_book;
  let saveID = [idParam];
  let sql = 'DELETE FROM books WHERE id=$1;';
  return client.query(sql,saveID)
    .then(()=>{
      res.redirect('/');
    })
}
function detailsFun(req, res) {
  let saveId = [req.params.bookID];
  // console.log(saveId);
  let sql = `SELECT * FROM books WHERE id = $1;`
  let SQL2 = 'SELECT DISTINCT bookshelf FROM books;'
  let arrOfBookSh=[];
  client.query(SQL2)
    .then(result=>{
      arrOfBookSh=result.rows;
    })
  return client.query(sql, saveId)
    .then(result => {
      res.render('./pages/books/show', { data: result.rows[0] , arrOfBookSh : arrOfBookSh })
    })
}
function saveToDB(req, res) {
  let ln;
  let title2 = req.body.title;
  let { author, title, isbn, image_url, description ,bookShelf} = req.body;
  // console.log(req.body);
  let SQL = 'INSERT INTO books (author,title,isbn,image_url,description,bookshelf) VALUES ($1,$2,$3,$4,$5,$6);';
  let safeValues = [author,title,isbn,image_url, description,bookShelf];
  let safetitle =[title2];
  const SQL2 = 'SELECT * FROM books WHERE title =$1;';
  client.query(SQL, safeValues)
    .then(() => {
    })
  return client.query(SQL2,safetitle)
    .then(result => {
      // console.log(result.rows[0].id);
      ln=result.rows[0].id;
      res.redirect(`/books/${ln}`);
    })
}
function newSearch (req, res) {
  res.render('./pages/searches/new');
}
app.post('/searches', (request, response) => {
  const inputt = request.body.search;
  const radio = request.body.radio;
  let url = `https://www.googleapis.com/books/v1/volumes?q=${inputt}+in${radio}:${inputt}`;
  superagent.get(url)
    .then(bookData => {
      let dataArray = bookData.body.items.map(value => {
        return new Book(value);
      })
      response.render('./pages/searches/show', { data: dataArray });
    })
    .catch((error) => {
      errorHandler(error, request, response);
    });
})
function Book(value) {
  this.image_url = value.volumeInfo.imageLinks.smallThumbnail ? value.volumeInfo.imageLinks.smallThumbnail : 'https://www.freeiconspng.com/uploads/book-icon--icon-search-engine-6.png';
  this.title = value.volumeInfo.title ? value.volumeInfo.title : 'No book with this title';
  this.author = value.volumeInfo.authors[0] ? value.volumeInfo.authors[0] : 'No books for this author';
  this.description = value.volumeInfo.description ? value.volumeInfo.description : 'No discription for this book';
  this.isbn = value.volumeInfo.industryIdentifiers[0].type + value.volumeInfo.industryIdentifiers[0].identifier ? value.volumeInfo.industryIdentifiers[0].type + value.volumeInfo.industryIdentifiers[0].identifier : '000000';
}
function errorHandler(err, req, res) {
  res.status(500).send(err);
}
function notFoundHandler(req, res) {
  res.status(404).send('This route does not exist!!');
}
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Listening on PORT ${PORT}`)
    })
  })
