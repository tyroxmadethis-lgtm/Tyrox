import fs from 'fs';
import path from 'path';

function copyAssets() {
  console.log("Starting assets copy task...");

  const srcDir = path.join(process.cwd(), 'src', 'assets', 'images');
  const publicStaticImagesDir = path.join(process.cwd(), 'public', 'static', 'images');
  const publicDir = path.join(process.cwd(), 'public');

  // Ensure directories exist
  if (!fs.existsSync(publicStaticImagesDir)) {
    fs.mkdirSync(publicStaticImagesDir, { recursive: true });
    console.log("Created directory:", publicStaticImagesDir);
  }

  // Define files to copy
  const srcProfilePath = path.join(srcDir, 'actual_profile_1780372248244.png');
  const srcBannerPath = path.join(srcDir, 'banner_1780462130745.png');

  const destProfilePath = path.join(publicStaticImagesDir, 'tyrox_profile.jpg');
  const destBannerPath = path.join(publicDir, 'banner.jpg');

  if (fs.existsSync(srcProfilePath)) {
    fs.copyFileSync(srcProfilePath, destProfilePath);
    console.log(`Successfully copied ${srcProfilePath} to ${destProfilePath}`);
  } else {
    // Try to find any profile file matching actual_profile_*.png
    const files = fs.readdirSync(srcDir);
    const matchedProfile = files.find(file => file.startsWith('actual_profile_') || file.startsWith('profile_avatar_'));
    if (matchedProfile) {
      const fullPath = path.join(srcDir, matchedProfile);
      fs.copyFileSync(fullPath, destProfilePath);
      console.log(`Successfully copied matched profile ${fullPath} to ${destProfilePath}`);
    } else {
      console.warn("No custom profile file found to copy.");
    }
  }

  if (fs.existsSync(srcBannerPath)) {
    fs.copyFileSync(srcBannerPath, destBannerPath);
    console.log(`Successfully copied ${srcBannerPath} to ${destBannerPath}`);
  } else {
    // Try to find any banner file matching banner_*.png or tyrox_banner_*.png
    const files = fs.readdirSync(srcDir);
    const matchedBanner = files.find(file => file.startsWith('banner_') || file.startsWith('tyrox_banner_'));
    if (matchedBanner) {
      const fullPath = path.join(srcDir, matchedBanner);
      fs.copyFileSync(fullPath, destBannerPath);
      console.log(`Successfully copied matched banner ${fullPath} to ${destBannerPath}`);
    } else {
      console.warn("No custom banner file found to copy.");
    }
  }

  console.log("Assets copy task completed successfully!");
}

copyAssets();
