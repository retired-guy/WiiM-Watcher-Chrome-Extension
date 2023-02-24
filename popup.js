let parser = new DOMParser();
let currentTransportState = "PLAYING";
let coverurl = "";

function unEscape(a) {
    a = a.replace(/&lt;/g , "<");	 
    a = a.replace(/&gt;/g , ">");     
    a = a.replace(/&quot;/g , "\"");  
    a = a.replace(/&#39;/g , "\'");   
    a = a.replace(/&amp;/g , "&");
    return a;
}

function getCoverart(url) {
    if(url === coverurl) {
        return;
    } else {
        coverurl = url;
    }
    
    fetch(url)
        .then(response => response.blob())
        .then(imageBlob => {
        let img = document.createElement('img');
        img.src = window.URL.createObjectURL(imageBlob);
        img.width = "300";
        img.height = "300";
        let ca = document.getElementById("coverart");
        ca.innerHTML = "";
        ca.appendChild(img);
        })
        .catch( function(error) {
            console.log(error);
        });
}

function getMeta() {
    
  chrome.runtime.sendMessage('getStatus', (response) => {  
    b = parser.parseFromString(response, "text/xml");
    currentTransportState = b.getElementsByTagName("CurrentTransportState")[0].innerHTML;
    console.log(currentTransportState);
    if(currentTransportState === 'PLAYING') {
        document.getElementById("playpause").src = "icons/pause.svg";
    } else {
        document.getElementById("playpause").src = "icons/play.svg";
    }    
      
    let meta = b.getElementsByTagName("TrackMetaData")[0].innerHTML;
    displayMeta(meta);  
      
  });  
    
}

function displayMeta(a){
    meta = unEscape(a)
    let title = "";
    let creator = "";
    let subtitle = "";
    let artist = "";
    let album = "";
    let url = "";
    let channel = "0";
    let rp = {};
    let isRp = false;
    
    b = parser.parseFromString(meta,"text/xml");
    try {
        title = b.getElementsByTagName("dc:title")[0].innerHTML;
        document.getElementById("title").innerHTML = title;
        try {
            creator = b.getElementsByTagName("dc:creator")[0].innerHTML;
        } catch(error) {creator="";}
        
        if (title.startsWith("Radio Paradise") || creator === "Radio Paradise") {
            isRp = true;
        }
    } catch(error) {console.log(error)}
    
    try {
        subtitle = b.getElementsByTagName("dc:subtitle")[0].innerHTML;
        document.getElementById("subtitle").innerHTML = subtitle;
    } catch(error) {subtitle="";}
    
    try {
        artist = b.getElementsByTagName("upnp:artist")[0].innerHTML;
        document.getElementById("artist").innerHTML = artist;
    } catch(error) {artist="";}

    try {
        album = b.getElementsByTagName("upnp:album")[0].innerHTML;
        document.getElementById("album").innerHTML = album;
    } catch(error) {album="";}

    try {
        if (isRp === false) {
            url = b.getElementsByTagName("upnp:albumArtURI")[0].innerHTML;
            getCoverart(url);
        }    
    }    
    catch (error) {console.log(error)}   
    
    let depth = 16;
    try {
        depth = b.getElementsByTagName('song:format_s')[0].innerHTML;
        if(depth > 24) depth=24;
    }    
    catch (error) {console.log(error)}   
    
    let rate = 44.1;
    try {
        rate = b.getElementsByTagName('song:rate_hz')[0].innerHTML / 1000;
    }    
    catch (error) {}   

    let actualQuality = "";
    try {
        actualQuality = b.getElementsByTagName('song:actualQuality')[0].innerHTML;
        if(actualQuality === 'HD')
            depth = 16;

        if(actualQuality === 'LOSSLESS')
            actualQuality = "HiFi";
    }    
    catch (error) {}   

    let bitrate = "";
    try {
        bitrate =b.getElementsByTagName('song:bitrate')[0].innerHTML;
        if (isNaN(bitrate)) {
            bitrate = "";
        }
        else {
            bitrate = bitrate + "kbps";
        }
        
    }
    catch (error) {}   
    
    el = document.getElementById("info");
    el.innerHTML = `${depth}/${rate}&nbsp;&nbsp;&nbsp;&nbsp;${bitrate}&nbsp;&nbsp;&nbsp;&nbsp;${actualQuality}`;
    if (isRp === true) {
        if (title.includes("Mellow"))
            channel = "1";
        else if (title.includes("Rock"))
            channel = "2";
        else if (title.includes("World"))
            channel = "3";
        
        fetch("https://api.radioparadise.com/api/now_playing?chan=" +channel)
        .then(response => response.json())
        .then(rp => {
            artist = rp.artist;
            document.getElementById("artist").innerHTML = artist;
            album = rp.album;
            document.getElementById("album").innerHTML = album;
            title = rp.title;
            document.getElementById("subtitle").innerHTML = title;

            url = rp.cover;
            getCoverart(url);
        })
    }
};    

chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {  
    setInterval(getMeta,1000);
    getMeta();
});

document.getElementById("prev").addEventListener("click",function(){

    chrome.runtime.sendMessage('Prev',function(response) { });
});

document.getElementById("playpause").addEventListener("click",function(){
    let cmd = 'Pause';
    if(currentTransportState != 'PLAYING') {
        cmd = 'Play';
    }    

    chrome.runtime.sendMessage(cmd,function(response) { });
});

document.getElementById("next").addEventListener("click",function(){

    chrome.runtime.sendMessage('Next',function(response) { });
    getMeta();
});
