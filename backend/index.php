<?php

/**
 * Fallback front controller when the web server document root is `backend/`
 * instead of `backend/public/`. Normal requests are handled via `.htaccess`
 * rewrites into `public/`; this file supports hosts that resolve `/backend/` to index.php.
 */
require __DIR__.'/public/index.php';
