@include('errors._layout', [
    'code'    => 429,
    'title'   => 'Too many requests',
    'message' => "You've made too many requests in a short period. Please wait a moment before trying again.",
    'showBack' => false,
])