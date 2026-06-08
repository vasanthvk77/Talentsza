<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Prevent PHP from outputting HTML errors that break JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);
set_time_limit(120); // Increase execution time to 2 minutes for large attachments

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

// 1. Load Config (SMTP Details)
// Updated path to point to config.json in the parent directory (webflow-pages)
$config_path = __DIR__ . '/../config.json';
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

// 2. Get Form Data (Strictly JSON)
$contentType = $_SERVER["CONTENT_TYPE"] ?? '';
if (stripos($contentType, 'application/json') === false) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid content type. Only application/json is supported.']);
    exit;
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

if (!$input) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid JSON payload']);
    exit;
}

$name = $input['Full-Name'] ?? 'Not provided';
$phone = $input['Phone-Number'] ?? 'Not provided';
$email = $input['Email-Address'] ?? 'Not provided';
$place = $input['Place'] ?? 'Not provided';
$education = $input['Education'] ?? 'Not provided';
$work_preference = $input['Work-Preference'] ?? 'Not provided';
$message_content = $input['Message'] ?? $input['Comment'] ?? 'No message';
$time = date('Y-m-d H:i:s');

// 3. Load & Populate HTML Template
// Updated path to point to components/Email_template.html in the parent directory
$template_path = __DIR__ . '/../components/Email_template.html';
if (!file_exists($template_path)) {
    echo json_encode(['status' => 'error', 'message' => 'Email template not found']);
    exit;
}

$template = file_get_contents($template_path);

// Get CV details if exists (Strictly JSON Base64)
$cv_name = "No attachment provided";
$cv_data = null;
$cv_type = null;

if (isset($input['CV']) && is_array($input['CV'])) {
    $cv_name = $input['CV']['name'] ?? 'attachment.pdf';
    $cv_type = $input['CV']['type'] ?? 'application/pdf';
    $cv_data = base64_decode($input['CV']['data'] ?? '');
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
if ($cv_data) {
    $encoded_content = chunk_split(base64_encode($cv_data));

    $body .= "--$boundary\r\n";
    $body .= "Content-Type: $cv_type; name=\"$cv_name\"\r\n";
    $body .= "Content-Disposition: attachment; filename=\"$cv_name\"\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $body .= $encoded_content . "\r\n\r\n";
}
$body .= "--$boundary--";

// 5. Send via Built-in SMTP Client
try {
    $startTime = microtime(true);
    $response = send_smtp(
        $smtp['host'],
        $smtp['port'],
        $smtp['username'],
        $smtp['password'],
        $smtp['username'], // From email
        $to,
        implode("\r\n", $headers) . "\r\n\r\n" . $body
    );
    $duration = round(microtime(true) - $startTime, 2);
    
    if ($response === true) {
        echo json_encode(['status' => 'success', 'message' => 'Email sent successfully', 'duration' => $duration]);
    } else {
        throw new Exception($response);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

/**
 * Minimal SMTP Client implementation
 */
function send_smtp($host, $port, $user, $pass, $from, $to, $data) {
    // Automatically use SSL if port is 465
    $prefix = ($port == 465) ? 'ssl://' : '';
    // Use a slightly shorter timeout for connection
    $socket = fsockopen($prefix . $host, $port, $errno, $errstr, 15);
    if (!$socket) return "Connection failed: $errstr ($errno)";
    
    // Set socket timeout for read/write operations
    stream_set_timeout($socket, 15);

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

    // HELO/EHLO
    $sendCommand($socket, "EHLO " . ($_SERVER['HTTP_HOST'] ?? 'localhost'));

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
    
    // Send data in larger chunks (32KB instead of 8KB) for faster transfer
    $chunkSize = 32768; 
    $totalLen = strlen($data);
    for ($i = 0; $i < $totalLen; $i += $chunkSize) {
        fwrite($socket, substr($data, $i, $chunkSize));
    }
    fwrite($socket, "\r\n.\r\n");
    
    $res = $getResponse($socket);
    
    // QUIT
    $sendCommand($socket, "QUIT");
    fclose($socket);
    return true;
}
