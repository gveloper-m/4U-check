@include('errors._layout', [
    'code'    => 500,
    'title'   => 'Server error',
    'message' => "Something went wrong on our end. We've been notified and are working on it. Please try again later.",
    'showBack' => true,
])