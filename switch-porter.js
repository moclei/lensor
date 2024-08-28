const { execSync } = require('child_process');
   const fs = require('fs');

   const useLocal = () => {
     try {
       execSync('npm link porter-source', { stdio: 'inherit' });
       console.log('Switched to local version of porter-source');
     } catch (error) {
       console.error('Failed to switch to local version:', error);
     }
   };

   const usePublished = () => {
     try {
       execSync('npm unlink porter-source', { stdio: 'inherit' });
       execSync('npm install', { stdio: 'inherit' });
       console.log('Switched to published version of porter-source');
     } catch (error) {
       console.error('Failed to switch to published version:', error);
     }
   };

   const command = process.argv[2];

   if (command === 'local') {
     useLocal();
   } else if (command === 'published') {
     usePublished();
   } else {
     console.log('Usage: node switch-porter.js [local|published]');
   }