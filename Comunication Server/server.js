var io = require('socket.io').listen(90, { log: false });
var sys = require('sys');
var net = require('net');
var fs = require('fs');
var base64 = require('b64');
 var email = require("mailer");
var mysql = require('mysql');
var TEST_DATABASE = 'powercomputing';
var client_bd = mysql.createClient({
    user: 'optima',
    password: 'optima2power',
    host: 'code.dei.estt.ipt.pt',
    port: '3306'
});
var last = 0;
var count = 0;
client_bd.host = '193.137.5.49';
client_bd.query('USE '+TEST_DATABASE);

function replaceAll(string, token, newtoken) {
  while (string.indexOf(token) != -1) {
    string = string.replace(token, newtoken);
  }
  return string;
}

io.sockets.on('connection', function (socket) {

	var client = new Client(socket);
	clients.push(client);

	/* get problem detais and insert new problem on tblProblems */
	
    socket.on('start', function (data) {
    	client_bd.query('USE '+TEST_DATABASE);
      console.log(data);
      var algorithm = data.algorithm[0] + ", Parameters: " + data.algorithm[1] + ", Solver Parameters: " + data.algorithm[2];
      var mutation = data.mutation[0] + ", Parameters: " + data.mutation[1];
      var selection =  data.selection[0] + ", Parameters: " + data.selection[1];
      var recombination = data.recombination[0] + ", Parameters: " + data.recombination[1];
      var replacement = data.replacement[0] + ", Parameters: " + data.replacement[1];
      var now = new Date();
      var date = now.getFullYear() + "-" + now.getMonth() + "-" + now.getDate() + " " +now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
      client_bd.query('INSERT INTO tblProblemas SET idProblem = ?, idClient = ?, algorithm = ?, selection = ?, mutation = ?, recombination = ?, replacement = ?, time = ?, name = ?, description = ?',
        [data.id, data.client, algorithm, selection, mutation, recombination, replacement, date, data.nome, data.desc]
      );
  	});



	/* Print values w/ query to create charts */

    socket.on('run', function (data) {
    	client_bd.query('USE '+TEST_DATABASE);
    	console.log(data.Itera);
		client_bd.query('SELECT * from tblResults where itera="'+data.Itera+'" and idClient="'+data.idClient+'" and idProblem="'+data.idProblem+'"', function selectCb(err, results, fields) {
			if (err) {
				throw err;
			}
			console.log(JSON.stringify(results));
			clients.forEach(function(c){c.socket.emit('run',results);});
		});
  	});
  	
  	/* query for get best value and string */

  	socket.on('end', function (data) {
  	 	client_bd.query('USE '+TEST_DATABASE);
  	 	client_bd.query('select max(best) as max_best, attribute from tblIterations where idClient= "'+data.idClient+'" AND idProblem="'+data.idProblem+'" AND type = "2"', function selectCb(err, results, fields) {
  			if (err) {
  				throw err;
  			}
  			var data2 = { 'idClient' : data.idClient, 'idProblem': data.idProblem, 'dados':results }
  			console.log(JSON.stringify(data2));
  			clients.forEach(function(c){c.socket.emit('end',data2);});
		  });
  	});

    /* get info */

    socket.on('info', function (data) {
      console.log('teste');
      var teste = base64.decode(data);
      teste = replaceAll(teste,"'","\"");
      console.log(teste);
      clients.forEach(function(c){c.socket.emit('getInfo',teste);});
    });

    socket.on('nodeStats', function (data) {
      clients.forEach(function(c){c.socket.emit('nodeStatsResult','up');});
    });

    socket.on('codeStats', function (data) {
      clients.forEach(function(c){c.socket.emit('codeStatsResult','up');});
    });


  	/* create a new client account */

	socket.on('registAccount', function (data) {
		  client_bd.query('USE '+TEST_DATABASE);
		  var newDate = new Date;
      var id_confirmacao = newDate.getTime();
  	 	client_bd.query('INSERT INTO tblClientes SET nome = ?, email = ?, password = ?, id_confirmation = ?, status = ?',
  			[data.name, data.email, data.pass, id_confirmacao, 0]
  		);
      email.send({
      		host : "smtp.gmail.com",              // smtp server hostname
      		port : "465",                     // smtp server port
      		ssl: true,                        // for SSL support - REQUIRES NODE v0.3.x OR HIGHER
     		  domain : "www.cloudglare.com",            // domain used by client to identify itself to server
      		to : data.email,
      		from : "noreply@cloudglare.com",
      		subject : "Confirmação do Registo de Conta",
      		body: data.name + ", bem vindo a LifeInspiration a sua conta foi criada com sucesso.\n\nAgora necessita de confirmar a sua conta acedendo a: http://www.cloudglare.com/confirm.html?email="+ data.email+"&id_confirmacao="+ id_confirmacao+"\n\nApós confirmação poderá usar o nosso sistema para resolver os seus problemas.\n\nObrigado, LifeInspiration Optima Team",
      		authentication : "login",        // auth login is supported; anything else is no auth
      		username : "urbaneousapp@gmail.com",        // username
      		password : "25713423"         // password
    	},
    		function(err, result){
     		 if(err){ console.log(err); }
    	});
  		socket.emit('registResult', 'ok');
  	});

    socket.on('confirmAccount', function (data) {
      client_bd.query('USE '+TEST_DATABASE);
      client_bd.query('select * from tblClientes where email="'+data.email+'"', function selectCb(err, results, fields) {
        if (err) {
          throw err;
        }
        if(results[0].id_confirmation == data.id_confirmacao){
          client_bd.query('Update tblClientes SET status = 1 where email="'+data.email+'"');
          socket.emit('resultConfirmAccount',results);
        }
        else{
          socket.emit('resultConfirmAccount',"error");
        }
      });
      email.send({
          host : "smtp.gmail.com",              // smtp server hostname
          port : "465",                     // smtp server port
          ssl: true,                        // for SSL support - REQUIRES NODE v0.3.x OR HIGHER
          domain : "www.cloudglare.com",            // domain used by client to identify itself to server
          to : data.email,
          from : "noreply@cloudglare.com",
          subject : "Confirmação do Registo de Conta",
          body: data.name + ", a sua conta na LifeInspiration foi confirmada com sucesso, a partir de agora pode usufruir de todos os nossos serviços.\n\nObrigado, LifeInspiration Optima Team",
          authentication : "login",        // auth login is supported; anything else is no auth
          username : "urbaneousapp@gmail.com",        // username
          password : "25713423"         // password
      },
        function(err, result){
         if(err){ console.log(err); }
      });
    });
	/* login user */

	socket.on('LoginAccount', function (data) {
		client_bd.query('USE '+TEST_DATABASE);
		client_bd.query('SELECT idClient, nome, status FROM tblClientes where email="'+data.email+'" and password="'+data.password+'"',function selectCb(err, results, fields) {
	    	if (err) {
	      		throw err;
	    	}
			if(results.length > 0){
	    		socket.emit('loginResult', results);
			}
			else{
				socket.emit('loginResult', 'error');
			}
 		});
	});

	/************* my user area *************/

  //
  socket.on('getUserData', function (data) {
    client_bd.query('USE '+TEST_DATABASE);
		client_bd.query('SELECT * from tblClientes where idClient="'+data.idClient+'"', function selectCb(err, results, fields) {
		  if (err) {
			 throw err;
		  }
		  console.log(JSON.stringify(results));
		  socket.emit('getUserDataResult',results);
		});
  });
  socket.on('getUserProblems', function (data) {
    client_bd.query('USE '+TEST_DATABASE);
    client_bd.query('SELECT * from tblProblemas where idClient="'+data.idClient+'"', function selectCb(err, results, fields) {
      if (err) {
       throw err;
      }
      socket.emit('getUserProblemsResult',results);
    });
  });

  /**** get problem info ***/

   socket.on('getProblemInfo', function (data) {
    client_bd.query('USE '+TEST_DATABASE);
    client_bd.query('SELECT * from tblProblemas where idClient="'+data.idClient+'" and idProblem="'+data.idProblem+'"', function selectCb(err, results, fields) {
      if (err) {
       throw err;
      }
      socket.emit('getProblemInfoResult',results);
    });
  });

   /**** getCharts - load values from problem ***/

   socket.on('getCharts', function (data) {
    client_bd.query('USE '+TEST_DATABASE);
      client_bd.query('SELECT * from tblResults where idClient="'+data.idClient+'" and idProblem="'+data.idProblem+'"', function selectCb(err, results, fields) {
      if (err) {
        throw err;
      }
      console.log(results);
      socket.emit('loadCharts',results);
    });
  });

   /**** getCharts - load values from problem ***/

   socket.on('getString', function (data) {
    client_bd.query('USE '+TEST_DATABASE);
    client_bd.query('select max(best) as max_best, attribute from tblIterations where idClient= "'+data.idClient+'" AND idProblem="'+data.idProblem+'" AND type = "2"', function selectCb(err, results, fields) {
        if (err) {
          throw err;
        }
        var data2 = { 'idClient' : data.idClient, 'idProblem': data.idProblem, 'dados':results }
        socket.emit('loadString',data2);
      });
  });

  /**** ChangeClientPassword ***/
  socket.on('changeClientPassword', function (data) {
    client_bd.query('USE '+TEST_DATABASE);
    client_bd.query('Update tblClientes set password="'+ data.password +'" where idClient= "'+data.idClient+'"', function selectCb(err, results, fields) {
        if (err) {
          throw err;
        }
        socket.emit('changeClientPasswordResult','done');
      });
  });

  /**** ChangeClientPassword ***/
  socket.on('changeClientInfo', function (data) {
    client_bd.query('USE '+TEST_DATABASE);
    client_bd.query('Update tblClientes set nome="'+ data.name +'", email="'+data.email+'", address="'+data.address+'", city="'+data.city+'", zipcode="'+data.zipcode+'", phone1="'+data.phone1+'", phone2="'+data.phone2+'", website="'+data.website+'"  where idClient= "'+data.idClient+'"', function selectCb(err, results, fields) {
        if (err) {
          throw err;
        }
        socket.emit('changeClientInfoResult','done');
      });
  });

 /**** insertFeed***/
    socket.on('insertFeed', function (data) {
        client_bd.query('USE '+TEST_DATABASE);
        client_bd.query('INSERT INTO feed SET nome = ?,news = ?',[data.nome, data.news]);
    
    
        
        socket.emit('respostFeed',data);
    
    });



});




var clients=[];
function Client(socket) {
  this.socket = socket;
  console.log('Novo CLIENTE = ');
  ///console.log(socket);
}

