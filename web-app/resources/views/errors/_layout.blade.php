<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ $code }} — {{ $title }}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #030712;
      color: #f9fafb;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      margin-bottom: 3.5rem;
      text-decoration: none;
    }
    .logo-icon {
      width: 2.25rem;
      height: 2.25rem;
      background: linear-gradient(135deg, #7c3aed, #5b21b6);
      border-radius: 0.625rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-text {
      font-size: 1.25rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.02em;
    }
    .code {
      font-size: clamp(5rem, 15vw, 9rem);
      font-weight: 800;
      line-height: 1;
      background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 1.25rem;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #f3f4f6;
      margin-bottom: 0.75rem;
    }
    p {
      color: #6b7280;
      font-size: 0.9375rem;
      max-width: 30rem;
      line-height: 1.65;
    }
    .actions {
      margin-top: 2.5rem;
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      justify-content: center;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.625rem 1.375rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.15s ease;
      cursor: pointer;
      border: none;
    }
    .btn-primary {
      background: #7c3aed;
      color: #fff;
    }
    .btn-primary:hover { background: #6d28d9; }
    .btn-secondary {
      border: 1px solid #1f2937;
      background: transparent;
      color: #9ca3af;
    }
    .btn-secondary:hover { border-color: #374151; color: #e5e7eb; }
    .status-dot {
      display: inline-block;
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: #ef4444;
      margin-right: 0.5rem;
    }
    .status-label {
      display: inline-flex;
      align-items: center;
      margin-top: 2.5rem;
      font-size: 0.75rem;
      color: #4b5563;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 9999px;
      padding: 0.375rem 0.875rem;
    }
  </style>
</head>
<body>
  <a href="/" class="logo">
    <div class="logo-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    </div>
    <span class="logo-text">4uTest</span>
  </a>

  <div class="code">{{ $code }}</div>
  <h1>{{ $title }}</h1>
  <p>{{ $message }}</p>

  <div class="actions">
    @if($showBack ?? true)
      <button onclick="history.back()" class="btn btn-secondary">← Go back</button>
    @endif
    <a href="/" class="btn btn-primary">Go home</a>
  </div>

  <div class="status-label">
    <span class="status-dot"></span>
    HTTP {{ $code }}
  </div>
</body>
</html>
