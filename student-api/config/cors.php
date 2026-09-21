<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | The API is token-based: the client sends an "Authorization: Bearer ..."
    | header, and no cookies are used, so "supports_credentials" stays false and
    | the allowed origins can be listed explicitly instead of using "*".
    |
    | Add your own front-end origins through the CORS_ALLOWED_ORIGINS variable
    | (comma separated) in .env when one is introduced. Postman, curl, and other
    | non-browser clients are not affected by CORS.
    |
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    'allowed_origins' => array_filter(explode(',', (string) env('CORS_ALLOWED_ORIGINS', 'http://localhost'))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Accept', 'Authorization', 'Content-Type'],

    'exposed_headers' => [],

    'max_age' => 3600,

    'supports_credentials' => false,

];
