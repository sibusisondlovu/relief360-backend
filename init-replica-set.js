const { MongoClient } = require('mongodb');

async function initReplicaSet() {
  // Connect without replica set requirement first
  const client = new MongoClient('mongodb://localhost:27017/?directConnection=true');
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected!');
    
    const admin = client.db().admin();
    
    // Check current status
    let status;
    try {
      status = await admin.command({ replSetGetStatus: 1 });
      console.log('Replica set status:', status.set);
    } catch (e) {
      console.log('Replica set not initialized yet');
      status = null;
    }
    
    if (!status || status.set !== 'rs0') {
      console.log('Initializing replica set rs0...');
      try {
        const result = await admin.command({
          replSetInitiate: {
            _id: 'rs0',
            members: [{ _id: 0, host: 'localhost:27017' }]
          }
        });
        console.log('Initiate result:', result);
        console.log('✅ Replica set initialization started. Waiting for primary...');
        
        // Wait for primary to be elected
        let attempts = 0;
        let ready = false;
        while (attempts < 60 && !ready) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            const newStatus = await admin.command({ replSetGetStatus: 1 });
            if (newStatus.members && newStatus.members.some(m => m.stateStr === 'PRIMARY')) {
              console.log('✅ Replica set is ready! Primary elected.');
              ready = true;
            } else {
              console.log(`Waiting for primary... (attempt ${attempts + 1}/60)`);
            }
          } catch (e) {
            console.log(`Waiting... (attempt ${attempts + 1}/60)`);
          }
          attempts++;
        }
        
        if (!ready) {
          console.log('⚠️  Replica set initialization may still be in progress');
        }
      } catch (error) {
        if (error.message.includes('already initialized')) {
          console.log('✅ Replica set already initialized');
        } else {
          throw error;
        }
      }
    } else {
      console.log('✅ Replica set rs0 already initialized');
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

initReplicaSet();

