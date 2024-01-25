import BaseHTTPServer, SimpleHTTPServer
import ssl


httpd = BaseHTTPServer.HTTPServer(('0.0.0.0', 8443),
        SimpleHTTPServer.SimpleHTTPRequestHandler)

httpd.socket = ssl.wrap_socket (httpd.socket,
        keyfile="key.pem",
        certfile='cert.pem', server_side=True)

httpd.serve_forever()