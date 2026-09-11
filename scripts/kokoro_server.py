#!/usr/bin/env python3
"""Kokoro TTS HTTP server — POST /speak, DELETE /stop on port 7532."""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
import threading

from kokoro_onnx import Kokoro
import sounddevice as sd

DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(DIR, "kokoro-v0_19.onnx")
VOICES_PATH = os.path.join(DIR, "voices.bin")
DEFAULT_VOICE = os.environ.get("KOKORO_VOICE", "af_bella")
DEFAULT_SPEED = 1.05
PORT = int(os.environ.get("KOKORO_PORT", "7532"))

kokoro = Kokoro(MODEL_PATH, VOICES_PATH)
lock = threading.Lock()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_POST(self):
        if self.path != "/speak":
            self.send_response(404)
            self.end_headers()
            return
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length))
        text = body.get("text", "").strip()
        voice = body.get("voice", DEFAULT_VOICE)
        if not text:
            self.send_response(400)
            self.end_headers()
            return

        def synthesize():
            with lock:
                audio, sr = kokoro.create(text, voice=voice, speed=DEFAULT_SPEED, lang="en-us")
                sd.play(audio, sr)
                sd.wait()

        threading.Thread(target=synthesize, daemon=True).start()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"status":"ok"}')

    def do_DELETE(self):
        if self.path == "/stop":
            sd.stop()
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'{"status":"stopped"}')


if __name__ == "__main__":
    print(f"Kokoro TTS server on 127.0.0.1:{PORT} — voice {DEFAULT_VOICE}")
    HTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
