Project was originally created with create-react-app. Worth installing a clean copy to check the latest package.json levels.
Check service worker and index files for changes too.

Steps to re-create or re-install.

1) Clone the base project
git clone ssh://edarnell@diskstation/volume1/git/freemathsReact freemaths

For a clean install of latest versions for packages copy package.sample.json over package.json and then:
npm install react react-dom react-scripts react-bootstrap katex pako exif-js
npm install cypress -D

To check versions to upgrade (note Windows disables scripts on client computer)
powershell -ExecutionPolicy Bypass -File C:\Users\ed\AppData\Roaming\npm\ncu.ps1

Note: you will get errors about eslint and optional dependencies - a fresh install does too.
Note: there may be incompatibility issues to fix with new pachages. Read up on reported issues and fix them. Good to update react-bootstrap.

