import { MongoClient, Db } from 'mongodb';
import fs from 'fs';
import path from 'path';

let cachedDb: Db | null = null;
let cachedClient: MongoClient | null = null;

// Mock database to fall back to when MONGODB_URI is absent, to prevent crash on preview start
class LocalFileDb {
  private mediaPath = path.join(process.cwd(), 'public', 'local_media.json');
  private ordersPath = path.join(process.cwd(), 'public', 'local_orders.json');

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
