@include('errors._layout', [
    'code'    => 401,
    'title'   => 'Authentication required',
    'message' => 'You need to be logged in to access this page.',
    'showBack' => false,
])