<?php
$url = 'https://feeds.whatjobs.com/vigyapanam/vigyapanam_en_IN.xml';
$ctx = stream_context_create([
    'http' => [
        'timeout' => 90,
        'header' => "User-Agent: Mozilla/5.0 (compatible; JobOrioFeedBot/1.0)\r\nAccept: application/xml\r\n",
    ],
]);
$x = @file_get_contents($url, false, $ctx);
echo 'length: '.strlen((string) $x)."\n";
echo substr((string) $x, 0, 500);
