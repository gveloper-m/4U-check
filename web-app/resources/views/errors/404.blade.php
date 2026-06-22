@include('errors._layout', [
    'code'    => 404,
    'title'   => 'Page not found',
    'message' => "The page you're looking for doesn't exist or may have been moved.",
    'showBack' => true,
])