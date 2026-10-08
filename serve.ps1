# Native PowerShell Static Web Server
# Hosts the /client folder on http://localhost:8000

$port = 8000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "🚀 Frontend Server successfully started!" -ForegroundColor Green
    Write-Host "🔗 Access URL: http://localhost:$port/" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C in this terminal to stop the server." -ForegroundColor Yellow
    
    $basePath = Join-Path $PSScriptRoot "client"

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $url = $request.Url.LocalPath
        if ($url -eq "/" -or $url -eq "") { 
            $url = "/index.html" 
        }
        
        # Prevent path traversal
        $url = $url.Replace("..", "")
        $filePath = Join-Path $basePath $url

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            # Map common MIME types
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = "text/plain"
            if ($ext -eq ".html" -or $ext -eq ".htm") { $contentType = "text/html" }
            elseif ($ext -eq ".css") { $contentType = "text/css" }
            elseif ($ext -eq ".js") { $contentType = "text/javascript" }
            elseif ($ext -eq ".png") { $contentType = "image/png" }
            elseif ($ext -eq ".jpg" -or $ext -eq ".jpeg") { $contentType = "image/jpeg" }
            elseif ($ext -eq ".svg") { $contentType = "image/svg+xml" }
            elseif ($ext -eq ".json") { $contentType = "application/json" }
            
            # CORS headers to allow local requests
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found - File does not exist")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    }
}
catch {
    Write-Host "❌ Failed to start listener or connection error: $_" -ForegroundColor Red
}
finally {
    if ($listener) {
        $listener.Stop()
        $listener.Close()
    }
}
