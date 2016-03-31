# thing-if trigger api, refers from http://docs.kii.com/en/guides/thingifsdk/android/trigger/
curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer FBAO3yPnV7js9SlUF5md2nc4wmtFZOyLCNmXT5rEw7s" -d '{
    "triggersWhat": "SERVER_CODE",
    "predicate":{
        "triggersWhen":"CONDITION_TRUE",
        "eventSource":"STATES",
        "condition":{
            "type":"range",
            "field":"Lightness",
            "upperLimit":50
        }
    },
    "serverCode":{
        "endpoint":"sendCommand",
        "executorAccessToken": "iYs-3V7eUyLr1U88cii4Gqm2bxwAgC01tri2S8T2Gr0",
        "parameters":{
            "actions": [{
                "changeColor": {
                    "Red": 0,
                    "Green": 0,
                    "Blue": 0,
                    "White": 50
                }}],
            "issuer": "user:727f20b00022-8d18-5e11-cc4f-00af4e2c",
            "schema": "LED",
            "schemaVersion": 1,
            "target": "THING:th.9980daa00022-34e9-5e11-b85f-0750cb9c"
        }
    },
    "title":"turn on light"
}   ' "https://api-jp.kii.com/thing-if/apps/9b467d14/targets/THING:th.727f20b00022-8d18-5e11-685f-022ecf5b/triggers"
