<?php
// Controlador de Tareas - Maneja todas las operaciones relacionadas con tareas
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
require_once '../../BD/Connection.php';

$response = ['success' => false, 'message' => '', 'data' => null];

// Obtener la acción del parámetro
$action = $_GET['action'] ?? $_POST['action'] ?? null;

if (!$action) {
    $response['message'] = 'Acción no especificada.';
    echo json_encode($response);
    exit;
}

switch ($action) {
    case 'create':
        createTask($conn, $response);
        break;
    
    case 'get_list':
        getTasksList($conn, $response);
        break;
    
    case 'update':
        updateTask($conn, $response);
        break;
    
    case 'delete':
        deleteTask($conn, $response);
        break;
    
    default:
        $response['message'] = 'Acción no válida.';
        break;
}

echo json_encode($response);
$conn->close();

// ==================== FUNCIONES ====================

function createTask($conn, &$response) {
    $data = json_decode(file_get_contents('php://input'), true);
    $group_id = $data['group_id'] ?? null;
    $title = $data['title'] ?? null;
    $creator_id = $data['creator_id'] ?? null;
    $assigned_to = $data['assigned_to'] ?? null;
    $gems_reward = $data['gems_reward'] ?? 10;

    if (!$group_id || !$title || !$creator_id) {
        $response['message'] = 'Faltan datos obligatorios.';
        return;
    }

    $stmt = $conn->prepare('INSERT INTO tasks (group_id, title, creator_id, assigned_to, gems_reward) VALUES (?, ?, ?, ?, ?)');
    $stmt->bind_param('isiii', $group_id, $title, $creator_id, $assigned_to, $gems_reward);

    if ($stmt->execute()) {
        $task_id = $stmt->insert_id;
        $response['success'] = true;
        $response['message'] = 'Tarea creada correctamente.';
        $response['data'] = ['task_id' => $task_id, 'title' => $title, 'gems_reward' => $gems_reward];
    } else {
        $response['message'] = 'Error al crear la tarea.';
    }
    $stmt->close();
}

function getTasksList($conn, &$response) {
    $group_id = $_GET['group_id'] ?? null;

    if (!$group_id) {
        $response['message'] = 'ID de grupo requerido.';
        return;
    }

    $stmt = $conn->prepare('
        SELECT t.id, t.title, t.is_completed, t.gems_reward, t.created_at, 
               u.username as creator_name,
               assigned.username as assigned_to_name,
               completed.username as completed_by_name,
               t.completed_at
        FROM tasks t
        JOIN users u ON t.creator_id = u.id
        LEFT JOIN users assigned ON t.assigned_to = assigned.id
        LEFT JOIN users completed ON t.completed_by = completed.id
        WHERE t.group_id = ?
        ORDER BY t.is_completed ASC, t.created_at DESC
    ');
    $stmt->bind_param('i', $group_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $tasks = [];

    while ($row = $result->fetch_assoc()) {
        $tasks[] = $row;
    }

    $response['success'] = true;
    $response['data'] = $tasks;
    $stmt->close();
}

function updateTask($conn, &$response) {
    $data = json_decode(file_get_contents('php://input'), true);
    $task_id = $data['task_id'] ?? null;
    $is_completed = $data['is_completed'] ?? false;
    $completed_by = $data['completed_by'] ?? null;

    if (!$task_id) {
        $response['message'] = 'ID de tarea requerido.';
        return;
    }

    $conn->begin_transaction();
    
    try {
        // Obtener información de la tarea y el group_id
        $stmt = $conn->prepare('SELECT t.gems_reward, t.is_completed, t.assigned_to, t.group_id FROM tasks t WHERE t.id = ?');
        $stmt->bind_param('i', $task_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $task = $result->fetch_assoc();
        $stmt->close();

        if (!$task) {
            $response['message'] = 'Tarea no encontrada.';
            $conn->rollback();
            return;
        }

        // Si se está marcando como completada y antes no lo estaba
        if ($is_completed && !$task['is_completed']) {
            // Actualizar tarea
            $stmt = $conn->prepare('UPDATE tasks SET is_completed = ?, completed_by = ?, completed_at = NOW() WHERE id = ?');
            $stmt->bind_param('iii', $is_completed, $completed_by, $task_id);
            $stmt->execute();
            $stmt->close();

            // Obtener TODOS los miembros del grupo
            $group_id = $task['group_id'];
            $stmt = $conn->prepare('SELECT user_id FROM group_members WHERE group_id = ?');
            $stmt->bind_param('i', $group_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $group_members = [];
            while ($row = $result->fetch_assoc()) {
                $group_members[] = $row['user_id'];
            }
            $stmt->close();

            $gems_reward = $task['gems_reward'];
            $members_rewarded = 0;
            $current_user_new_balance = null;

            // Otorgar gemas a TODOS los miembros del grupo
            foreach ($group_members as $user_id) {
                // Actualizar balance de gemas
                $stmt = $conn->prepare('UPDATE users SET gems = gems + ? WHERE id = ?');
                $stmt->bind_param('ii', $gems_reward, $user_id);
                $stmt->execute();
                $stmt->close();

                // Registrar transacción
                $type = 'task_reward';
                $description = 'Recompensa por completar tarea del grupo';
                $stmt = $conn->prepare('INSERT INTO gem_transactions (user_id, amount, transaction_type, description, related_id) VALUES (?, ?, ?, ?, ?)');
                $stmt->bind_param('iissi', $user_id, $gems_reward, $type, $description, $task_id);
                $stmt->execute();
                $stmt->close();

                $members_rewarded++;

                // Si es el usuario actual, obtener su nuevo balance
                if ($user_id == $completed_by) {
                    $stmt = $conn->prepare('SELECT gems FROM users WHERE id = ?');
                    $stmt->bind_param('i', $user_id);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $current_user_new_balance = (int)$result->fetch_assoc()['gems'];
                    $stmt->close();
                }
            }

            $response['data'] = [
                'gems_earned' => $gems_reward,
                'new_balance' => $current_user_new_balance,
                'members_rewarded' => $members_rewarded
            ];
        } else {
            // Solo actualizar el estado sin dar recompensa
            $stmt = $conn->prepare('UPDATE tasks SET is_completed = ? WHERE id = ?');
            $stmt->bind_param('ii', $is_completed, $task_id);
            $stmt->execute();
            $stmt->close();
        }

        $conn->commit();
        
        $response['success'] = true;
        $response['message'] = $is_completed ? 'Tarea completada. ¡Gemas otorgadas a todos los miembros!' : 'Estado de tarea actualizado.';
    } catch (Exception $e) {
        $conn->rollback();
        $response['message'] = 'Error al actualizar tarea: ' . $e->getMessage();
    }
}

function deleteTask($conn, &$response) {
    $data = json_decode(file_get_contents('php://input'), true);
    $task_id = $data['task_id'] ?? null;

    if (!$task_id) {
        $response['message'] = 'ID de tarea requerido.';
        return;
    }

    $stmt = $conn->prepare('DELETE FROM tasks WHERE id = ?');
    $stmt->bind_param('i', $task_id);

    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = 'Tarea eliminada correctamente.';
    } else {
        $response['message'] = 'Error al eliminar tarea.';
    }
    $stmt->close();
}
?>
