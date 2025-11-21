<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../BD/Connection.php';

// $conn ya está disponible desde Connection.php

// Obtener acción
$action = $_GET['action'] ?? $_POST['action'] ?? null;

if (!$action) {
    echo json_encode(['success' => false, 'message' => 'Acción no especificada']);
    exit;
}

// Obtener recompensas compradas por el usuario
if ($action === 'get_user_rewards') {
    $userId = $_GET['user_id'] ?? null;
    
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'User ID requerido']);
        exit;
    }
    
    $stmt = $conn->prepare("SELECT reward_id, earned_at FROM user_rewards WHERE user_id = ?");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $rewards = [];
    while ($row = $result->fetch_assoc()) {
        $rewards[] = [
            'reward_id' => (int)$row['reward_id'],
            'earned_at' => $row['earned_at']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $rewards
    ]);
    exit;
}

// Establecer recompensa activa
if ($action === 'set_active_reward') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $userId = $input['user_id'] ?? null;
    $rewardId = $input['reward_id'] ?? null;
    
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'User ID requerido']);
        exit;
    }
    
    try {
        // Si rewardId es null, desactivar recompensa
        if ($rewardId === null) {
            $stmt = $conn->prepare("UPDATE users SET active_reward_id = NULL WHERE id = ?");
            $stmt->bind_param('i', $userId);
            $stmt->execute();
            
            echo json_encode([
                'success' => true,
                'message' => 'Recompensa desactivada'
            ]);
            exit;
        }
        
        // Verificar que el usuario posee esta recompensa
        $stmt = $conn->prepare("SELECT COUNT(*) as count FROM user_rewards WHERE user_id = ? AND reward_id = ?");
        $stmt->bind_param('ii', $userId, $rewardId);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        if ($row['count'] == 0) {
            throw new Exception('No posees esta recompensa');
        }
        
        // Establecer como activa
        $stmt = $conn->prepare("UPDATE users SET active_reward_id = ? WHERE id = ?");
        $stmt->bind_param('ii', $rewardId, $userId);
        $stmt->execute();
        
        echo json_encode([
            'success' => true,
            'message' => 'Recompensa activada',
            'data' => ['active_reward_id' => $rewardId]
        ]);
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
    
    exit;
}

// Obtener recompensa activa
if ($action === 'get_active_reward') {
    $userId = $_GET['user_id'] ?? null;
    
    if (!$userId) {
        echo json_encode(['success' => false, 'message' => 'User ID requerido']);
        exit;
    }
    
    $stmt = $conn->prepare("SELECT active_reward_id FROM users WHERE id = ?");
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    echo json_encode([
        'success' => true,
        'data' => [
            'active_reward_id' => $user['active_reward_id'] ? (int)$user['active_reward_id'] : null
        ]
    ]);
    exit;
}

// Comprar recompensa
if ($action === 'purchase_reward') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $userId = $input['user_id'] ?? null;
    $rewardId = $input['reward_id'] ?? null;
    $price = $input['price'] ?? null;
    $rewardName = $input['reward_name'] ?? 'Recompensa';
    
    if (!$userId || !$rewardId || !$price) {
        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
        exit;
    }
    
    // Iniciar transacción
    $conn->begin_transaction();
    
    try {
        // Verificar si ya tiene esta recompensa
        $stmt = $conn->prepare("SELECT COUNT(*) as count FROM user_rewards WHERE user_id = ? AND reward_id = ?");
        $stmt->bind_param('ii', $userId, $rewardId);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        if ($row['count'] > 0) {
            throw new Exception('Ya posees esta recompensa');
        }
        
        // Verificar saldo de gemas
        $stmt = $conn->prepare("SELECT gems FROM users WHERE id = ?");
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        
        if (!$user) {
            throw new Exception('Usuario no encontrado');
        }
        
        if ($user['gems'] < $price) {
            throw new Exception('Gemas insuficientes');
        }
        
        // Descontar gemas
        $newBalance = $user['gems'] - $price;
        $stmt = $conn->prepare("UPDATE users SET gems = ? WHERE id = ?");
        $stmt->bind_param('ii', $newBalance, $userId);
        $stmt->execute();
        
        // Registrar transacción de gemas
        $description = "Compra: " . $rewardName;
        $stmt = $conn->prepare("INSERT INTO gem_transactions (user_id, amount, transaction_type, description) VALUES (?, ?, 'spend', ?)");
        $negativeAmount = -$price;
        $stmt->bind_param('iis', $userId, $negativeAmount, $description);
        $stmt->execute();
        
        // Agregar recompensa al usuario
        $stmt = $conn->prepare("INSERT INTO user_rewards (user_id, reward_id) VALUES (?, ?)");
        $stmt->bind_param('ii', $userId, $rewardId);
        $stmt->execute();
        
        // Confirmar transacción
        $conn->commit();
        
        echo json_encode([
            'success' => true,
            'message' => '¡Recompensa comprada exitosamente!',
            'data' => [
                'new_balance' => $newBalance,
                'reward_id' => $rewardId
            ]
        ]);
        
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
    
    exit;
}

echo json_encode(['success' => false, 'message' => 'Acción no válida']);
?>
