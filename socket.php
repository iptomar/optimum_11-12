<?php
 
$string =  $_GET['teste'];
/* Open a socket to port 1234 on localhost */
$socket = stream_socket_client('tcp://193.137.5.223:8080');

/* Send ordinary data via ordinary channels. */
//fwrite($socket, "Normal data transmit.");
//$teste = "{ type: 100, teste: 'ola', array:['roleta',20]} ";

/* Send more data out of band. */
stream_socket_sendto($socket, $string);
//stream_socket_sendto($socket, $teste, STREAM_OOB);

/* Close it up */
fclose($socket);
?>