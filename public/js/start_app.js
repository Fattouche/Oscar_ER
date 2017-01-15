function start() {
    var xmlHttp_start = new XMLHttpRequest();
    xmlHttp_start.onreadystatechange = function() { 
        if (xmlHttp_start.readyState == 4 && xmlHttp_start.status == 200)
            console.log(xmlHttp_start.responseText);
            window.location.href = "/graph.html";
    }
    xmlHttp_start.open("GET", "/start", true); // true for asynchronous 
    xmlHttp_start.send(null);
    var sb = document.getElementById("startbutton");
    sb.innerHTML = "Mining Database..."
    sb.onclick = ""
  }