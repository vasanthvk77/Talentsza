<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Prevent PHP from outputting HTML errors that break JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

// 1. Load Config (SMTP Details)
$config_path = __DIR__ . '/../public/webflow-pages/config.json';
if (!file_exists($config_path)) {
    echo json_encode(['status' => 'error', 'message' => 'Configuration file not found']);
    exit;
}
$config = json_decode(file_get_contents($config_path), true);
$smtpRaw = $config['smtpConfig'] ?? null;

if (!$smtpRaw) {
    echo json_encode(['status' => 'error', 'message' => 'SMTP configuration missing in config.json']);
    exit;
}

// Handle both 'Host' and 'host', etc.
$smtp = [];
foreach ($smtpRaw as $key => $value) {
    $smtp[strtolower($key)] = $value;
}

// 2. Get Form Data
$name = $_POST['Full-Name'] ?? 'Not provided';
$phone = $_POST['Phone-Number'] ?? 'Not provided';
$email = $_POST['Email-Address'] ?? 'Not provided';
$place = $_POST['Place'] ?? 'Not provided';
$education = $_POST['Education'] ?? 'Not provided';
$work_preference = $_POST['Work-Preference'] ?? 'Not provided';
$message_content = $_POST['Message'] ?? $_POST['Comment'] ?? 'No message';
$time = date('Y-m-d H:i:s');

// 3. Load & Populate HTML Template
$template_path = __DIR__ . '/../public/webflow-pages/components/Email_template.html';
if (!file_exists($template_path)) {
    echo json_encode(['status' => 'error', 'message' => 'Email template not found']);
    exit;
}

$template = file_get_contents($template_path);

// Get CV filename if exists
$cv_name = "No attachment provided";
if (isset($_FILES['CV']) && $_FILES['CV']['error'] == UPLOAD_ERR_OK) {
    $cv_name = $_FILES['CV']['name'];
}

$placeholders = [
    '{{name}}' => htmlspecialchars($name),
    '{{phone}}' => htmlspecialchars($phone),
    '{{email}}' => htmlspecialchars($email),
    '{{place}}' => htmlspecialchars($place),
    '{{education}}' => htmlspecialchars($education),
    '{{work_preference}}' => htmlspecialchars($work_preference),
    '{{message}}' => nl2br(htmlspecialchars($message_content)),
    '{{time}}' => $time,
    '{{cv_attachment}}' => htmlspecialchars($cv_name)
];

foreach ($placeholders as $key => $value) {
    $template = str_replace($key, $value, $template);
}

// 4. Prepare Email Content (MIME)
$to = $smtp['receiveremail'] ?? "info@talentsza.com";
$subject = "New Inquiry from " . $name;
$boundary = "ts_boundary_" . md5(time());

$headers = [
    "From: Talentsza <" . $smtp['username'] . ">",
    "To: $to",
    "Reply-To: $email",
    "Subject: $subject",
    "MIME-Version: 1.0",
    "Content-Type: multipart/mixed; boundary=\"$boundary\""
];

$body = "--$boundary\r\n";
$body .= "Content-Type: text/html; charset=UTF-8\r\n";
$body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
$body .= $template . "\r\n\r\n";

// Handle File Attachment
if (isset($_FILES['CV']) && $_FILES['CV']['error'] == UPLOAD_ERR_OK) {
    $file_tmp = $_FILES['CV']['tmp_name'];
    $file_name = $_FILES['CV']['name'];
    $file_size = $_FILES['CV']['size'];
    $file_type = $_FILES['CV']['type'];

    $content = base64_encode(file_get_contents($file_tmp));
    $encoded_content = chunk_split($content);

    $body .= "--$boundary\r\n";
    $body .= "Content-Type: $file_type; name=\"$file_name\"\r\n";
    $body .= "Content-Disposition: attachment; filename=\"$file_name\"\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $body .= $encoded_content . "\r\n\r\n";
}
$body .= "--$boundary--";

// 5. Send via Built-in SMTP Client
try {
    $response = send_smtp(
        $smtp['host'],
        $smtp['port'],
        $smtp['username'],
        $smtp['password'],
        $smtp['username'], // From email
        $to,
        implode("\r\n", $headers) . "\r\n\r\n" . $body,
        $smtp['encryption']
    );
    
    if ($response === true) {
        echo json_encode(['status' => 'success', 'message' => 'Email sent successfully']);
    } else {
        throw new Exception($response);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

/**
 * Minimal SMTP Client implementation
 */
function send_smtp($host, $port, $user, $pass, $from, $to, $data, $encryption) {
    $socket = fsockopen(($encryption == 'ssl' ? 'ssl://' : '') . $host, $port, $errno, $errstr, 30);
    if (!$socket) return "Connection failed: $errstr ($errno)";

    $getResponse = function($socket) {
        $res = "";
        while ($str = fgets($socket, 515)) {
            $res .= $str;
            if (substr($str, 3, 1) == " ") break;
        }
        return $res;
    };

    $sendCommand = function($socket, $cmd) use ($getResponse) {
        fputs($socket, $cmd . "\r\n");
        return $getResponse($socket);
    };

    $getResponse($socket); // Initial welcome

    // HELO
    $sendCommand($socket, "EHLO " . $_SERVER['HTTP_HOST']);

    // STARTTLS
    if ($encryption == 'tls') {
        $res = $sendCommand($socket, "STARTTLS");
        if (substr($res, 0, 3) != "220") return "STARTTLS failed: $res";
        
        if (!extension_loaded('openssl')) {
            return "PHP OpenSSL extension is not enabled. Please enable it in your php.ini.";
        }

        if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            return "Crypto failed: Could not establish a secure connection. Try port 465 with 'ssl' instead.";
        }
        $sendCommand($socket, "EHLO " . $_SERVER['HTTP_HOST']);
    }

    // AUTH
    $res = $sendCommand($socket, "AUTH LOGIN");
    if (substr($res, 0, 3) != "334") return "AUTH LOGIN failed: $res";
    
    $res = $sendCommand($socket, base64_encode($user));
    if (substr($res, 0, 3) != "334") return "Username failed: $res";
    
    $res = $sendCommand($socket, base64_encode($pass));
    if (substr($res, 0, 3) != "235") return "Authentication failed: $res";

    // MAIL FROM
    $sendCommand($socket, "MAIL FROM:<$from>");
    
    // RCPT TO
    $res = $sendCommand($socket, "RCPT TO:<$to>");
    if (substr($res, 0, 3) != "250") return "Recipient failed: $res";

    // DATA
    $sendCommand($socket, "DATA");
    fputs($socket, $data . "\r\n.\r\n");
    $res = $getResponse($socket);
    
    // QUIT
    $sendCommand($socket, "QUIT");
    fclose($socket);

    return (substr($res, 0, 3) == "250") ? true : "Failed to send: $res";
}
?>
