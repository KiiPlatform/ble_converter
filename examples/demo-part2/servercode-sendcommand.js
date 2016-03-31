function sendCommand(params, context, done){

  // target of command to send
  var target = params.target;
  var actions = params.actions;
  var issuer = params.issuer;
  var schema = params.schema;
  var schemaVersion = params.schemaVersion

  // validate params
  var validParams = true;
  var validResults = [];
  if(target === undefined || target === null) {
    validParams = false;
    validResults.push("No target provided!")
  }
  console.log("actions:"+actions);
  if(actions === undefined || actions === null) {
    validParams = false;
    validResults.push("No actions provided!")
  }

  if(issuer === undefined || issuer === null) {
    validParams = false;
    validResults.push("No issuer provided!")
  }
  if(schema === undefined || schema === null) {
    validParams = false;
    validResults.push("No schema provided!")
  }
  if(schemaVersion === undefined || schemaVersion === null) {
    validParams = false;
    validResults.push("No schemaVersion provided!")
  }

  if(!validParams) {
    done({"Invalid params": validResults})
  }

  var appId = context.getAppID();
  var appKey = context.getAppKey();
  var adminToken = context.getAppAdminContext()._getToken();

  // generate baseURL of thing if api
  var thingIfBaseUrl = (Kii.getBaseURL()+"/").replace("api/", "thing-if");

  // thingif api to post command
  var targetUrl = thingIfBaseUrl + "/apps/" + appId + "/targets/" + target + "/commands";

  // post command
  $.ajax({
    url: targetUrl,
    type: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + adminToken
    },
    data: JSON.stringify({
      "actions": actions,
      "issuer": issuer,
      "schema": schema,
      "schemaVersion": schemaVersion
    }),
    success: function(body) {
      // doing something with body
      done({"Success": body});
    },
    error: function(msg) {
      done({"Fail": msg});
    }
  });

}
