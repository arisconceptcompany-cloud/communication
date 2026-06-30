#!/usr/bin/env python3
"""Déploiement SSH vers VPS Contabo (mot de passe via env CONTABO_ROOT_PASSWORD)."""
import os
import sys
import time
from pathlib import Path

import paramiko

HOST = os.environ.get("CONTABO_HOST", "167.86.118.96")
USER = "root"
PASSWORD = os.environ.get("CONTABO_ROOT_PASSWORD", "")
ROOT = Path(__file__).resolve().parent.parent
ZIP_PATH = ROOT / "dist" / "valueit-intranet-contabo.zip"
ENV_PATH = ROOT / ".env.contabo"
REMOTE_DIR = "/opt/valueit-intranet"


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 600) -> tuple[int, str, str]:
    print(f">>> {cmd[:120]}...")
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out[-4000:] if len(out) > 4000 else out)
    if err.strip() and code != 0:
        print(err[-2000:], file=sys.stderr)
    return code, out, err


def main() -> int:
    if not PASSWORD:
        print("Définir CONTABO_ROOT_PASSWORD", file=sys.stderr)
        return 1
    if not ZIP_PATH.is_file():
        print(f"Archive manquante: {ZIP_PATH}", file=sys.stderr)
        return 1

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connexion {USER}@{HOST}...")
    client.connect(HOST, username=USER, password=PASSWORD, timeout=30, banner_timeout=30)

    run(client, f"mkdir -p {REMOTE_DIR}")

    sftp = client.open_sftp()
    print("Upload archive...")
    sftp.put(str(ZIP_PATH), "/tmp/valueit-intranet.zip")
    if ENV_PATH.is_file():
        print("Upload .env...")
        sftp.put(str(ENV_PATH), "/tmp/valueit-intranet.env")
    sftp.close()

    cmds = f"""
set -e
export DEBIAN_FRONTEND=noninteractive
mkdir -p {REMOTE_DIR}
apt-get update -qq
apt-get install -y -qq unzip ca-certificates curl
rm -rf {REMOTE_DIR}/*
unzip -o /tmp/valueit-intranet.zip -d {REMOTE_DIR}
[ -f /tmp/valueit-intranet.env ] && cp /tmp/valueit-intranet.env {REMOTE_DIR}/.env
chmod +x {REMOTE_DIR}/scripts/deploy-contabo.sh
bash {REMOTE_DIR}/scripts/deploy-contabo.sh
"""
    code, _, _ = run(client, cmds, timeout=1800)
    if code != 0:
        client.close()
        return code

    time.sleep(8)
    code, out, _ = run(client, "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/login || true")
    print(f"HTTP /login : {out.strip()}")

    client.close()
    print(f"\n=== Portail : http://{HOST}:3000/login ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
