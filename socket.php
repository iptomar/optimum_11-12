<?php
/* Open a socket to port 1234 on localhost */
$socket = stream_socket_client('tcp://192.168.10.109:1234');

/* Send ordinary data via ordinary channels. */
//fwrite($socket, "Normal data transmit.");
$teste = "{ type: 100, teste: 'ola', array:['roleta',20]} ";

/* Send more data out of band. */
//stream_socket_sendto($socket, "type:'OneMax',id:1001,client:1000,selection:['roleta',100],mutation:['flipbit',0.01],combination:'CrossOver',replacement:['tournament',20,30],iterations:100,pop:1000,alello:100,best:80.0,lenght:1000,data:[[x,y],[y,z],[b,a]]", STREAM_OOB);
stream_socket_sendto($socket, $teste, STREAM_OOB);

/* Close it up */
fclose($socket);
?>