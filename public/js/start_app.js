function start() {
    var xmlHttp_start = new XMLHttpRequest();
    xmlHttp_start.onreadystatechange = function() { 
        if (xmlHttp_start.readyState == 4 && xmlHttp_start.status == 200)
            console.log(xmlHttp_start.responseText);
            window.location.href = "/graph.html";
    }
    xmlHttp_start.open("POST", "/start", true); // true for asynchronous 
    xmlHttp_start.setRequestHeader('Content-Type', 'application/json');
    xmlHttp_start.send(JSON.stringify({host: "localhost",     // Send real data instead of default here.
                                       port: 3306,
                                       user: "root",
                                       password: "password",
                                       database: "northwind"}));


    var sb = document.getElementById("startbutton");
    sb.innerHTML = "Mining Database..."
    sb.onclick = ""
  }