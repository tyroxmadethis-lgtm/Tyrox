import { User, connectMongoose } from '../lib/mongooseModels';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const bioDescription = "Southside is a legendary multi-platinum record producer and the key architect of 808 Mafia. Pioneering the dark, aggressive, gritty trap sound that defined modern hip-hop, he has produced hits for Future, Drake, Travis Scott, Young Thug, and Lil Baby. This portal serves as the exclusive primary vault for unreleased custom stems and official enterprise beat licensing.";

const socialLinks = {
  tiktok: "tiktok.com",
  instagram: "instagram.com",
  twitter: "twitter.com",
  youtube: "youtube.com"
};

async function injectProfile() {
  console.log("Starting backend profile data injection...");

  // 1. Inject into Mongoose/MongoDB (if MONGODB_URI is available)
  try {
    if (process.env.MONGODB_URI) {
      await connectMongoose();
      console.log("Connected to MongoDB for profile update...");
      
      const updatePayload = {
        "socialLinks.tiktok": socialLinks.tiktok,
        "socialLinks.instagram": socialLinks.instagram,
        "socialLinks.twitter": socialLinks.twitter,
        "socialLinks.youtube": socialLinks.youtube,
        // Since we want to ensure bio field is updated in User
        "bio": bioDescription,
        // Also support any top-level key matching
        "bioDescription": bioDescription
      };

      const result = await User.updateOne(
        { username: "tyrox" },
        { 
          $set: updatePayload 
        },
        { upsert: true }
      );

      console.log(`MongoDB profile update database results:`, result);
    } else {
      console.log("No MONGODB_URI found; skipping live Mongo database update.");
    }
  } catch (mongoError: any) {
    console.error("Error during MongoDB profile update:", mongoError.message);
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
        tyroxUser.bio = bioDescription;
        tyroxUser.bioDescription = bioDescription;
        tyroxUser.updatedAt = new Date().toISOString();
        console.log("Updated 'tyrox' user inside local_users.json");
      } else {
        // Create user
        users.push({
          _id: "6459fa4f8f4a13bf8eabcc1a",
          username: "tyrox",
          email: "tyroxmadethis@gmail.com",
          enterpriseTier: "VIP Platinum Beat Maker",
          stripeConnectAccountId: "acct_tyrox_exclusive_123",
          socialLinks: { ...socialLinks },
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
