var player_ip;
var url;

chrome.storage.sync.get({player_ip: ''}, function(items) {
    console.log(items.player_ip);
    player_ip = items.player_ip;
    url = 'http://' + player_ip + ':49152/upnp/control/rendertransport1'
    
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    
    let service = 'AVTransport';
    let action = 'GetInfoEx';
    let detaildict = {};

    if (request === "getStatus") {
        action = 'GetInfoEx';

    } else if (request === 'Pause') {
        action = request;
    } else if (request === 'Play') {
        action = request;
        detaildict = {'Speed': '1'};
    } else if (request === 'Next') {
        action = request;
    } else if (request === 'Prev') {
        action = 'Previous';
    }
    
    let control = "";
    let schema = "";
    if (service === 'AVTransport') {
        control = "/upnp/control/rendertransport1"
        schema = "schemas-upnp-org"
    } else if (service === 'RenderingControl') {
        control = "/upnp/control/rendercontrol1"
        schema = "schemas-upnp-org"
    } else if (service === 'PlayQueue') {
        control = "/upnp/control/PlayQueue1"
        schema = "schemas-wiimu-com"
    }    
        
    url = `http://${player_ip}:49152${control}`

    let detail = ""
    for(var key in detaildict) {
        value = detaildict[key];
        detail = detail + `<${key}>${value}</${key}>`
    }    
        
    let payload =`<?xml version="1.0" encoding="utf-8"?> 
    <s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/"> 
        <s:Body> 
            <u:${action} xmlns:u="urn:${schema}:service:${service}:1"> 
                <InstanceID>0</InstanceID> 
                ${detail} 
            </u:${action}> 
        </s:Body> 
    </s:Envelope>`
    
    let headers = {'Content-Type' : 'text/xml; charset=utf-8', 
              'SOAPAction' : `"urn:${schema}:service:${service}:1#${action}"`}
    
    fetch(url, {body:payload, 
                method:'POST',
                headers:headers,
                cache: 'no-cache',
                credentials: 'same-origin'
               })
    .then(response => response.text())
    .then(response => sendResponse(response))
    .catch(function (err) {
        console.log('error: ' + err);
        fetch(url, {body:payload, 
                    method:'POST',
                    headers:headers,
                    cache: 'no-cache',
                    credentials: 'same-origin'
                   })
        .then(response => response.text())
        .then(response => sendResponse(response))
        .catch(function (err) {
            console.log('error: ' + err);
        });    
    });
    
  return true
})

