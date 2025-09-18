const fs = require('fs');
const path = require('path');

// List of files that were modified
const filesToRestore = [
  'src/app/dashboard/page.tsx',
  'src/app/dashboard/chatters/page.tsx',
  'src/app/dashboard/models/page.tsx',
  'src/app/dashboard/reports/page.tsx',
  'src/app/dashboard/insights/page.tsx',
  'src/app/dashboard/team-leaders/page.tsx',
  'src/app/dashboard/team-leaders/assignments/page.tsx',
  'src/app/dashboard/team-leaders/overview/page.tsx'
];

function restoreContent() {
  console.log('🔄 Restoring original content...');
  
  filesToRestore.forEach(filePath => {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Change SHOW_ORIGINAL_CONTENT from false to true
      content = content.replace(
        /const SHOW_ORIGINAL_CONTENT = false;/g,
        'const SHOW_ORIGINAL_CONTENT = true;'
      );
      
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Restored: ${filePath}`);
    } catch (error) {
      console.error(`❌ Error restoring ${filePath}:`, error.message);
    }
  });
  
  console.log('\n🎉 Content restoration complete!');
  console.log('All pages should now show their original content instead of the Coming Soon banner.');
}

function hideContent() {
  console.log('🔄 Hiding content with Coming Soon banners...');
  
  filesToRestore.forEach(filePath => {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Change SHOW_ORIGINAL_CONTENT from true to false
      content = content.replace(
        /const SHOW_ORIGINAL_CONTENT = true;/g,
        'const SHOW_ORIGINAL_CONTENT = false;'
      );
      
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Hidden: ${filePath}`);
    } catch (error) {
      console.error(`❌ Error hiding ${filePath}:`, error.message);
    }
  });
  
  console.log('\n🎉 Content hiding complete!');
  console.log('All pages should now show the Coming Soon banner instead of their original content.');
}

// Check command line arguments
const command = process.argv[2];

if (command === 'restore') {
  restoreContent();
} else if (command === 'hide') {
  hideContent();
} else {
  console.log('Usage:');
  console.log('  node restore-content.js restore  - Show original content');
  console.log('  node restore-content.js hide     - Show Coming Soon banners');
  console.log('');
  console.log('Current status: All pages are showing Coming Soon banners.');
  console.log('To restore original content, run: node restore-content.js restore');
} 