#!/usr/bin/env node

var Client = require('./lib/gw-mqtt-client.js');
var BleCentral = require('./lib/ble-central.js');
var bleCentral = new BleCentral();

// set log level to see the information
var winston = require('winston');
winston.level = 'debug';
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {'timestamp':true});
// also log to file
winston.add(winston.transports.File, { filename: 'ble-converter.log', timestamp: true });

// set winston to bleCentral
bleCentral.setWinston(winston);

var nconf = require('nconf');

// init vars from config.json
nconf.file({ file: 'config.json' });
var appId = nconf.get('kii_app:app_id');
var site = nconf.get('kii_app:site');
var mqttHost = nconf.get('agent:mqtt:host');
var port = parseInt(nconf.get('agent:mqtt:port'));
var converterId = nconf.get('converter_id');

var client = null;
var endnodeMap = {};

// sart bleCentral
bleCentral.start();

var clientId = site+"/"+appId+"/c/"+converterId;
options = {
  port: port,
  clientId: clientId,
  keepalive: 600,
  clean:true,
  protocolVersion: 4
}
client = Client(appId, site).connect("tcp://"+mqttHost, options);

// set winston to client
client.setWinston(winston);

client.on('disconnect', function(){
  winston.debug("disconnect from gw agent");
});

client.on('commands', function(vid, commands){
  winston.debug("commands:"+commands.commandID+" for "+vid);

  bleCentral.handleCommands(vid, commands, function(err, commandResults){
    if(err !== null && err !== undefined){
      winston.error("fail to handle commands:"+err);
      return;
    }
    client.updateCommandResults(vid, commandResults, function(err){
      winston.debug("update command results succeeded");
      bleCentral.getStates(vid, function(err, state){
        if (err === null || err === undefined) {
          winston.debug("state of endnode:"+JSON.stringify(state));
          client.updateStates(vid, state, function(err){
            if (err !== null && err !== undefined){
              winston.error("update state of endnode faild:"+err);
            }else{
              winston.debug("update state of endnode succeeded");
            }
          });
        }else {
          winston.error("get state of endnode failed:"+err);
        }
      });
    });
  });
});

client.on('connect', function(){
  winston.debug('connected to gateway agent');
});

// handle bleCentral events
bleCentral.on('endnodeConnect', function(vid){
  client.subscribeCommands(vid, function(err){
    if (err !== null && err !== undefined){
      winston.error("subscribe for commands of endnode("+ vid+") failed:"+err);
    }else{
      winston.debug("subscribe for commands of endnode("+ vid+") succeeded.");
    }
  });
  client.updateEndnodeConnection(vid, true, function(err){
    if (err !== null && err !== undefined){
      winston.error("report connection of endnode("+ vid+") failed:"+err);
    }else{
      winston.debug("eport connection of endnode("+ vid+") succeeded.");
    }
  });
});

bleCentral.on('endnodeDisconnect', function(vid){
  //TODO: unsubscribe

  //report disconnection of endnode
  client.updateEndnodeConnection(vid, false, function(err){
    if (err !== null && err !== undefined){
      winston.error("report disconnection of endnode("+ vid+") failed:"+err);
    }else{
      winston.debug("report disconnection of endnode("+ vid+") succeeded.");
    }
  });
});

bleCentral.on('endnodeUpdateStates', function(vid, states){

  winston.debug("state of endnode:"+JSON.stringify(states));
  client.updateStates(vid, states, function(err){
    if (err !== null && err !== undefined){
      winston.error("update state of endnode faild:"+err);
    }else{
      winston.debug("update state of endnode succeeded");
    }
  });
});
