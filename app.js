require('dotenv').config();
var express = require('express') 
  , http = require('http')
  , path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');  // JSON Web Token is use to encode useful information and stored into string token.
var atob = require('atob');
var mysql = require('mysql');
const Cryptr = require('cryptr');
const multer = require('multer');
const cryptr = new Cryptr('myTotalySecretKey');
var md5 = require('md5');
const nodemailer = require('nodemailer');
var config = require('./config');
const DIR = './uploads/';
const {CampaigneList,ViewCampaigneDetails,ChangeCampaigneStatus} = require('./routes/campaigne');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, DIR);
  },
  filename: (req, file, cb) => {
      const fileName = file.originalname.toLowerCase().split(' ').join('-');
      cb(null, new Date().valueOf()+'-' + fileName)
  }
});
var upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
      if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
          cb(null, true);
      } else {
          cb(null, false);
          return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
      }
  }
});
// Connect Database
var conn = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
  database : process.env.DB_NAME,
  multipleStatements: true
});
conn.connect(function(err) {
  if(err)
  return console.error('Database not connected!');
});
 
global.db = conn;
const app = express();
app.use('/uploads', express.static('uploads'));
// all environments
app.set('port', process.env.PORT || 4000);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(function(req, res, next) {
	  res.header("Access-Control-Allow-Origin", "*");
	  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	  next();
});
function getCleanUser(user) {
  if (!user) return null;
  return {
    email: user[0].email,
    frist_name: user[0].frist_name,
    last_name: user[0].last_name,
    id: user[0].id,
    user_image: user[0].user_image,
    mobile: user[0].mobile,
    status: user[0].user_status,
    login_type: user[0].login_type,
    user_type:user[0].user_type,
  };
}
// User Register
app.post('/user/register', function(req,res){

  if(req.body.type){
    var SocialUserId = '';
    if(req.body.type == 2){
      SocialUserId = req.body.response.userID;
    var user = {
        "frist_name":req.body.response.name,
        "email":req.body.response.email?req.body.response.email:'',
        "social_id":req.body.response.userID?req.body.response.userID:'',
        "user_image":req.body.response.picture.data.url?req.body.response.picture.data.url:'',
        "login_type":req.body.type,
        "creation_date":new Date().valueOf(),
      }
    }
    if(req.body.type == 3){
      var googleData = req.body.response.profileObj;
      SocialUserId = googleData.googleId;
      var user = {
        "frist_name":googleData.name,
        "email":googleData.email?googleData.email:'',
        "social_id":googleData.googleId?googleData.googleId:'',
        "user_image":googleData.imageUrl?googleData.imageUrl:'',
        "login_type":req.body.type,
        "creation_date":new Date().valueOf(),
      }
    }
    conn.query("SELECT * FROM user WHERE social_id = '"+SocialUserId+"'", function (err, response) {
      if(response == ''){
        conn.query('INSERT INTO user SET ?',user, function (error, results, fields) {
          if (error) {
            return res.json({
              "status": "false",
              "code":400,
              "message":"error ocurred"
            })
          } else {
            var secret = config.secret;
            var now = Math.floor(Date.now() / 1000),
              iat = (now - 10),
              expiresIn = 36000000,
              expr = (now + expiresIn),
              notBefore = (now - 10),
              jwtId = Math.random().toString(36).substring(7);
            var payload = {
              iat: iat,
              jwtid : jwtId,
              audience : 'TEST',
              data : response
            };
            jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn : expiresIn}, function(err, token) {
              if(err){
                res.json({
                  "status": "false",
                  "code":401,
                  "message":"Could not create token.",
                });
                
                return false;
              }
              else{
                if(token != false){
                  res.header();
                  res.json({
                      "status": "true",
                      "token" : token,
                      "code":200,
                      "message":"user registered sucessfully",
                      'data': getCleanUser(response),
                    });
                  res.end();
                }
                else{
                  res.json({
                    "status": "false",
                    "code":401,
                    "message":"Could not create token.",
                  });
                  res.end();
                }
              }
            });
            }
        });
      }else{
        const sql = "UPDATE 'user' SET ? WHERE social_id = ?";
        conn.query(sql,[user, SocialUserId], function (error, results, fields) {
          var secret = config.secret;
            var now = Math.floor(Date.now() / 1000),
              iat = (now - 10),
              expiresIn = 36000000,
              expr = (now + expiresIn),
              notBefore = (now - 10),
              jwtId = Math.random().toString(36).substring(7);
            var payload = {
              iat: iat,
              jwtid : jwtId,
              audience : 'TEST',
              data : response
            };
            jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn : expiresIn}, function(err, token) {
              if(err){
                res.json({
                  "status": "false",
                  "code":401,
                  "message":"Error occurred while generating token",
                });
                return false;
              }
              else{
                if(token != false){
                  res.header();
                  res.json({
                      "status": "true",
                      "token" : token,
                      "code":200,
                      "message":"user registered sucessfully",
                      'data': getCleanUser(response),
                    });
                  res.end();
                }
                else{
                  res.json({
                    "status": "false",
                    "code":401,
                    "message":"Could not create token",
                  });
                  res.end();
                }
              }
            });
        });
      }
    });
  }else{
  const password = req.body.password;
  var user = {
    "frist_name":req.body.frist_name,
    "last_name":req.body.last_name,
    "email":req.body.email,
    "mobile":req.body.mobile,
    "password":md5(password),
    "creation_date":new Date().valueOf(),
  }
    conn.query("SELECT * FROM user WHERE email = '"+req.body.email+"'", function (err, response) {
      if(response == ''){
        conn.query('INSERT INTO user SET ?',user, function (error, results, fields) {
          if (error) {
            return res.json({
              "status": "false",
              "code":400,
              "message":"error ocurred"
            })
          } else {
            res.json({
              "status": "true",
              "code":200,
              "message":"user registered sucessfully",
            });
            }
        });
      }else{
        return res.json({
          "status": "false",
          "code":201,
          "message":"Email address already used!"
            });
      }
    });
  }
  
})

// User Login
app.post('/user/signin', function(req,res){
  const email = req.body.email;
  const password = req.body.password;
  conn.query("SELECT * FROM user WHERE email = '"+email+"' AND password = '"+md5(password)+"'", function (err, response) {
      if(response !=''){
        var data = JSON.stringify(response);
        var secret = config.secret;
         var now = Math.floor(Date.now() / 1000),
           iat = (now - 10),
           expiresIn = 36000000,
           expr = (now + expiresIn),
           notBefore = (now - 10),
           jwtId = Math.random().toString(36).substring(7);
         var payload = {
           iat: iat,
           jwtid : jwtId,
           audience : 'TEST',
           data : response
         };
         jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn : expiresIn}, function(err, token) {
          if(err){
            res.json({
              "status": "false",
              "code":401,
              "message":"Error occurred while generating token",
            });
            return false;
          }
           else{
            if(token != false){
              res.header();
              res.json({
                  "status": "true",
                  "token" : token,
                  "code":200,
                  "message":"user logged in sucessfully",
                  'data':getCleanUser(response),
                });
              res.end();
            }
            else{
              res.json({
                "status": "false",
                "code":401,
                "message":"Could not create token",
              });
              res.end();
            }
           }
        });
      }else{
        res.json({
          "status": "false",
          "code":200,
          "message":"Username or Password is Wrong."
          });
          res.end();
      }
    });
})
// User Login
app.post('/user/forgotPassword', function(req,res){
  const email = req.body.email;
  conn.query("SELECT * FROM user WHERE email = '"+email+"' AND login_type = '1'", function (err, response) {
      if(response !=''){
        let randomPass = Math.random().toString(36).substring(7);
        var updateData = {
          "password":md5(randomPass),
        }
        const sql = "UPDATE user SET ? WHERE id = ?";
        conn.query(sql,[updateData, response[0].id], function (error, results, fields) {
          if(results.affectedRows == 1 ){
            let transport = nodemailer.createTransport({
              host: 'mail.glasier.in',
              port: 465,
              auth: {
                user: 'kamal@glasier.in',
                pass: '$!<@^^@l2020'
              }
            });
            const message = {
              from: 'info@glasier.in', 
              to: email, 
              subject: 'Nexstack - Reset Password', 
              html:  `<h4>Reset Password Email</h4> <p>We have sent you this email in response to your request to reset your password on Nexstack. After you reset your password to change to your own password.</p>
              <p>Email: ${email} </p><p>Password: ${randomPass}</p>`
            };
            transport.sendMail(message, function(err, info) {
              if (err) {
                res.json({
                  "status": "false",
                  "code":200,
                  "message":"oops! something want wrong. please try again!."
                  });
                  res.end();
              }else{
                res.json({
                  "status": "true",
                  "code":200,
                  "message":"your password has been sent your register email id. please check."
                  });
                  res.end();
              }
            });
        }
        });
      }else{
        res.json({
          "status": "false",
          "code":200,
          "message":"Email address not exist!."
          });
          res.end();
      }
    });
})

// Forgot Password

// Create campaigne

app.post('/user/createCampaigne', upload.any('image'), function(req,res){

  const url = req.protocol + '://' + req.get('host');
  const collect_lead = [];
  const channelData = [];
  var campaigneData = [];
  if(req.body.info_email){
    collect_lead.push('email');
  }
  if(req.body.info_name){
    collect_lead.push('name');
  }
  if(req.body.info_phone){
    collect_lead.push('phone');
  }
  if(req.body.info_other){
    collect_lead.push(req.body.info_other);
  }
  if(req.body.ageFrom && req.body.ageTo ){
    ageRange = req.body.ageFrom +' - '+req.body.ageTo;
  }
  // For upload ad images
  var instaAdImage;
  var fbAdImage;
  req.files.forEach(k => {
    if(k.fieldname =='FbAdImg'){
      fbAdImage = k.filename;
    }
    if(k.fieldname =='InstaAdImg'){
      instaAdImage = k.filename;
    }
  })
  var campaigneData = {
    "user_id":req.body.loggedinUser,
    "media_objective":req.body.mediaObject,
    "gender":req.body.gender,
    "language":req.body.language,
    "age":ageRange,
    "country":req.body.country,
    "city":req.body.city,
    "behaviour":req.body.behaviour,
    "start_date":req.body.start,
    "end_date":req.body.end, 
    "total_budget":req.body.budget,
    "amount":req.body.budget,
    "created_on":new Date().valueOf(),
  }
  if(req.body.chan_facebook == 'true'){
    channelData.push('facebook');
    campaigneData.fb_page_id = req.body.fbUserId,
    campaigneData.fb_profile_image = req.body.fbUserImage,
    campaigneData.fb_page_name = req.body.fbPageName,
    campaigneData.fb_message = req.body.fbAdData.message;
    campaigneData.fb_heading1 = req.body.fbAdData.heading1;
    campaigneData.fb_heading2 = req.body.fbAdData.heading2;
    campaigneData.fb_image    = fbAdImage;
    campaigneData.fb_link = req.body.fbAdData.url;
  }
  if(req.body.chan_google == 'true'){
    channelData.push('google');
    campaigneData.google_heading1 = req.body.googleAdData.Heading1,
    campaigneData.google_heading2 = req.body.googleAdData.Heading2;
    campaigneData.google_heading3 = req.body.googleAdData.Heading3;
    campaigneData.google_url = req.body.googleAdData.url;
    campaigneData.google_message1    = req.body.googleAdData.message1;
    campaigneData.google_message2 = req.body.googleAdData.message2;
  }
  if(req.body.chan_instagram == 'true'){
    channelData.push('instagram');
    campaigneData.insta_page_name = '';
    campaigneData.instagram_page_id = '';
    campaigneData.insta_message = req.body.instaAdData.message;
    campaigneData.insta_link = req.body.instaAdData.url;
    campaigneData.insta_image = instaAdImage;
  }
  if(req.body.chan_youtube == 'true'){
    channelData.push('youtube');
    campaigneData.youtube_link = req.body.YouTubeAdData.youtube_link;
  }
  
  campaigneData.channel = channelData.join();

if(req.body.mediaObject == 1){
  campaigneData.platform = req.body.platform;
  if(req.body.platform == 'WhatsApp'){
    campaigneData.handle = req.body.whatsapp_number;
  }else{
    campaigneData.handle = req.body.handle;
  }
  
}
if(req.body.mediaObject == 2){
  campaigneData.url = req.body.url;
}
if(req.body.mediaObject == 3){
  campaigneData.phone_number = req.body.phone_number;
}
if(req.body.mediaObject == 4){
  campaigneData.store_name = req.body.store_name;
}
if(req.body.mediaObject == 5){
  campaigneData.collect_lead = collect_lead?collect_lead.join():'';
}
if(req.body.mediaObject == 8){
  campaigneData.store_name = req.body.brand_name;
}
if(req.body.mediaObject == 9){
  campaigneData.ios_link = req.body.ios_link;
  campaigneData.android_link = req.body.android_link;
}
if(req.body.mediaObject == 10){
  campaigneData.url = req.body.url;
}

const intrest = JSON.parse(JSON.stringify(req.body.intrest));
const siteLink = JSON.parse(JSON.stringify(req.body.googleAdData.siteLink));

  conn.query('INSERT INTO campaign SET ?',campaigneData, function (error, results, fields) {
    
    if (error) {
      return res.json({
        "status":"false",
        "code":400,
        "message":"error ocurred"
      })
    } else {
      if(results.affectedRows == 1 ){
        intrest.forEach(element => { 
          var intrestData ={
            "user_id":req.body.loggedinUser,
            "campaign_id":results.insertId,
            "category":element.cat,
            "sub_category":element.key,
            "created_at":new Date().valueOf(),
          }
          conn.query('INSERT INTO user_interest SET ?',intrestData, function (error, results, fields) {});
        });
        if(req.body.chan_google){
          Object.keys(siteLink).forEach(k => { 
            var intrestSiteLinkData ={
              "user_id":req.body.loggedinUser,
              "campaign_id":results.insertId,
              "site_heading":siteLink[k].siteHeading,
              "description1":siteLink[k].description1,
              "description2":siteLink[k].description2,
              "site_url":siteLink[k].siteUrl,
              "created_at":new Date().valueOf(),
            }
            if(intrestSiteLinkData.site_heading){
              conn.query('INSERT INTO google_sitelinks SET ?',intrestSiteLinkData, function (error, results, fields) {});
            }
          });
        }
      }
      return res.json({
        "status":"true",
        "code":200,
        "campaign_id":results.insertId,
        "message":"campaign created sucessfully",
          });
      }
  });
})
// Campaigne
// upload ad image
    app.post('/user/uploadAdimage', upload.any('image'), function(req,res){
      var imageData = {};
      req.files.forEach(k => {
        if(k.fieldname =='FbAdImg'){
          imageData.fb_image = k.filename;
        }
        if(k.fieldname =='InstaAdImg'){
          imageData.insta_image = k.filename;
        }
      })

      const sql = "UPDATE campaign SET ? WHERE campaign_id = ?";
      conn.query(sql,[imageData, req.body.campaign_id], function (error, results, fields) {
        if (error) {
          return res.json({
            "status":"false",
            "code":400,
            "message":"error ocurred"
          })
        } else {
          return res.json({
            "code":200,
              });
          }
      });
    })
app.post('/user/CampaigneList', CampaigneList);
app.post('/user/ViewCampaigneDetails', ViewCampaigneDetails);
app.post('/user/ChangeCampaigneStatus', ChangeCampaigneStatus);
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});