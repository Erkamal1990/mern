const jwt = require('jsonwebtoken');
var mysql = require('mysql');
var config = require('../config');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Connect Database
var conn = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database : process.env.DB_NAME
});
module.exports = {
    // Campaigne List Function (API)
    CampaigneList: (req, res) => {
        var token = req.headers['x-access-token'];
        if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
        jwt.verify(token, config.secret, function(err, decoded) {
            if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });

            conn.query("SELECT * FROM campaign", function (err, response, fields) {
            if(response == ''){
                return res.json({
                "results": "false",
                "code":200,
                "message":"no any record found!"
                });
            }else{
                const arr = response;
                return res.json({
                    "results": "true",
                    "code":200,
                    "message":"",
                    'data': response,
                    });
            }
            });
        });
    },
    ViewCampaigneDetails: (req, res) => {
        var token = req.headers['x-access-token'];
        if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });
        jwt.verify(token, config.secret, function(err, decoded) {
            if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
            var campaignId = req.body.campaigne_id;
            var campaignQuery = "SELECT * FROM campaign WHERE campaign_id = "+campaignId+";";
                conn.query(campaignQuery, function (err, response) {
                if(response == ''){
                    return res.json({
                    "results": "false",
                    "code":200,
                    "message":"no any record found!"
                    });
                }else{
                    conn.query("SELECT * FROM user_interest WHERE campaign_id = "+campaignId+" ORDER BY id ASC", function (err, result) {
                        if(result == ''){
                            return res.send({
                                "results": "true",
                                "code":200,
                                "message":"campaigne list",
                                'data': response,interest:result,
                            });
                        }else{
                            return res.send({
                                "results": "true",
                                "code":200,
                                "message":"campaigne list",
                                'data': response,interest:result,
                            });
                        }
                    });
                }
            });
        });
    },
};