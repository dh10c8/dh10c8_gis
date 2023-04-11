<?php
define('pg_db', "dh10c8");
define('pg_host', "localhost");
define('pg_user', "postgres");
define('pg_port', "5432");
define('pg_pass', "1");
$con = pg_connect("dbname=".pg_db." password=".pg_pass." host=".pg_host." user=".pg_user." port=".pg_port);

if(!$con){
    die("Connection failed.");
}
?>