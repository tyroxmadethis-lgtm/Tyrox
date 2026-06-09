import fs from "fs";
import path from "path";

const beatsPath = path.join(process.cwd(), "beats.json");
const usersPath = path.join(process.cwd(), "users.json");

// Ensure default track database exists
function ensureBeatsInitialized() {
  if (!fs.existsSync(beatsPath)) {
    const defaultBeats: any[] = [];
    fs.mkdirSync(path.dirname(beatsPath), { recursive: true });
    fs.writeFileSync(beatsPath, JSON.stringify(defaultBeats, null, 2), "utf-8");
  }
}

// Ensure default user database exists
function ensureUsersInitialized() {
  if (!fs.existsSync(usersPath)) {
    const defaultUsers = [
      {
        _id: "6459fa4f8f4a13bf8eabcc1a",
        username: "tyrox",
        email: "tyroxmadethis@gmail.com",
        enterpriseTier: "VIP Platinum Beat Maker",
        stripeConnectAccountId: "acct_tyrox_exclusive_123",
        socialLinks: {
          tiktok: "https://tiktok.com/@tyrox.made.this",
          instagram: "https://instagram.com/tyroxmadethis/",
          youtube: "https://youtube.com/@TyroxMadeThis",
          twitter: "https://twitter.com/Tyrox_made_this"
        },
        bio: "Operating straight out of Madison, Wisconsin, Tyrox is an elite multi-platinum record producer...",
        bioDescription: "Operating straight out of Madison, Wisconsin, Tyrox is an elite multi-platinum record producer. Pioneering precision-engineered acoustic trap rhythms and aggressive dark synth lines, this portal is the definitive vault. Merging high-fidelity sub-bass architecture directly with uncompressed master stems, Tyrox delivers clinical industry-standard track assets for label-ready artists.",
        profilePictureUrl: "/static/images/tyrox_profile.jpg",
        bannerPictureUrl: "/banner.jpg",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    fs.mkdirSync(path.dirname(usersPath), { recursive: true });
    fs.writeFileSync(usersPath, JSON.stringify(defaultUsers, null, 2), "utf-8");
  }
}

// Low-level helper streams
export function readLocalBeats(): any[] {
  ensureBeatsInitialized();
  try {
    return JSON.parse(fs.readFileSync(beatsPath, "utf-8"));
  } catch (err) {
    console.error("[LocalDb] Error reading beats.json, returning empty list", err);
    return [];
  }
}

export function writeLocalBeats(beats: any[]) {
  try {
    fs.writeFileSync(beatsPath, JSON.stringify(beats, null, 2), "utf-8");
  } catch (err) {
    console.error("[LocalDb] Error writing to beats.json", err);
  }
}

export function readLocalUsers(): any[] {
  ensureUsersInitialized();
  try {
    return JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  } catch (err) {
    console.error("[LocalDb] Error reading users.json, returning empty list", err);
    return [];
  }
}

export function writeLocalUsers(users: any[]) {
  try {
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("[LocalDb] Error writing to users.json", err);
  }
}

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

// Emulates Mongoose/MongoDB model querying for Track entries
export const Track = {
  find: (query?: any) => {
    const list = readLocalBeats();
    return new MockQueryChain(Promise.resolve(list));
  },
  findOne: (query: any) => {
    const list = readLocalBeats();
    const found = list.find(t => {
      if (!query) return true;
      if (query._id && String(t._id) !== String(query._id)) return false;
      if (query.title && t.title !== query.title) return false;
      return true;
    });
    return new MockQueryChain(Promise.resolve(found || list[0]));
  },
  findById: (id: string) => {
    const list = readLocalBeats();
    const found = list.find(t => String(t._id) === String(id));
    return new MockQueryChain(Promise.resolve(found || null));
  },
  updateOne: async (query: any, update: any, options?: any) => {
    const list = readLocalBeats();
    const updater = update.$set || update;
    let modifiedCount = 0;
    const updatedList = list.map(t => {
      let match = true;
      if (query._id && String(t._id) !== String(query._id)) match = false;
      if (query.title && t.title !== query.title) match = false;
      if (match) {
        modifiedCount++;
        return { ...t, ...updater };
      }
      return t;
    });
    writeLocalBeats(updatedList);
    return { modifiedCount, matchedCount: modifiedCount };
  },
  findByIdAndUpdate: async (id: string, update: any) => {
    const list = readLocalBeats();
    let foundTrack: any = null;
    const updatedList = list.map(t => {
      if (String(t._id) === String(id)) {
        let updated = { ...t };
        if (update.$inc) {
          for (const key of Object.keys(update.$inc)) {
            updated[key] = (updated[key] || 0) + update.$inc[key];
          }
        }
        if (update.$set) {
          updated = { ...updated, ...update.$set };
        } else if (!update.$inc) {
          updated = { ...updated, ...update };
        }
        foundTrack = updated;
        return updated;
      }
      return t;
    });
    writeLocalBeats(updatedList);
    return foundTrack;
  },
  create: async (doc: any) => {
    const list = readLocalBeats();
    const cleanId = doc._id || "beat_" + Math.floor(100000 + Math.random() * 900000);
    const peaks = doc.peaks || Array.from({ length: 120 }, () => parseFloat((0.2 + Math.random() * 0.7).toFixed(3)));
    const newDoc = {
      _id: cleanId,
      id: cleanId,
      downloads: 0,
      plays: 0,
      streams: 0,
      createdAt: new Date().toISOString(),
      ...doc,
      peaks,
      waveform_peaks: peaks,
      waveformPeaks: peaks
    };
    list.push(newDoc);
    writeLocalBeats(list);
    return newDoc;
  },
  deleteOne: async (query: any) => {
    const list = readLocalBeats();
    let deletedCount = 0;
    const filtered = list.filter(t => {
      let match = true;
      if (query._id && String(t._id) !== String(query._id)) match = false;
      if (query.title && t.title !== query.title) match = false;
      if (match) {
        deletedCount++;
        return false;
      }
      return true;
    });
    writeLocalBeats(filtered);
    return { deletedCount };
  },
  findByIdAndDelete: async (id: string) => {
    const list = readLocalBeats();
    const found = list.find(t => String(t._id) === String(id));
    const filtered = list.filter(t => String(t._id) !== String(id));
    writeLocalBeats(filtered);
    return found || null;
  }
};

// Emulates Mongoose/MongoDB model querying for User entries
export const User = {
  find: (query?: any) => {
    const list = readLocalUsers();
    return new MockQueryChain(Promise.resolve(list));
  },
  findOne: (query: any) => {
    const list = readLocalUsers();
    const found = list.find(u => {
      if (!query) return true;
      if (query.email && u.email !== query.email) return false;
      if (query.username && u.username !== query.username) return false;
      if (query._id && String(u._id) !== String(query._id)) return false;
      return true;
    });
    return new MockQueryChain(Promise.resolve(found || list[0]));
  },
  findById: (id: string) => {
    const list = readLocalUsers();
    const found = list.find(u => String(u._id) === String(id));
    return new MockQueryChain(Promise.resolve(found || list[0]));
  },
  updateOne: async (query: any, update: any, options?: any) => {
    const list = readLocalUsers();
    const updater = update.$set || update;
    let modifiedCount = 0;
    const updatedList = list.map(u => {
      let match = true;
      if (query._id && String(u._id) !== String(query._id)) match = false;
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
    writeLocalUsers(updatedList);
    return { modifiedCount, matchedCount: modifiedCount };
  },
  create: async (doc: any) => {
    const list = readLocalUsers();
    const newDoc = {
      _id: "user_" + Math.floor(100000 + Math.random() * 900000),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      socialLinks: { tiktok: "", instagram: "", youtube: "", twitter: "" },
      ...doc
    };
    list.push(newDoc);
    writeLocalUsers(list);
    return newDoc;
  }
};

export async function connectToDatabase(): Promise<any> {
  return {
    collection: (name: string) => {
      const beatsPath = path.join(process.cwd(), "beats.json");
      const usersPath = path.join(process.cwd(), "users.json");
      
      const ensureInitialized = () => {
        if (!fs.existsSync(beatsPath)) { writeLocalBeats([]); }
        if (!fs.existsSync(usersPath)) { writeLocalUsers([]); }
      };

      return {
        findOne: async (query: any) => {
          ensureInitialized();
          if (name === "media") {
            return { artistId: "tyrox", coverArtFront: "/static/images/tyrox_profile.jpg" };
          }
          if (name === "users") {
            const list = readLocalUsers();
            return list[0] || null;
          }
          return null;
        },
        updateOne: async () => ({ modifiedCount: 1 }),
        countDocuments: async () => 0,
        insertOne: async (doc: any) => ({ insertedId: doc._id || "123" }),
        insertMany: async (docs: any[]) => ({ insertedCount: docs.length }),
        deleteMany: async () => ({ deletedCount: 0 }),
        find: () => ({
          sort: () => ({ limit: () => ({ toArray: async () => [] }) })
        }),
        aggregate: () => ({
          toArray: async () => [{ _id: null, total: 0 }]
        })
      };
    }
  };
}
