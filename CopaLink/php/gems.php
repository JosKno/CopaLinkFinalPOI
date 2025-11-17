<?php
// Controlador de Gemas - Maneja todas las operaciones relacionadas con gemas
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
    case 'get_balance':
        getBalance($conn, $response);
        break;
    
    case 'add':
    case 'add_gems':
        addGems($conn, $response);
        break;
    
    case 'subtract':
    case 'subtract_gems':
        subtractGems($conn, $response);
        break;
    
    case 'transfer':
        transferGems($conn, $response);
        break;
    
    case 'get_transactions':
        getTransactions($conn, $response);
        break;
    
    case 'create_bet':
        createBet($conn, $response);
        break;
    
    case 'resolve_bet':
        resolveBet($conn, $response);
        break;
    
    case 'get_user_bets':
        getUserBets($conn, $response);
        break;
    
    default:
        $response['message'] = 'Acción no válida.';
        break;
}

echo json_encode($response);
$conn->close();

// ==================== FUNCIONES ====================

/**
 * Obtener balance de gemas de un usuario
 */
function getBalance($conn, &$response) {
    $user_id = $_GET['user_id'] ?? null;

    if (!$user_id) {
        $response['message'] = 'ID de usuario requerido.';
        return;
    }

    $stmt = $conn->prepare('SELECT gems FROM users WHERE id = ?');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        $response['success'] = true;
        $response['data'] = ['gems' => (int)$row['gems']];
    } else {
        $response['message'] = 'Usuario no encontrado.';
    }
    $stmt->close();
}

/**
 * Agregar gemas a un usuario
 */
function addGems($conn, &$response) {
    $data = json_decode(file_get_contents('php://input'), true);
    $user_id = $data['user_id'] ?? null;
    $amount = $data['amount'] ?? null;
    $type = $data['transaction_type'] ?? $data['type'] ?? 'earn';
    $description = $data['description'] ?? 'Gemas añadidas';
    $related_id = $data['related_id'] ?? null;

    // Validar datos (amount puede ser 0 para pérdidas totales)
    if (!$user_id || $amount === null || $amount < 0) {
        $response['message'] = 'Datos inválidos.';
        return;
    }

    $conn->begin_transaction();
    
    try {
        // Actualizar balance
        $stmt = $conn->prepare('UPDATE users SET gems = gems + ? WHERE id = ?');
        $stmt->bind_param('ii', $amount, $user_id);
        $stmt->execute();
        $stmt->close();

        // Registrar transacción
        $stmt = $conn->prepare('INSERT INTO gem_transactions (user_id, amount, transaction_type, description, related_id) VALUES (?, ?, ?, ?, ?)');
        $stmt->bind_param('iissi', $user_id, $amount, $type, $description, $related_id);
        $stmt->execute();
        $stmt->close();

        // Obtener nuevo balance
        $stmt = $conn->prepare('SELECT gems FROM users WHERE id = ?');
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $new_balance = $result->fetch_assoc()['gems'];
        $stmt->close();

        $conn->commit();
        
        $response['success'] = true;
        $response['message'] = 'Gemas añadidas correctamente.';
        $response['data'] = ['new_balance' => (int)$new_balance, 'amount_added' => (int)$amount];
    } catch (Exception $e) {
        $conn->rollback();
        $response['message'] = 'Error al añadir gemas: ' . $e->getMessage();
    }
}

/**
 * Restar gemas a un usuario
 */
function subtractGems($conn, &$response) {
    $data = json_decode(file_get_contents('php://input'), true);
    $user_id = $data['user_id'] ?? null;
    $amount = $data['amount'] ?? null;
    $type = $data['transaction_type'] ?? $data['type'] ?? 'spend';
    $description = $data['description'] ?? 'Gemas gastadas';
    $related_id = $data['related_id'] ?? null;

    if (!$user_id || !$amount || $amount <= 0) {
        $response['message'] = 'Datos inválidos.';
        return;
    }

    $conn->begin_transaction();
    
    try {
        // Verificar balance suficiente
        $stmt = $conn->prepare('SELECT gems FROM users WHERE id = ?');
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $current_balance = $result->fetch_assoc()['gems'];
        $stmt->close();

        if ($current_balance < $amount) {
            $response['message'] = 'Gemas insuficientes.';
            $conn->rollback();
            return;
        }

        // Actualizar balance
        $stmt = $conn->prepare('UPDATE users SET gems = gems - ? WHERE id = ?');
        $stmt->bind_param('ii', $amount, $user_id);
        $stmt->execute();
        $stmt->close();

        // Registrar transacción (cantidad negativa)
        $negative_amount = -$amount;
        $stmt = $conn->prepare('INSERT INTO gem_transactions (user_id, amount, transaction_type, description, related_id) VALUES (?, ?, ?, ?, ?)');
        $stmt->bind_param('iissi', $user_id, $negative_amount, $type, $description, $related_id);
        $stmt->execute();
        $stmt->close();

        $new_balance = $current_balance - $amount;

        $conn->commit();
        
        $response['success'] = true;
        $response['message'] = 'Gemas restadas correctamente.';
        $response['data'] = ['new_balance' => (int)$new_balance, 'amount_subtracted' => (int)$amount];
    } catch (Exception $e) {
        $conn->rollback();
        $response['message'] = 'Error al restar gemas: ' . $e->getMessage();
    }
}

/**
 * Transferir gemas entre usuarios
 */
function transferGems($conn, &$response) {
    $data = json_decode(file_get_contents('php://input'), true);
    $from_user_id = $data['from_user_id'] ?? null;
    $to_user_id = $data['to_user_id'] ?? null;
    $amount = $data['amount'] ?? null;
    $description = $data['description'] ?? 'Transferencia de gemas';

    if (!$from_user_id || !$to_user_id || !$amount || $amount <= 0) {
        $response['message'] = 'Datos inválidos.';
        return;
    }

    if ($from_user_id == $to_user_id) {
        $response['message'] = 'No puedes transferir gemas a ti mismo.';
        return;
    }

    $conn->begin_transaction();
    
    try {
        // Verificar balance del remitente
        $stmt = $conn->prepare('SELECT gems FROM users WHERE id = ?');
        $stmt->bind_param('i', $from_user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $from_balance = $result->fetch_assoc()['gems'];
        $stmt->close();

        if ($from_balance < $amount) {
            $response['message'] = 'Gemas insuficientes para la transferencia.';
            $conn->rollback();
            return;
        }

        // Restar gemas del remitente
        $stmt = $conn->prepare('UPDATE users SET gems = gems - ? WHERE id = ?');
        $stmt->bind_param('ii', $amount, $from_user_id);
        $stmt->execute();
        $stmt->close();

        // Añadir gemas al receptor
        $stmt = $conn->prepare('UPDATE users SET gems = gems + ? WHERE id = ?');
        $stmt->bind_param('ii', $amount, $to_user_id);
        $stmt->execute();
        $stmt->close();

        // Registrar transacción del remitente (negativo)
        $negative_amount = -$amount;
        $type_send = 'transfer_send';
        $desc_send = "Transferencia enviada: $description";
        $stmt = $conn->prepare('INSERT INTO gem_transactions (user_id, amount, transaction_type, description, related_id) VALUES (?, ?, ?, ?, ?)');
        $stmt->bind_param('iissi', $from_user_id, $negative_amount, $type_send, $desc_send, $to_user_id);
        $stmt->execute();
        $stmt->close();

        // Registrar transacción del receptor (positivo)
        $type_receive = 'transfer_receive';
        $desc_receive = "Transferencia recibida: $description";
        $stmt = $conn->prepare('INSERT INTO gem_transactions (user_id, amount, transaction_type, description, related_id) VALUES (?, ?, ?, ?, ?)');
        $stmt->bind_param('iissi', $to_user_id, $amount, $type_receive, $desc_receive, $from_user_id);
        $stmt->execute();
        $stmt->close();

        $conn->commit();
        
        $response['success'] = true;
        $response['message'] = 'Transferencia completada exitosamente.';
        $response['data'] = ['amount_transferred' => (int)$amount];
    } catch (Exception $e) {
        $conn->rollback();
        $response['message'] = 'Error en la transferencia: ' . $e->getMessage();
    }
}

/**
 * Obtener historial de transacciones
 */
function getTransactions($conn, &$response) {
    $user_id = $_GET['user_id'] ?? null;
    $limit = $_GET['limit'] ?? 50;

    if (!$user_id) {
        $response['message'] = 'ID de usuario requerido.';
        return;
    }

    $stmt = $conn->prepare('
        SELECT id, amount, transaction_type, description, related_id, created_at
        FROM gem_transactions
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
    ');
    $stmt->bind_param('ii', $user_id, $limit);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $transactions = [];
    while ($row = $result->fetch_assoc()) {
        $transactions[] = $row;
    }

    $response['success'] = true;
    $response['data'] = $transactions;
    $stmt->close();
}

/**
 * Crear una apuesta
 */
function createBet($conn, &$response) {
    $data = json_decode(file_get_contents('php://input'), true);
    $user_id = $data['user_id'] ?? null;
    $bet_group = $data['bet_group'] ?? null;
    $bet_team = $data['bet_team'] ?? null;
    $gems_amount = $data['gems_amount'] ?? null;
    $simulation_id = $data['simulation_id'] ?? null;

    if (!$user_id || !$bet_group || !$bet_team || !$gems_amount || $gems_amount <= 0) {
        $response['message'] = 'Datos inválidos para la apuesta.';
        return;
    }

    $conn->begin_transaction();
    
    try {
        // Verificar balance suficiente
        $stmt = $conn->prepare('SELECT gems FROM users WHERE id = ?');
        $stmt->bind_param('i', $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $current_balance = $result->fetch_assoc()['gems'];
        $stmt->close();

        if ($current_balance < $gems_amount) {
            $response['message'] = 'Gemas insuficientes para la apuesta.';
            $conn->rollback();
            return;
        }

        // Restar gemas del usuario
        $stmt = $conn->prepare('UPDATE users SET gems = gems - ? WHERE id = ?');
        $stmt->bind_param('ii', $gems_amount, $user_id);
        $stmt->execute();
        $stmt->close();

        // Crear apuesta
        $stmt = $conn->prepare('INSERT INTO bets (user_id, bet_group, bet_team, gems_amount, simulation_id) VALUES (?, ?, ?, ?, ?)');
        $stmt->bind_param('isssi', $user_id, $bet_group, $bet_team, $gems_amount, $simulation_id);
        $stmt->execute();
        $bet_id = $stmt->insert_id;
        $stmt->close();

        // Registrar transacción
        $negative_amount = -$gems_amount;
        $type = 'spend';
        $description = "Apuesta en $bet_group: $bet_team";
        $stmt = $conn->prepare('INSERT INTO gem_transactions (user_id, amount, transaction_type, description, related_id) VALUES (?, ?, ?, ?, ?)');
        $stmt->bind_param('iissi', $user_id, $negative_amount, $type, $description, $bet_id);
        $stmt->execute();
        $stmt->close();

        $new_balance = $current_balance - $gems_amount;

        $conn->commit();
        
        $response['success'] = true;
        $response['message'] = 'Apuesta creada exitosamente.';
        $response['data'] = [
            'bet_id' => $bet_id,
            'new_balance' => (int)$new_balance
        ];
    } catch (Exception $e) {
        $conn->rollback();
        $response['message'] = 'Error al crear apuesta: ' . $e->getMessage();
    }
}

/**
 * Resolver una apuesta
 */
function resolveBet($conn, &$response) {
    $data = json_decode(file_get_contents('php://input'), true);
    $bet_id = $data['bet_id'] ?? null;
    $won = $data['won'] ?? false;

    if (!$bet_id) {
        $response['message'] = 'ID de apuesta requerido.';
        return;
    }

    $conn->begin_transaction();
    
    try {
        // Obtener información de la apuesta
        $stmt = $conn->prepare('SELECT user_id, gems_amount, status FROM bets WHERE id = ?');
        $stmt->bind_param('i', $bet_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $bet = $result->fetch_assoc();
        $stmt->close();

        if (!$bet) {
            $response['message'] = 'Apuesta no encontrada.';
            $conn->rollback();
            return;
        }

        if ($bet['status'] != 'pending') {
            $response['message'] = 'La apuesta ya ha sido resuelta.';
            $conn->rollback();
            return;
        }

        $user_id = $bet['user_id'];
        $gems_amount = $bet['gems_amount'];
        $new_status = $won ? 'won' : 'lost';

        // Actualizar estado de la apuesta
        $stmt = $conn->prepare('UPDATE bets SET status = ?, resolved_at = NOW() WHERE id = ?');
        $stmt->bind_param('si', $new_status, $bet_id);
        $stmt->execute();
        $stmt->close();

        // Si ganó, devolver el doble
        if ($won) {
            $reward = $gems_amount * 2;
            $stmt = $conn->prepare('UPDATE users SET gems = gems + ? WHERE id = ?');
            $stmt->bind_param('ii', $reward, $user_id);
            $stmt->execute();
            $stmt->close();

            // Registrar transacción de ganancia
            $type = 'bet_win';
            $description = "Ganancia de apuesta (x2)";
            $stmt = $conn->prepare('INSERT INTO gem_transactions (user_id, amount, transaction_type, description, related_id) VALUES (?, ?, ?, ?, ?)');
            $stmt->bind_param('iissi', $user_id, $reward, $type, $description, $bet_id);
            $stmt->execute();
            $stmt->close();

            $response['data'] = ['reward' => $reward];
        } else {
            // Registrar pérdida (ya se restaron las gemas al crear la apuesta)
            $response['data'] = ['reward' => 0];
        }

        $conn->commit();
        
        $response['success'] = true;
        $response['message'] = $won ? '¡Apuesta ganada! Gemas duplicadas.' : 'Apuesta perdida.';
    } catch (Exception $e) {
        $conn->rollback();
        $response['message'] = 'Error al resolver apuesta: ' . $e->getMessage();
    }
}

/**
 * Obtener apuestas de un usuario
 */
function getUserBets($conn, &$response) {
    $user_id = $_GET['user_id'] ?? null;
    $status = $_GET['status'] ?? null; // pending, won, lost

    if (!$user_id) {
        $response['message'] = 'ID de usuario requerido.';
        return;
    }

    if ($status) {
        $stmt = $conn->prepare('
            SELECT id, bet_group, bet_team, gems_amount, status, simulation_id, created_at, resolved_at
            FROM bets
            WHERE user_id = ? AND status = ?
            ORDER BY created_at DESC
        ');
        $stmt->bind_param('is', $user_id, $status);
    } else {
        $stmt = $conn->prepare('
            SELECT id, bet_group, bet_team, gems_amount, status, simulation_id, created_at, resolved_at
            FROM bets
            WHERE user_id = ?
            ORDER BY created_at DESC
        ');
        $stmt->bind_param('i', $user_id);
    }

    $stmt->execute();
    $result = $stmt->get_result();
    
    $bets = [];
    while ($row = $result->fetch_assoc()) {
        $bets[] = $row;
    }

    $response['success'] = true;
    $response['data'] = $bets;
    $stmt->close();
}
?>
