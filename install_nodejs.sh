#!/bin/bash

# 基本工具
sudo apt update
sudo apt install -y curl ca-certificates git build-essential

# 安裝 nvm（固定版本或把 v0.39.7 換成最新）
NVM_VERSION="v0.39.7"
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/$NVM_VERSION/install.sh | bash

# 重新載入 nvm（或關掉再開一個 WSL 視窗也可）
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"

# 驗證 nvm
nvm -v

# 安裝與啟用 Node LTS
nvm install --lts
nvm use --lts
nvm alias default 'lts/*'

# 檢查
node -v
npm -v