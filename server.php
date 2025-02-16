<?php


if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $data = file_get_contents("php://input");

    file_put_contents('log_post_data.txt', "Dados recebidos: " . $data . "\n", FILE_APPEND);

    echo 'Dados recebidos com sucesso!';
} else {
    echo 'Método de requisição inválido';
}
?>
