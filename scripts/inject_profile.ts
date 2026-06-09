import { User } from '../lib/localDb';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const bioDescription = "Operating straight out of Madison, Wisconsin, Tyrox is an elite multi-platinum record producer. Pioneering precision-engineered acoustic trap rhythms and aggressive dark synth lines, this portal is the definitive vault. Merging high-fidelity sub-bass architecture directly with uncompressed master stems, Tyrox delivers clinical industry-standard track assets for label-ready artists.";

const socialLinks = {
  tiktok: "https://tiktok.com/@tyrox.made.this",
  instagram: "https://instagram.com/tyroxmadethis/",
  twitter: "https://twitter.com/Tyrox_made_this",
  youtube: "https://youtube.com/@TyroxMadeThis"
};

async function injectProfile() {
  console.log("Starting backend profile data injection...");

  // 1. Inject into local JSON database (users.json)
  try {
    const updatePayload = {
      socialLinks: { ...socialLinks },
      "socialLinks.tiktok": socialLinks.tiktok,
      "socialLinks.instagram": socialLinks.instagram,
      "socialLinks.twitter": socialLinks.twitter,
      "socialLinks.youtube": socialLinks.youtube,
      bio: bioDescription,
      bioDescription: bioDescription
    };

    const result = await User.updateOne(
      { username: "tyrox" },
      updatePayload
    );

    console.log(`Local JSON profile update results:`, result);
  } catch (localError: any) {
    console.error("Error during local JSON profile update:", localError.message);
  }

  // 2. Inject into high-fidelity fallback local_users.json
  try {
    const localUsersPath = path.join(process.cwd(), 'public', 'local_users.json');
    if (fs.existsSync(localUsersPath)) {
      console.log("Updating fallback local_users.json...");
      const fileData = fs.readFileSync(localUsersPath, 'utf8');
      const users = JSON.parse(fileData);
      
      const tyroxUser = users.find((u: any) => u.username === 'tyrox');
      if (tyroxUser) {
        tyroxUser.socialLinks = { ...socialLinks };
        tyroxUser["socialLinks.tiktok"] = socialLinks.tiktok;
        tyroxUser["socialLinks.instagram"] = socialLinks.instagram;
        tyroxUser["socialLinks.twitter"] = socialLinks.twitter;
        tyroxUser["socialLinks.youtube"] = socialLinks.youtube;
        tyroxUser.bio = bioDescription;
        tyroxUser.bioDescription = bioDescription;
        tyroxUser.updatedAt = new Date().toISOString();
        console.log("Updated 'tyrox' user inside local_users.json with Madison WI profile");
      } else {
        // Create user
        users.push({
          _id: "6459fa4f8f4a13bf8eabcc1a",
          username: "tyrox",
          email: "tyroxmadethis@gmail.com",
          enterpriseTier: "VIP Platinum Beat Maker",
          stripeConnectAccountId: "acct_tyrox_exclusive_123",
          socialLinks: { ...socialLinks },
          "socialLinks.tiktok": socialLinks.tiktok,
          "socialLinks.instagram": socialLinks.instagram,
          "socialLinks.twitter": socialLinks.twitter,
          "socialLinks.youtube": socialLinks.youtube,
          bio: bioDescription,
          bioDescription: bioDescription,
          profilePictureUrl: "/static/images/tyrox_profile.jpg",
          bannerPictureUrl: "/banner.jpg",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log("Created 'tyrox' user entry in local_users.json");
      }
      
      fs.writeFileSync(localUsersPath, JSON.stringify(users, null, 2), 'utf8');
      console.log("local_users.json saved successfully.");
    } else {
      console.log("local_users.json file not found at path:", localUsersPath);
    }
  } catch (fileError: any) {
    console.error("Error updating local_users.json file:", fileError.message);
  }

  console.log("Profile data injection finished!");
  process.exit(0);
}

injectProfile();
