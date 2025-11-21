<?php
// Configuración para Railway (usa variables de entorno en producción)
$servername = getenv('DB_HOST') ?: getenv('MYSQLHOST') ?: "localhost";
$database = getenv('DB_NAME') ?: getenv('MYSQLDATABASE') ?: "poi";
$username = getenv('DB_USER') ?: getenv('MYSQLUSER') ?: "root";
$password = getenv('DB_PASSWORD') ?: getenv('MYSQLPASSWORD') ?: "";
$port = getenv('DB_PORT') ?: getenv('MYSQLPORT') ?: 3306;

$conn = mysqli_connect($servername, $username, $password, $database, $port);
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}
?>