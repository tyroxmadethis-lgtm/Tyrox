import { MongoClient } from 'mongodb';

async function clearMockDataAndInitializeZero() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Error: MONGODB_URI environment variable is not defined.");
    console.log("Please make sure you have defined MONGODB_URI in your environment settings.");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log("Connected to system database cluster...");
    
    // Support purging both standard databases to cover all references
    const dbNames = ['enterprise_marketplace', process.env.MONGODB_DB || 'tyrox_beats'];
    
    for (const dbName of dbNames) {
      console.log(`\nInitializing database '${dbName}' to absolute zero...`);
      const db = client.db(dbName);

      // 1. Purge the sample fake sales history log collections
      await db.collection('transactions').deleteMany({});
      console.log(`✓ [${dbName}] Cleared all transaction ledger items.`);

      // 2. Purge the mock free download action items
      await db.collection('free_downloads').deleteMany({});
      console.log(`✓ [${dbName}] Cleared all download telemetry hooks.`);

      // 3. Purge mock track listings so you can upload your clean real beats
      await db.collection('tracks').deleteMany({});
      console.log(`✓ [${dbName}] Purged old beat catalog slots.`);
    }

    console.log("\n[SYSTEM STATUS]: Dashboard database initialized successfully at absolute 0.");
  } catch (error) {
    console.error("Database initialization failed:", error);
  } finally {
    await client.close();
  }
}

clearMockDataAndInitializeZero();
