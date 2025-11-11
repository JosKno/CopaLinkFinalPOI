<?php
include '../BD/Connection.php';

// Buscar mensajes de video recientes
$query = "
    SELECT 
        m.id, 
        m.content, 
        f.file_name, 
        f.file_path, 
        f.file_type 
    FROM messages m 
    LEFT JOIN files f ON f.message_id = m.id 
    WHERE m.content LIKE '%Video%' 
    ORDER BY m.id DESC 
    LIMIT 5
";

$result = mysqli_query($conn, $query);

echo "<h2>Mensajes de Video Recientes:</h2>";
echo "<pre>";
if ($result && mysqli_num_rows($result) > 0) {
    while($row = mysqli_fetch_assoc($result)) {
        print_r($row);
        echo "\n---\n";
    }
} else {
    echo "No se encontraron mensajes de video o error en la consulta.\n";
    echo "Error: " . mysqli_error($conn);
}
echo "</pre>";
?>
