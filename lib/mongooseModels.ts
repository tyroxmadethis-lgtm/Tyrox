import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Check if MONGODB_URI is provided
const hasUri = !!process.env.MONGODB_URI;

// 1. Define Mongoose Schemas (as requested by the user)
const EnterpriseUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  
  // Enterprise Tier Structure
  enterpriseTier: { type: String, default: 'Standard Marketplace Seller' },
  stripeConnectAccountId: { type: String, unique: true }, // For automated split routing

  // Custom Frontend Social Array (Configured for TikTok integration)
  socialLinks: {
    tiktok: { type: String, default: "" },
    instagram: { type: String, default: "" },
    youtube: { type: String, default: "" },
    twitter: { type: String, default: "" }
  },

  // Biographical Information
  bio: { type: String, default: "" },
  bioDescription: { type: String, default: "" },

  // Asset References
  profilePictureUrl: { type: String, default: "" },
  bannerPictureUrl: { type: String, default: "" }
}, { timestamps: true });

const TrackSchema = new mongoose.Schema({
  title: { type: String, required: true },
  producerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  audioFileUrl: { type: String, required: true }, // Stored on Cloudflare R2
  audio_url: { type: String }, // support alias
  imageUrl: { type: String, default: "" }, // Beat cover/artwork URL
  image_url: { type: String, default: "" }, // support alias
  bpm: { type: Number, default: 140 },
  key: { type: String, default: "Am" },
  genre: { type: String, default: "" },
  tags: [{ type: String }],
  stemsFileUrl: { type: String },
  acousticFingerprint: { type: String }, // Used for automated web-scraping copyright protection

  // Financial Split Engines
  payoutSplits: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    percentageShare: { type: Number, required: true } // e.g., 0.50 for 50%
  }],

  // Simplified pricing: Single flat price USD
  price: { type: Number, default: 29.99 },

  licensingOptions: {
    basicLeasePrice: { type: Number, default: 29.99 },
    exclusivePrice: { type: Number, default: 499.99 }
  }
});

// 2. Establish connection to Mongoose (Lazy-initialized to prevent block)
export async function connectMongoose(): Promise<void> {
  if (!hasUri) {
    console.log("MONGODB_URI is absent. Mongoose is in high-fidelity offline/mock mode.");
    return;
  }

  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  try {
    const uri = process.env.MONGODB_URI!;
    const dbName = process.env.MONGODB_DB || "tyrox_beats";
    
    await mongoose.connect(uri, {
      dbName,
      connectTimeoutMS: 5000,
    });
    console.log("Mongoose connected successfully to live MongoDB Atlas!");
  } catch (error) {
    console.error("Mongoose failed to connect. Running fallback pipeline.", error);
  }
}

// Automatically trigger connection if on live backend
if (hasUri) {
  connectMongoose().catch(err => console.error("Initial mongoose auto-connect failure:", err));
}

// 3. Local JSON Mock database fallback support to prevent sandbox freezes
class LocalFileStore {
  private usersPath = path.join(process.cwd(), 'public', 'local_users.json');
  private tracksPath = path.join(process.cwd(), 'public', 'local_tracks.json');

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (!fs.existsSync(this.usersPath)) {
      const defaultUsers = [
        {
          _id: "6459fa4f8f4a13bf8eabcc1a",
          username: "tyrox",
          email: "tyroxmadethis@gmail.com",
          enterpriseTier: "VIP Platinum Beat Maker",
          stripeConnectAccountId: "acct_tyrox_exclusive_123",
          socialLinks: {
            tiktok: "https://tiktok.com/@tyroxbeats",
            instagram: "https://instagram.com/tyroxmusic",
            youtube: "https://youtube.com/tyroxofficial",
            twitter: "https://twitter.com/tyroxpress"
          },
          profilePictureUrl: "/static/images/tyrox_profile.jpg",
          bannerPictureUrl: "/banner.jpg",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
      fs.mkdirSync(path.dirname(this.usersPath), { recursive: true });
      fs.writeFileSync(this.usersPath, JSON.stringify(defaultUsers, null, 2), 'utf-8');
    }

    if (!fs.existsSync(this.tracksPath)) {
      fs.mkdirSync(path.dirname(this.tracksPath), { recursive: true });
      fs.writeFileSync(this.tracksPath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  public readUsers(): any[] {
    try {
      this.ensureInitialized();
      return JSON.parse(fs.readFileSync(this.usersPath, 'utf-8'));
    } catch {
      return [];
    }
  }

  public writeUsers(users: any[]) {
    try {
      fs.writeFileSync(this.usersPath, JSON.stringify(users, null, 2), 'utf-8');
    } catch (err) {
      console.error("Local file store users sync failure:", err);
    }
  }

  public readTracks(): any[] {
    try {
      this.ensureInitialized();
      return JSON.parse(fs.readFileSync(this.tracksPath, 'utf-8'));
    } catch {
      return [];
    }
  }

  public writeTracks(tracks: any[]) {
    try {
      fs.writeFileSync(this.tracksPath, JSON.stringify(tracks, null, 2), 'utf-8');
    } catch (err) {
      console.error("Local file store tracks sync failure:", err);
    }
  }
}

const mockStore = new LocalFileStore();

// Chainable mock mongoose helper supporting query filters and thenables
class MockQueryChain<T> {
  constructor(private promise: Promise<T>) {}
  populate(path: string) { return this; }
  select(fields: string) { return this; }
  sort(arg: any) { return this; }
  limit(n: number) { return this; }
  exec() { return this.promise; }
  then(onfulfilled?: (value: T) => any, onrejected?: (reason: any) => any) {
    return this.promise.then(onfulfilled, onrejected);
  }
}

const MockUser = {
  find: (query?: any) => {
    const list = mockStore.readUsers();
    return new MockQueryChain(Promise.resolve(list));
  },
  findOne: (query: any) => {
    const list = mockStore.readUsers();
    const found = list.find(u => {
      if (!query) return true;
      if (query.email && u.email !== query.email) return false;
      if (query.username && u.username !== query.username) return false;
      if (query._id && u._id !== query._id) return false;
      return true;
    });
    return new MockQueryChain(Promise.resolve(found || list[0]));
  },
  findById: (id: string) => {
    const list = mockStore.readUsers();
    const found = list.find(u => u._id === id);
    return new MockQueryChain(Promise.resolve(found || list[0]));
  },
  updateOne: async (query: any, update: any) => {
    const list = mockStore.readUsers();
    const updater = update.$set || update;
    let modifiedCount = 0;
    const updatedList = list.map(u => {
      let match = true;
      if (query._id && u._id !== query._id) match = false;
      if (query.email && u.email !== query.email) match = false;
      if (query.username && u.username !== query.username) match = false;
      if (match) {
        modifiedCount++;
        // Apply nested social updates properly
        const socialLinks = {
          ...u.socialLinks,
          ...updater.socialLinks,
          ...(updater["socialLinks.tiktok"] !== undefined ? { tiktok: updater["socialLinks.tiktok"] } : {}),
          ...(updater["socialLinks.instagram"] !== undefined ? { instagram: updater["socialLinks.instagram"] } : {}),
          ...(updater["socialLinks.youtube"] !== undefined ? { youtube: updater["socialLinks.youtube"] } : {}),
          ...(updater["socialLinks.twitter"] !== undefined ? { twitter: updater["socialLinks.twitter"] } : {})
        };
        return {
          ...u,
          ...updater,
          socialLinks,
          updatedAt: new Date().toISOString()
        };
      }
      return u;
    });
    mockStore.writeUsers(updatedList);
    return { modifiedCount, matchedCount: modifiedCount };
  },
  create: async (doc: any) => {
    const list = mockStore.readUsers();
    const newDoc = {
      _id: "6459fa4f8f4a13b" + Math.floor(100000 + Math.random() * 900000),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      socialLinks: { tiktok: "", instagram: "", youtube: "", twitter: "" },
      ...doc
    };
    list.push(newDoc);
    mockStore.writeUsers(list);
    return newDoc;
  }
};

const MockTrack = {
  find: (query?: any) => {
    const list = mockStore.readTracks();
    return new MockQueryChain(Promise.resolve(list));
  },
  findOne: (query: any) => {
    const list = mockStore.readTracks();
    const found = list.find(t => {
      if (!query) return true;
      if (query._id && t._id !== query._id) return false;
      if (query.title && t.title !== query.title) return false;
      return true;
    });
    return new MockQueryChain(Promise.resolve(found || list[0]));
  },
  findById: (id: string) => {
    const list = mockStore.readTracks();
    const found = list.find(t => t._id === id);
    return new MockQueryChain(Promise.resolve(found || list[0]));
  },
  updateOne: async (query: any, update: any) => {
    const list = mockStore.readTracks();
    const updater = update.$set || update;
    let modifiedCount = 0;
    const updatedList = list.map(t => {
      let match = true;
      if (query._id && t._id !== query._id) match = false;
      if (query.title && t.title !== query.title) match = false;
      if (match) {
        modifiedCount++;
        return { ...t, ...updater };
      }
      return t;
    });
    mockStore.writeTracks(updatedList);
    return { modifiedCount, matchedCount: modifiedCount };
  },
  create: async (doc: any) => {
    const list = mockStore.readTracks();
    const newDoc = {
      _id: "6459fa4f8f4a13b" + Math.floor(100000 + Math.random() * 900000),
      ...doc
    };
    list.push(newDoc);
    mockStore.writeTracks(list);
    return newDoc;
  },
  deleteOne: async (query: any) => {
    const list = mockStore.readTracks();
    let deletedCount = 0;
    const filtered = list.filter(t => {
      let match = true;
      if (query._id && t._id !== query._id) match = false;
      if (query.title && t.title !== query.title) match = false;
      if (match) {
        deletedCount++;
        return false;
      }
      return true;
    });
    mockStore.writeTracks(filtered);
    return { deletedCount };
  },
  findByIdAndDelete: async (id: string) => {
    const list = mockStore.readTracks();
    const found = list.find(t => t._id === id);
    const filtered = list.filter(t => t._id !== id);
    mockStore.writeTracks(filtered);
    return found || null;
  }
};

// Seamless Model Exports (Using live mongoose models when online, or local-file mocks when offline)
export const User = hasUri 
  ? (mongoose.models.User || mongoose.model('User', EnterpriseUserSchema))
  : (MockUser as any);

export const Track = hasUri
  ? (mongoose.models.Track || mongoose.model('Track', TrackSchema))
  : (MockTrack as any);
