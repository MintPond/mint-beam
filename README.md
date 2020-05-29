mint-beam
=========

[Beam Coin](https://beam.mw/) API clients and utils for NodeJS used by [MintPond Mining Pool](https://mintpond.com).

## Install ##
__Install as Dependency in NodeJS Project__
```bash
# Install from Github NPM repository

npm config set @mintpond:registry https://npm.pkg.github.com/mintpond
npm config set //npm.pkg.github.com/:_authToken <PERSONAL_ACCESS_TOKEN>

npm install @mintpond/mint-beam@0.7.0 --save
```
[Creating a personal access token](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line)

__Install & Test__
```bash
# Install nodejs v10
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install nodejs -y

# Download mint-beam
git clone https://github.com/MintPond/mint-beam

# build & test
cd mint-beam
npm install
npm test
``` 