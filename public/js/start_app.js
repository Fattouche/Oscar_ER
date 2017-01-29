var project;

function start() {
    var xmlHttp_start = new XMLHttpRequest();
    xmlHttp_start.onreadystatechange = function() { 
        if (xmlHttp_start.readyState == 4 && xmlHttp_start.status == 200)
            console.log(xmlHttp_start.responseText);
            window.location.href = "/graph.html";
    }

    var p_host, p_port, p_user, p_password, p_database;
    var projectSelected = false;
   // var multiple = false;

    var table = document.getElementById("tablebody");
    for(var i = 0; i < table.rows.length; i++){
      if(table.rows[i].cells[0].childNodes[0].checked == true && projectSelected == false){
        p_host = project["projectData"][i]["host"];
        p_port = project["projectData"][i]["port"];
        p_user = project["projectData"][i]["user"];
        p_password = project["projectData"][i]["password"];
        p_database = project["projectData"][i]["database"];
        projectSelected = true;
      }
      else if(table.rows[i].cells[0].childNodes[0].checked == true && projectSelected == true){
        alert("Select a single project to start")
        return;
      }   
    }

    if(projectSelected == false){
      alert("Select a single project or create a new project to start")
      return;
    }


    xmlHttp_start.open("POST", "/start", true); // true for asynchronous 
    xmlHttp_start.setRequestHeader('Content-Type', 'application/json');
    xmlHttp_start.send(JSON.stringify({host: p_host,     // currently theres no error handling if these values 
                                       port: p_port,
                                       user: p_user,
                                       password: p_password,
                                       database: p_database}));
    
    var sb = document.getElementById("startbutton");
    sb.innerHTML = "Mining Database..."
    sb.onclick = ""
}//end start()


function project_init(){
  var xmlHttp_getProjects = new XMLHttpRequest();
    xmlHttp_getProjects.onreadystatechange = function() { 
        if (xmlHttp_getProjects.readyState == 4 && xmlHttp_getProjects.status == 200)
            project = JSON.parse(xmlHttp_getProjects.responseText);
            createTable();
    }
  xmlHttp_getProjects.open("GET", "/getprojects", true);
  xmlHttp_getProjects.send();

}

function createTable(){
  console.log(project);
  var table = document.getElementById("tablebody");
  //clear the table 
  while(table.hasChildNodes())
      table.removeChild(table.firstChild);

    //create a new row for each project 
  for(var i = 0; i < Object.keys(project["projectData"]).length; i++){
   // console.log(project["projectData"][i]["port"])
    var newrow = table.insertRow(i);
    if(i%2 == 0)
      newrow.setAttribute("class","alt");

    var newSelect = newrow.insertCell(0);
    var newName = newrow.insertCell(1);
    newName.innerHTML = project["projectData"][i]["name"];

    var x = document.createElement("INPUT"); 
    x.setAttribute("type", "checkbox");
    newSelect.appendChild(x);
  } 
}//end createTable()


function deleteProject(){
  var table = document.getElementById("tablebody");

  for(var i = 0; i < table.rows.length; i++){
    //if row is checked, delete the item from the project object and redraw the table
    if(table.rows[i].cells[0].childNodes[0].checked == true){
      project["projectData"].splice(i,i+1);
    }
  }
  createTable();
  //RESEND DATA TO BACKEND HERE
}

function createProject(){
    if(document.getElementById("newProjName").value.length == 0 || document.getElementById("newProjHost").value.length == 0 || document.getElementById("newProjUser").value.length == 0 || document.getElementById("newProjData").value.length == 0 || document.getElementById("newProjPort").value.length == 0){
      alert("Fill required feilds: Name, Host, User, Database, Port");
      return;
    }
    var newProj = {"name":document.getElementById("newProjName").value, "host":document.getElementById("newProjHost").value, "user":document.getElementById("newProjUser").value, "password":document.getElementById("newProjPass").value, "database":document.getElementById("newProjData").value, "port":document.getElementById("newProjPort").value}
    project["projectData"].push(newProj);

    //RESEND DATA TO BACKEND HERE

    createTable();
}

function editProject(){
  var table = document.getElementById("tablebody");
  var projectSelected = false;
  var projectIndex = 0;

  for(var i = 0; i < table.rows.length; i++){
      if(table.rows[i].cells[0].childNodes[0].checked == true && projectSelected == false){
          projectIndex = i;
          projectSelected = true;
      }
      else if(table.rows[i].cells[0].childNodes[0].checked == true && projectSelected == true){
        alert("Select a single project to edit")
        return;
      }   
  }
  if(!projectSelected){
    alert("Select a single project to edit")
    return;
  }

  var newName = prompt("Please enter a new name for this project");
  console.log(newName);

  if(newName == ""){
    alert("Please enter a valid name");
    return;
  }

  project["projectData"][projectIndex]["name"] = newName;
  
  //RESEND DATA TO BACKEND HERE

  createTable();
}



