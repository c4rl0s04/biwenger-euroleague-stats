/**
 * Syncs player images from Wikipedia.
 * Updates players who have default/broken Biwenger images.
 * @param {import('better-sqlite3').Database} db - Database instance
 */
export async function syncImages(db) {
  console.log('\n🖼️ Syncing Player Images (Wikipedia)...');
  
  // Get ALL players to ensure we fix wrong matches
  const players = db.prepare("SELECT id, name FROM players").all();
  
  console.log(`Found ${players.length} players to check images for.`);
  
  const updateImage = db.prepare('UPDATE players SET img_url = @img_url WHERE id = @id');
  
  let updatedCount = 0;
  let revertedCount = 0;
  
  for (const player of players) {
      try {
          let found = false;

          // 1. Search Wikipedia for page title
          const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(player.name + " basketball")}&format=json&origin=*`;
          const searchRes = await fetch(searchUrl);
          
          if (searchRes.ok) {
              const searchData = await searchRes.json();
              if (searchData.query && searchData.query.search.length > 0) {
                  const title = searchData.query.search[0].title;
                  
                  // 2. Get page image
                  const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=500&origin=*`;
                  const imgRes = await fetch(imgUrl);
                  
                  if (imgRes.ok) {
                      const imgData = await imgRes.json();
                      const pages = imgData.query.pages;
                      const pageId = Object.keys(pages)[0];
                      const page = pages[pageId];
                      
                      if (page.thumbnail && page.thumbnail.source) {
                          updateImage.run({ img_url: page.thumbnail.source, id: player.id });
                          updatedCount++;
                          found = true;
                          // console.log(`   ✅ Found image for ${player.name} (${title})`);
                      }
                  }
              }
          }

          // 3. Revert to Default if not found (to fix wrong previous matches)
          if (!found) {
               const defaultUrl = `https://biwenger.as.com/face/euroleague/${player.id}.png`;
               updateImage.run({ img_url: defaultUrl, id: player.id });
               revertedCount++;
          }

      } catch (e) {
          console.error(`Error fetching image for ${player.name}:`, e.message);
      }
      // Small delay to be nice (200ms)
      await new Promise(resolve => setTimeout(resolve, 200)); 
  }
  
  console.log(`✅ Updated images for ${updatedCount} players.`);
  console.log(`↩️ Reverted ${revertedCount} players to default.`);
}
