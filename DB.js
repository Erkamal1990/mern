// var mysql = require('mysql');
// // Connect Database
// var conn = mysql.createConnection({
//     host:'localhost',
//     user:'root',
//     password:'',
//     database:'node'
// });
// // Create Database
// conn.connect(function(error){
//     if(error) throw error;
//     console.log('connected!');
//     var sql = "create table admin (id int,name VARCHAR(32),email VARCHAR(50),password VARCHAR(225), status int)";
//     conn.query(sql,function(error,result){
//         if(error) throw error;
//         console.log(result);
//     })
// })