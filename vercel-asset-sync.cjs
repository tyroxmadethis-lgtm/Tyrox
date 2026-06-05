const fs = require('fs');
const path = require('path');

// 1. Define the static paths built into your production environment
const ASSET_CONFIG = {
  profilePath: 'https://ibb.co',
  bannerPath: 'https://ibb.co',
  defaultPrice: '29.99',
  maxTags: 58
};

// 2. Automate verification during the Vercel build phase
function verifyDeploymentAssets() {
  const publicDir = path.join(__dirname, 'public');
  
  const requiredFiles = ['profile.jpg', 'banner.jpg'];
  let missingFiles = [];

  requiredFiles.forEach(file => {
    if (!fs.existsSync(path.join(publicDir, file))) {
      missingFiles.push(file);
    }
  });

  if (missingFiles.length > 0) {
    console.warn(`⚠️ Warning: Missing ${missingFiles.join(', ')} in /public folder.`);
    console.log("Creating fallback placeholders to prevent deployment errors...");
    
    missingFiles.forEach(file => {
      // Create the directories if they don't exist
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      // If we have a genuine profile picture under static/images, we can copy or link it!
      if (file === 'profile.jpg') {
        const sourceProfile = path.join(publicDir, 'static', 'images', 'tyrox_profile.jpg');
        if (fs.existsSync(sourceProfile)) {
          fs.copyFileSync(sourceProfile, path.join(publicDir, file));
          console.log(`✨ Synergized profile.jpg with verified high-fidelity tyrox_profile.jpg!`);
          return;
        }
      }
      
      fs.writeFileSync(path.join(publicDir, file), ''); 
      console.log(`📝 Generated blank fallback placeholder for: ${file}`);
    });
  } else {
    console.log("✅ Asset Sync: Profile and banner images verified for production build.");
  }
}

// 3. Export configuration for your layout forms
module.exports = {
  ASSET_CONFIG,
  verifyDeploymentAssets
};

// Run validation immediately if executed as a build step
if (require.main === module) {
  verifyDeploymentAssets();
}
