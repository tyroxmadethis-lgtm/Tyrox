import { MongoClient, Db } from 'mongodb';
import fs from 'fs';
import path from 'path';

let cachedDb: Db | null = null;
let cachedClient: MongoClient | null = null;

// Mock database to fall back to when MONGODB_URI is absent, to prevent crash on preview start
class LocalFileDb {
  private mediaPath = path.join(process.cwd(), 'public', 'local_media.json');
  private ordersPath = path.join(process.cwd(), 'public', 'local_orders.json');

  private transactionsPath = path.join(process.cwd(), 'public', 'local_transactions.json');
  private freeDownloadsPath = path.join(process.cwd(), 'public', 'local_free_downloads.json');
  private contractsPath = path.join(process.cwd(), 'public', 'local_contracts.json');

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    // Populate default media collection if it does not exist
    if (!fs.existsSync(this.mediaPath)) {
      const defaultMedia = [
        {
          artistId: "tyrox",
          masterAudioUrls: [
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
          ],
          coverArtFront: "/static/images/tyrox_profile.jpg",
          coverArtBack: "/banner.jpg",
          vinylCenterLabel: "/static/images/tyrox_profile.jpg"
        }
      ];
      fs.mkdirSync(path.dirname(this.mediaPath), { recursive: true });
      fs.writeFileSync(this.mediaPath, JSON.stringify(defaultMedia, null, 2), 'utf-8');
    }

    if (!fs.existsSync(this.ordersPath)) {
      const defaultOrders = [
        {
          _id: "order_123",
          status: "Pending",
          trackingId: ""
        }
      ];
      fs.writeFileSync(this.ordersPath, JSON.stringify(defaultOrders, null, 2), 'utf-8');
    }

    if (!fs.existsSync(this.transactionsPath)) {
      fs.writeFileSync(this.transactionsPath, JSON.stringify([], null, 2), 'utf-8');
    }

    if (!fs.existsSync(this.freeDownloadsPath)) {
      fs.writeFileSync(this.freeDownloadsPath, JSON.stringify([], null, 2), 'utf-8');
    }

    if (!fs.existsSync(this.contractsPath)) {
      fs.writeFileSync(this.contractsPath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  private readMedia(): any[] {
    try {
      this.ensureInitialized();
      return JSON.parse(fs.readFileSync(this.mediaPath, 'utf-8'));
    } catch {
      return [];
    }
  }

  private readOrders(): any[] {
    try {
      this.ensureInitialized();
      return JSON.parse(fs.readFileSync(this.ordersPath, 'utf-8'));
    } catch {
      return [];
    }
  }

  private writeOrders(orders: any[]) {
    try {
      fs.writeFileSync(this.ordersPath, JSON.stringify(orders, null, 2), 'utf-8');
    } catch (err) {
      console.error("Error writing orders json db:", err);
    }
  }

  private readCollection(name: string): any[] {
    this.ensureInitialized();
    const filePath = name === 'transactions' ? this.transactionsPath :
                     name === 'free_downloads' ? this.freeDownloadsPath :
                     name === 'contracts' ? this.contractsPath : null;
    if (!filePath) return [];
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      return [];
    }
  }

  private writeCollection(name: string, items: any[]) {
    const filePath = name === 'transactions' ? this.transactionsPath :
                     name === 'free_downloads' ? this.freeDownloadsPath :
                     name === 'contracts' ? this.contractsPath : null;
    if (!filePath) return;
    try {
      fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Error writing ${name} json db:`, err);
    }
  }

  public collection(name: string) {
    if (name === 'media') {
      return {
        findOne: async (query: { artistId?: string }) => {
          const media = this.readMedia();
          const target = query.artistId ? query.artistId : "tyrox";
          return media.find(m => m.artistId === target) || media[0];
        }
      };
    } else if (name === 'orders') {
      return {
        updateOne: async (query: { _id?: string }, update: { $set: { status: string; trackingId: string } }) => {
          const orders = this.readOrders();
          const orderId = query._id || "order_123";
          let found = false;
          const updated = orders.map(o => {
            if (o._id === orderId) {
              found = true;
              return { ...o, ...update.$set };
            }
            return o;
          });

          if (!found) {
            updated.push({ _id: orderId, ...update.$set });
          }
          this.writeOrders(updated);
          return { modifiedCount: 1 };
        }
      };
    } else if (name === 'transactions' || name === 'free_downloads' || name === 'contracts') {
      return {
        countDocuments: async () => {
          return this.readCollection(name).length;
        },
        insertOne: async (doc: any) => {
          const items = this.readCollection(name);
          const newDoc = { _id: doc._id || Math.random().toString(36).substring(7), ...doc };
          items.push(newDoc);
          this.writeCollection(name, items);
          return { insertedId: newDoc._id };
        },
        insertMany: async (docs: any[]) => {
          const items = this.readCollection(name);
          const newDocs = docs.map(doc => ({ _id: doc._id || Math.random().toString(36).substring(7), ...doc }));
          items.push(...newDocs);
          this.writeCollection(name, items);
          return { insertedCount: newDocs.length };
        },
        deleteMany: async () => {
          this.writeCollection(name, []);
          return { deletedCount: 999 };
        },
        find: (query = {}) => {
          let items = this.readCollection(name);
          // Simple mock chains
          const chain = {
            sort: () => chain,
            limit: () => chain,
            toArray: async () => items
          };
          return chain;
        },
        aggregate: (pipeline: any[] = []) => {
          const items = this.readCollection(name);
          // Specifically handle payload total payout aggregation
          let total = 0;
          items.forEach(item => {
            const payout = parseFloat(item.payout || 0);
            if (!isNaN(payout)) {
              total += payout;
            }
          });
          return {
            toArray: async () => [{ _id: null, total }]
          };
        }
      };
    }

    throw new Error(`Collection ${name} is not mocked/configured`);
  }
}

export async function connectToDatabase(): Promise<any> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log("MONGODB_URI not found in env variables. Using high-performance LocalFileDb fallback.");
    return new LocalFileDb();
  }

  try {
    if (cachedDb) {
      return cachedDb;
    }

    const options = {
      connectTimeoutMS: 5000,
    };

    const client = new MongoClient(uri, options);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || "tyrox_beats");
    
    cachedClient = client;
    cachedDb = db;
    
    console.log("Successfully connected to live MongoDB Atlas!");
    return db;
  } catch (error) {
    console.error("Failed to connect to MongoDB URI. Dropping back to LocalFileDb fallback.", error);
    return new LocalFileDb();
  }
}
