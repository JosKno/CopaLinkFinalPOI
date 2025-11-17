<?php
// API para gestionar equipos del Mundial 2026
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
require_once '../../BD/Connection.php';

$response = ['success' => false, 'message' => '', 'data' => null];

$action = $_GET['action'] ?? null;

if (!$action) {
    $response['message'] = 'Acción no especificada.';
    echo json_encode($response);
    exit;
}

switch ($action) {
    case 'get_all':
        getAllTeams($conn, $response);
        break;
    
    case 'get_by_id':
        getTeamById($conn, $response);
        break;
    
    default:
        $response['message'] = 'Acción no válida.';
        break;
}

echo json_encode($response);
$conn->close();

// ==================== FUNCIONES ====================

function getAllTeams($conn, &$response) {
    // Obtener todos los equipos ordenados aleatoriamente para distribuir en grupos
    $stmt = $conn->prepare('SELECT id, name, power_level, fifa_code, confederation FROM teams ORDER BY RAND()');
    $stmt->execute();
    $result = $stmt->get_result();
    $teams = [];

    while ($row = $result->fetch_assoc()) {
        $teams[] = $row;
    }

    if (count($teams) > 0) {
        $response['success'] = true;
        $response['data'] = $teams;
    } else {
        $response['message'] = 'No se encontraron equipos. Por favor, ejecuta la migración teams_migration.sql';
    }
    
    $stmt->close();
}

function getTeamById($conn, &$response) {
    $team_id = $_GET['team_id'] ?? null;

    if (!$team_id) {
        $response['message'] = 'ID de equipo requerido.';
        return;
    }

    $stmt = $conn->prepare('SELECT id, name, power_level, fifa_code, confederation FROM teams WHERE id = ?');
    $stmt->bind_param('i', $team_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $response['success'] = true;
        $response['data'] = $result->fetch_assoc();
    } else {
        $response['message'] = 'Equipo no encontrado.';
    }
    
    $stmt->close();
}
?>
