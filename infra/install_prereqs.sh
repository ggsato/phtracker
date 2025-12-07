#!/usr/bin/env bash
# Installs missing prerequisites used by the SAM infrastructure scripts.
# Supports Debian/Ubuntu for Docker install; falls back to manual guidance on other platforms.

set -euo pipefail

have() { command -v "$1" >/dev/null 2>&1; }

install_sam() {
  if have sam; then
    echo "[ok] sam is already installed"
    return
  fi
  if ! have python3; then
    echo "[error] python3 is required to install aws-sam-cli via pip" >&2
    exit 1
  fi
  echo "[info] Installing aws-sam-cli via pip..."
  python3 -m pip install --upgrade aws-sam-cli
}

install_docker_debian() {
  echo "[info] Installing Docker (engine + CLI) via apt..."
  sudo apt-get update
  sudo apt-get install -y ca-certificates curl gnupg
  sudo install -m 0755 -d /etc/apt/keyrings
  if [[ ! -f /etc/apt/keyrings/docker.gpg ]]; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  fi
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
  sudo apt-get update
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
}

install_docker() {
  if have docker; then
    echo "[ok] docker is already installed"
    return
  fi
  if have apt-get; then
    install_docker_debian
    return
  fi
  if have brew; then
    echo "[info] Installing docker via Homebrew..."
    brew install docker docker-compose
    echo "[warn] Docker Desktop may still be required to run the daemon on macOS."
    return
  fi
  echo "[error] Unsupported platform for automated Docker install. Please install Docker manually." >&2
  exit 1
}

install_sam
install_docker

echo "[info] Finished prerequisite installation. If you just installed Docker, ensure your user is in the docker group and restart your shell: sudo usermod -aG docker \"$USER\" && newgrp docker"
