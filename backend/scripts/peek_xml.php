<?php
$url = 'https://storage.googleapis.com/jr-databox-syndication-public/syndication/aggregators/vigyapanam/jobrapido_Vigyapanam_IN.xml';
$x = file_get_contents($url);
echo 'length: ' . strlen($x) . "\n";
echo $x;
