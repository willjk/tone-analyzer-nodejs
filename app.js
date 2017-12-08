/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

require('dotenv').load({silent: true});

var express = require('express');
var Promise = require('bluebird');
var app = express();
var ToneAnalyzerV3 = require('watson-developer-cloud/tone-analyzer/v3');

// Bootstrap application settings
require('./config/express')(app);

// Create the service wrapper
var toneAnalyzer = new ToneAnalyzerV3({
  // If unspecified here, the TONE_ANALYZER_USERNAME and TONE_ANALYZER_PASSWORD environment properties will be checked
  // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
  username: '11d2cfa9-6f8f-483c-b422-c3488763fff1',
  password: 'KZCK04ESNVye',
  version_date: '2017-09-21'
});

app.get('/', function(req, res) {
  res.render('index', {
    bluemixAnalytics: !!process.env.BLUEMIX_ANALYTICS,
  });
});

app.post('/api/tone', function(req, res, next) {
  toneAnalyzer.tone(req.body, function(err, data) {
    if (err) {
      return next(err);
    }
    return res.json(data);
  });
});

app.post('/api/tones', function(req, res, next) {
  var promises = [];
  for(var i = 0, len = req.body.tones.length;i < len; i++) {
    promises.push(getTone(req.body.tones[i], i));
  }
  Promise.all(promises)
  .then(function(results){
    res.json(results);
  })
  .catch(function(err){
    return next(err);
  })
});

function getTone(text, index) {
  return new Promise(function(resolve, reject) {
    if(!text || text.length == 0) {
      process.nextTick(function(){
        resolve({
          index: index,
          data: {}
        });
      })
    } else {
      toneAnalyzer.tone({text: text}, function(err, data) {
        if(err) {
          return reject(err);
        }
        return resolve({
          index: index,
          data: data
        });
      })
    }
    
  });
}

// error-handler application settings
require('./config/error-handler')(app);

module.exports = app;
